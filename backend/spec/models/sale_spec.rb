require "rails_helper"

RSpec.describe Sale, type: :model do
  it { should belong_to(:customer) }
  it { should belong_to(:user) }
  it { should have_many(:sale_items).dependent(:destroy) }
  it { should validate_presence_of(:total_amount) }

  describe "forma de pagamento" do
    it "aceita pix, dinheiro e cartão" do
      expect(build(:sale, payment_method: "pix")).to be_valid
      expect(build(:sale, payment_method: "dinheiro")).to be_valid
      expect(build(:sale, :card)).to be_valid
    end

    it "não permite forma de pagamento desconhecida" do
      expect(build(:sale, payment_method: "boleto")).not_to be_valid
    end

    it "exige forma de pagamento em vendas novas" do
      expect(build(:sale, payment_method: nil)).not_to be_valid
    end

    it "exige o valor cobrado no cartão" do
      expect(build(:sale, :card, final_amount: nil)).not_to be_valid
    end

    it "não permite taxa acima de 100%" do
      expect(build(:sale, :card, card_fee_percentage: 101)).not_to be_valid
    end
  end

  describe "limite de valores" do
    it "não permite total acima de 1.000.000" do
      expect(build(:sale, total_amount: 1_000_000.01)).not_to be_valid
    end

    it "não permite valor cobrado acima de 1.000.000" do
      expect(build(:sale, :card, final_amount: 1_000_000.01)).not_to be_valid
    end
  end

  describe "#charged_amount" do
    it "usa o valor cobrado quando informado" do
      expect(build(:sale, :card, total_amount: 100, final_amount: 96.5).charged_amount).to eq(96.5)
    end

    it "usa o total dos produtos em vendas antigas" do
      expect(build(:sale, total_amount: 100, final_amount: nil).charged_amount).to eq(100.0)
    end
  end

  it "remove os itens junto quando a venda é destruída" do
    sale = create(:sale)
    create(:sale_item, sale: sale)

    expect { sale.destroy }.to change(SaleItem, :count).by(-1)
  end
end