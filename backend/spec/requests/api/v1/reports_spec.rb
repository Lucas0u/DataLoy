require "rails_helper"

RSpec.describe "Api::V1::Reports", type: :request do
  let(:store) { create(:store) }
  let(:admin) { create(:user, role: :admin, store: store) }
  let(:employee) { create(:user, role: :employee, store: store) }
  let(:customer) { create(:customer, store: store) }

  describe "GET /api/v1/reports" do
    context "quando administrador" do
      before do
        create(
          :sale,
          store: store,
          customer: customer,
          user: admin,
          total_amount: 100.0,
          points_earned: 100
        )

        get "/api/v1/reports", headers: auth_headers(admin)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna o resumo do relatório" do
        expect(json_response["summary"]).to include(
          "total_sales" => 1,
          "total_revenue" => 100.0,
          "total_points_generated" => 100
        )
      end

      it "retorna a lista de vendas" do
        expect(json_response["sales"]).to be_an(Array)
        expect(json_response["sales"].size).to eq(1)
      end

      it "retorna os filtros aplicados" do
        expect(json_response).to have_key("filters_applied")
        expect(json_response["filters_applied"]).to include(
          "start_date" => nil,
          "end_date" => nil,
          "customer_id" => nil,
          "user_id" => nil
        )
      end
    end

    context "quando funcionário" do
      it "retorna status 403" do
        get "/api/v1/reports", headers: auth_headers(employee)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "quando não autenticado" do
      it "retorna status 401" do
        get "/api/v1/reports"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "quando filtrado por cliente" do
      let(:other_customer) { create(:customer, store: store) }

      before do
        create(
          :sale,
          store: store,
          customer: customer,
          user: admin,
          total_amount: 100.0,
          points_earned: 100
        )

        create(
          :sale,
          store: store,
          customer: other_customer,
          user: admin,
          total_amount: 200.0,
          points_earned: 200
        )

        get "/api/v1/reports",
            params: { customer_id: customer.id },
            headers: auth_headers(admin)
      end

      it "retorna somente as vendas do cliente informado" do
        expect(json_response["summary"]["total_sales"]).to eq(1)
        expect(json_response["summary"]["total_revenue"]).to eq(100.0)
        expect(json_response["sales"].size).to eq(1)
        expect(json_response["sales"].first["customer"]["id"]).to eq(customer.id)
      end
    end
  end

  describe "GET /api/v1/reports/export" do
    context "quando administrador" do
      before do
        create(
          :sale,
          store: store,
          customer: customer,
          user: admin,
          total_amount: 100.0,
          points_earned: 100
        )

        get "/api/v1/reports/export", headers: auth_headers(admin)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna um arquivo CSV" do
        expect(response.media_type).to eq("text/csv")
      end

      it "contém os cabeçalhos do relatório" do
        expect(response.body).to include(
          "ID Venda",
          "Data",
          "Cliente",
          "Colaborador",
          "Valor Total",
          "Pontos Gerados"
        )
      end

      it "contém os dados da venda" do
        expect(response.body).to include(
          customer.name,
          admin.name,
          "100.0",
          "100"
        )
      end
    end

    context "quando funcionário" do
      it "retorna status 403" do
        get "/api/v1/reports/export", headers: auth_headers(employee)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "quando não autenticado" do
      it "retorna status 401" do
        get "/api/v1/reports/export"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end