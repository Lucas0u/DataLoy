require "rails_helper"

RSpec.describe Receipts::SaleReceipt do
  let(:store) { create(:store, name: "Miss Story") }
  let(:user) { create(:user, store: store, name: "Domi") }
  let(:customer) do
    create(:customer, store: store, name: "Ana Carolina de Souza", cpf: "12345678900", points_balance: 500)
  end
  let(:coupon) do
    create(:reward_redemption, :used, store: store, customer: customer, code: "DL-ABC123")
  end
  let(:sale) do
    create(:sale, store: store, customer: customer, user: user,
                  total_amount: 100, discount_amount: 20, final_amount: 80,
                  payment_method: "pix", points_earned: 80, reward_redemption: coupon)
  end
  let(:profile) do
    StoreProfile.new(store, {
      "trade_name" => "Miss Story",
      "legal_name" => "Miss Story Comércio LTDA",
      "cnpj" => "12.345.678/0001-90",
      "address" => "Rua Exemplo, 123",
      "city" => "Paulo Afonso - BA",
      "footer" => "Volte sempre!",
      "time_zone" => "America/Bahia",
      "receipt" => { "columns" => 48, "encoding" => "cp850" }
    })
  end

  subject(:receipt) { described_class.new(sale, profile: profile) }

  before do
    create(:sale_item, sale: sale, product_name: "Camiseta básica", quantity: 2, unit_price: 50)
    PointsTransaction.create!(store: store, customer: customer, user: user, sale: sale,
                              transaction_type: :earned, points: 80, balance_after: 580,
                              description: "Pontos gerados pela venda ##{sale.id}")
  end

  describe "#to_text" do
    let(:text) { receipt.to_text }

    it "traz os dados da loja" do
      expect(text).to include("Miss Story Comércio LTDA")
      expect(text).to include("CNPJ: 12.345.678/0001-90")
      expect(text).to include("Paulo Afonso - BA")
    end

    it "traz o nome completo e o CPF parcialmente oculto do cliente" do
      expect(text).to include("Ana Carolina de Souza")
      expect(text).to include("***.456.789-**")
      expect(text).not_to include("123.456.789-00")
    end

    it "traz os itens, o desconto do cupom e o total cobrado" do
      expect(text).to include("Camiseta básica")
      expect(text).to include("2 x 50,00")
      expect(text).to match(/Subtotal\s+100,00/)
      expect(text).to match(/Desconto \(cupom DL-ABC123\)\s+-20,00/)
      expect(text).to match(/TOTAL\s+R\$ 80,00/)
      expect(text).to match(/Pagamento\s+Pix/)
    end

    it "traz os pontos da compra e o saldo total do cliente" do
      expect(text).to match(/Pontos nesta compra\s+\+80/)
      expect(text).to match(/Saldo total de pontos\s+580/)
    end

    it "respeita a largura do papel" do
      expect(text.lines.map { |line| line.chomp.length }.max).to be <= 48
    end
  end

  describe "venda sem cadastro" do
    let(:guest_sale) do
      create(:sale, store: store, customer: nil, guest_name: "Maria da feira", user: user,
                    total_amount: 50, final_amount: 50, payment_method: "dinheiro", points_earned: 0)
    end
    let(:text) { described_class.new(guest_sale, profile: profile).to_text }

    before { create(:sale_item, sale: guest_sale, product_name: "Brinco", quantity: 1, unit_price: 50) }

    it "mostra o nome informado e não mostra CPF" do
      expect(text).to include("Nome: Maria da feira")
      expect(text).to include("Venda sem cadastro")
      expect(text).not_to include("CPF")
    end

    it "não mostra pontos e convida o cliente a se cadastrar" do
      expect(text).not_to include("Saldo total de pontos")
      expect(text).to include("Esta compra não gerou pontos.")
      expect(text).to include("Cadastre-se")
    end
  end

  describe "#to_escpos" do
    let(:bytes) { receipt.to_escpos }

    it "inicia a impressora, escolhe a tabela CP850 e corta o papel" do
      expect(bytes).to start_with("\e@".b)
      expect(bytes).to include("\et\x02".b)
      expect(bytes).to end_with("\x1DVB\x00".b)
    end

    it "converte os acentos para a tabela da impressora" do
      expect(bytes).to include("b\xA0sica".b) # "á" em CP850
    end

    it "remove os acentos quando a impressora não tem tabela de caracteres" do
      profile.data["receipt"]["encoding"] = "ascii"

      expect(described_class.new(sale, profile: profile).to_escpos).to include("Camiseta basica".b)
    end
  end

  describe ".mask_cpf" do
    it "oculta o início e o fim do CPF" do
      expect(described_class.mask_cpf("123.456.789-00")).to eq("***.456.789-**")
    end
  end

  describe ".money" do
    it "formata no padrão brasileiro" do
      expect(described_class.money(1234567.5)).to eq("1.234.567,50")
    end
  end
end
