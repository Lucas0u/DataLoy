require "rails_helper"

RSpec.describe "Api::V1::Sales", type: :request do
  let(:store) { create(:store) }
  let(:admin) { create(:user, role: :admin, store: store) }
  let(:customer) { create(:customer, store: store) }
  let!(:loyalty_rule) { create(:loyalty_rule, store: store, points_per_currency_unit: 1.0) }

  describe "GET /api/v1/sales" do
    context "quando autenticado" do
      before do
        create_list(:sale, 3, store: store, customer: customer, user: admin)

        get "/api/v1/sales", headers: auth_headers(admin)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna a lista de vendas" do
        expect(json_response["data"]).to be_an(Array)
        expect(json_response["data"].size).to eq(3)
      end

      it "retorna os metadados da paginação" do
        expect(json_response["meta"]["total"]).to eq(3)
        expect(json_response["meta"]["page"]).to eq(1)
        expect(json_response["meta"]["per_page"]).to eq(20)
      end
    end

    context "quando não autenticado" do
      before do
        get "/api/v1/sales"
      end

      it "retorna status 401" do
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/sales" do
    let(:sale_params) do
      {
        sale: {
          customer_id: customer.id,
          payment_method: "pix",
          sale_items: [
            {
              product_name: "Camiseta",
              quantity: 2,
              unit_price: 50.0
            }
          ]
        }
      }
    end

    def card_params(final_amount:, card_fee_percentage: nil)
      sale_params.deep_merge(
        sale: {
          payment_method: "cartao",
          final_amount: final_amount,
          card_fee_percentage: card_fee_percentage
        }
      )
    end

    context "quando autenticado" do
      it "cria a venda" do
        expect {
          post "/api/v1/sales",
               params: sale_params,
               headers: auth_headers(admin)
        }.to change(Sale, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "calcula os pontos corretamente" do
        post "/api/v1/sales",
             params: sale_params,
             headers: auth_headers(admin)

        sale = Sale.last

        expect(sale.total_amount).to eq(100.0)
        expect(sale.points_earned).to eq(100)
      end

      it "atualiza o saldo de pontos do cliente" do
        expect {
          post "/api/v1/sales",
               params: sale_params,
               headers: auth_headers(admin)
        }.to change { customer.reload.points_balance }.from(0).to(100)
      end

      it "cria o item da venda" do
        expect {
          post "/api/v1/sales",
               params: sale_params,
               headers: auth_headers(admin)
        }.to change(SaleItem, :count).by(1)

        item = SaleItem.last

        expect(item.product_name).to eq("Camiseta")
        expect(item.quantity).to eq(2)
        expect(item.unit_price).to eq(50.0)
      end

      it "salva a forma de pagamento e usa o total como valor cobrado no Pix" do
        post "/api/v1/sales",
             params: sale_params,
             headers: auth_headers(admin)

        sale = Sale.last

        expect(sale.payment_method).to eq("pix")
        expect(sale.final_amount).to eq(100.0)
        expect(sale.card_fee_percentage).to be_nil
      end

      it "salva o valor da maquininha no cartão" do
        post "/api/v1/sales",
             params: card_params(final_amount: 96.5, card_fee_percentage: 3.5),
             headers: auth_headers(admin)

        expect(response).to have_http_status(:created)

        sale = Sale.last

        expect(sale.payment_method).to eq("cartao")
        expect(sale.final_amount).to eq(96.5)
        expect(sale.card_fee_percentage).to eq(3.5)
      end

      it "calcula os pontos pelo valor dos produtos, não pelo valor cobrado" do
        post "/api/v1/sales",
             params: card_params(final_amount: 96.5),
             headers: auth_headers(admin)

        sale = Sale.last

        expect(sale.total_amount).to eq(100.0)
        expect(sale.points_earned).to eq(100)
      end

      it "cria a transação de pontos" do
        expect {
          post "/api/v1/sales",
               params: sale_params,
               headers: auth_headers(admin)
        }.to change(PointsTransaction, :count).by(1)

        transaction = PointsTransaction.last

        expect(transaction.transaction_type).to eq("earned")
        expect(transaction.points).to eq(100)
        expect(transaction.balance_after).to eq(100)
      end
    end

    context "quando não autenticado" do
      it "retorna status 401" do
        post "/api/v1/sales", params: sale_params

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "quando o cliente não existe" do
      it "retorna status 404" do
        post "/api/v1/sales",
             params: {
               sale: {
                 customer_id: 999_999,
                 sale_items: [
                   {
                     product_name: "Camiseta",
                     quantity: 1,
                     unit_price: 50.0
                   }
                 ]
               }
             },
             headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "com cupom de recompensa" do
      let(:reward) { create(:reward, store: store) }
      let(:coupon) do
        create(:reward_redemption, store: store, customer: customer, reward: reward,
                                   discount_type: "fixed", discount_value: 20)
      end

      def coupon_params(coupon_id)
        sale_params.deep_merge(sale: { coupon_id: coupon_id })
      end

      it "aplica o desconto e marca o cupom como utilizado" do
        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        expect(response).to have_http_status(:created)

        sale = Sale.last

        expect(sale.total_amount).to eq(100.0)
        expect(sale.discount_amount).to eq(20.0)
        expect(sale.final_amount).to eq(80.0)
        expect(sale.reward_redemption).to eq(coupon)
        expect(coupon.reload).to be_used
        expect(coupon.used_at).to be_present
      end

      it "calcula os pontos sobre o valor com desconto" do
        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        expect(Sale.last.points_earned).to eq(80)
        expect(customer.reload.points_balance).to eq(80)
      end

      it "aplica desconto em porcentagem" do
        coupon.update!(discount_type: "percentage", discount_value: 15)

        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        expect(Sale.last.discount_amount).to eq(15.0)
        expect(Sale.last.points_earned).to eq(85)
      end

      it "no cartão usa o valor da maquininha e aplica o cupom nos pontos" do
        params = coupon_params(coupon.id).deep_merge(
          sale: { payment_method: "cartao", final_amount: 77.2 }
        )

        post "/api/v1/sales", params: params, headers: auth_headers(admin)

        sale = Sale.last

        expect(sale.discount_amount).to eq(20.0)
        expect(sale.final_amount).to eq(77.2)
        expect(sale.points_earned).to eq(80)
      end

      it "não permite usar o mesmo cupom duas vezes" do
        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        expect {
          post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)
        }.not_to change(Sale, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("já foi utilizado")
      end

      it "não permite usar cupom vencido" do
        coupon.update!(expires_at: 1.day.ago)

        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_content)
        expect(coupon.reload).to be_available
      end

      it "não permite usar cupom de outro cliente" do
        other_coupon = create(:reward_redemption, store: store, reward: reward,
                                                  customer: create(:customer, store: store))

        post "/api/v1/sales", params: coupon_params(other_coupon.id), headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("Cupom não encontrado")
        expect(other_coupon.reload).to be_available
      end

      it "retorna o cupom e o desconto na listagem de vendas" do
        post "/api/v1/sales", params: coupon_params(coupon.id), headers: auth_headers(admin)

        get "/api/v1/sales", headers: auth_headers(admin)

        sale_json = json_response["data"].first

        expect(sale_json["discount_amount"]).to eq("20.0")
        expect(sale_json["reward_redemption"]["code"]).to eq(coupon.code)
      end
    end

    context "recibo" do
      it "informa que o recibo não foi impresso quando não há impressora" do
        post "/api/v1/sales", params: sale_params, headers: auth_headers(admin)

        expect(response).to have_http_status(:created)
        expect(json_response["receipt"]["printed"]).to be(false)
        expect(json_response["receipt"]["error"]).to include("Nenhuma impressora")
      end

      it "imprime o recibo automaticamente quando há impressora" do
        allow_any_instance_of(StoreProfile).to receive(:printer_configured?).and_return(true)
        expect(Receipts::Printer).to receive(:deliver).once.and_return(true)

        post "/api/v1/sales", params: sale_params, headers: auth_headers(admin)

        expect(json_response["receipt"]["printed"]).to be(true)
      end

      it "registra a venda mesmo se a impressora falhar" do
        allow_any_instance_of(StoreProfile).to receive(:printer_configured?).and_return(true)
        allow(Receipts::Printer).to receive(:deliver)
          .and_raise(Receipts::PrintError, "Impressora desligada")

        expect {
          post "/api/v1/sales", params: sale_params, headers: auth_headers(admin)
        }.to change(Sale, :count).by(1)

        expect(json_response["receipt"]).to include("printed" => false, "error" => "Impressora desligada")
      end
    end

    context "quando a forma de pagamento é inválida" do
      it "retorna status 422 sem forma de pagamento" do
        post "/api/v1/sales",
             params: sale_params.deep_merge(sale: { payment_method: "" }),
             headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "retorna status 422 para forma desconhecida" do
        post "/api/v1/sales",
             params: sale_params.deep_merge(sale: { payment_method: "boleto" }),
             headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "retorna status 422 no cartão sem valor cobrado" do
        expect {
          post "/api/v1/sales",
               params: card_params(final_amount: ""),
               headers: auth_headers(admin)
        }.not_to change(Sale, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "quando os valores passam de 1.000.000" do
      it "recusa preço unitário acima do limite" do
        params = sale_params.deep_dup
        params[:sale][:sale_items][0][:unit_price] = 1_000_001

        post "/api/v1/sales", params: params, headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "recusa total da venda acima do limite" do
        params = sale_params.deep_dup
        params[:sale][:sale_items][0][:quantity] = 3
        params[:sale][:sale_items][0][:unit_price] = 500_000

        post "/api/v1/sales", params: params, headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "recusa valor cobrado acima do limite" do
        post "/api/v1/sales",
             params: card_params(final_amount: 1_000_001),
             headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "quando não existem itens" do
      it "retorna status 422" do
        post "/api/v1/sales",
             params: {
               sale: {
                 customer_id: customer.id,
                 sale_items: []
               }
             },
             headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "recibo de uma venda" do
    let(:sale) { create(:sale, store: store, customer: customer, user: admin) }

    it "GET /api/v1/sales/:id/receipt retorna a prévia em texto" do
      get "/api/v1/sales/#{sale.id}/receipt", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response["text"]).to include("Venda ##{sale.id}")
      expect(json_response["columns"]).to eq(48)
      expect(json_response["printer"]["configured"]).to be(false)
    end

    it "POST /api/v1/sales/:id/print envia o recibo para a impressora" do
      expect(Receipts::Printer).to receive(:deliver).once.and_return(true)

      post "/api/v1/sales/#{sale.id}/print", headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response["printed"]).to be(true)
    end

    it "POST /api/v1/sales/:id/print retorna o erro da impressora" do
      post "/api/v1/sales/#{sale.id}/print", headers: auth_headers(admin)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to include("Nenhuma impressora")
    end

    it "não mostra recibo de venda de outra loja" do
      other_sale = create(:sale)

      get "/api/v1/sales/#{other_sale.id}/receipt", headers: auth_headers(admin)

      expect(response).to have_http_status(:not_found)
    end
  end
end
