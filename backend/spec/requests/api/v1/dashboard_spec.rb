require "rails_helper"

RSpec.describe "Api::V1::Dashboard", type: :request do
  let(:store) { create(:store) }
  let(:admin) { create(:user, role: :admin, store: store) }
  let(:employee) { create(:user, role: :employee, store: store) }

  describe "GET /api/v1/dashboard" do
    context "quando administrador" do
      before do
        create(:customer, store: store, name: "Cliente 1", status: :active)
        create(:customer, store: store, name: "Cliente 2", status: :active)
        create(:customer, store: store, name: "Cliente 3", status: :inactive)

        get "/api/v1/dashboard", headers: auth_headers(admin)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna as métricas principais" do
        expect(json_response).to include(
          "overview",
          "points",
          "top_customers",
          "inactive_customers",
          "sales_by_month",
          "customers_by_month",
          "most_redeemed_rewards",
          "sales_by_payment_method"
        )
      end

      it "retorna a quantidade correta de clientes" do
        expect(json_response["overview"]["total_customers"]).to eq(3)
        expect(json_response["overview"]["active_customers"]).to eq(2)
      end

      it "retorna as métricas de pontos" do
        expect(json_response["points"]).to include(
          "total_earned",
          "total_redeemed",
          "total_redemptions"
        )
      end

      it "retorna arrays nas listas do dashboard" do
        expect(json_response["top_customers"]).to be_an(Array)
        expect(json_response["inactive_customers"]).to be_an(Array)
        expect(json_response["sales_by_month"]).to be_an(Array)
        expect(json_response["customers_by_month"]).to be_an(Array)
        expect(json_response["most_redeemed_rewards"]).to be_an(Array)
      end
    end

    context "com vendas em formas de pagamento diferentes" do
      before do
        customer = create(:customer, store: store)

        create(:sale, store: store, customer: customer, user: admin,
                      payment_method: "pix", total_amount: 50.0, final_amount: 50.0)
        create(:sale, :card, store: store, customer: customer, user: admin,
                             total_amount: 100.0, final_amount: 96.5)

        get "/api/v1/dashboard", headers: auth_headers(admin)
      end

      it "soma o faturamento pelo valor cobrado" do
        expect(json_response["overview"]["total_revenue"]).to eq(146.5)
      end

      it "agrupa as vendas por forma de pagamento" do
        by_method = json_response["sales_by_payment_method"].index_by { |item| item["payment_method"] }

        expect(by_method["cartao"]).to include("sales_count" => 1, "total" => 96.5)
        expect(by_method["pix"]).to include("sales_count" => 1, "total" => 50.0)
      end
    end

    context "com venda sem cadastro" do
      it "continua listando os clientes sem compras recentes" do
        inactive = create(:customer, store: store, name: "Sem compras")
        create(:sale, store: store, customer: nil, guest_name: "Avulso", user: admin)

        get "/api/v1/dashboard", headers: auth_headers(admin)

        names = json_response["inactive_customers"].map { |customer| customer["name"] }

        expect(names).to include(inactive.name)
      end
    end

    context "quando funcionário" do
      it "retorna status 403" do
        get "/api/v1/dashboard", headers: auth_headers(employee)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "quando não autenticado" do
      it "retorna status 401" do
        get "/api/v1/dashboard"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end