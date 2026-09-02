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
end