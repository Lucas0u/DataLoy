require "rails_helper"

RSpec.describe "Api::V1::Customers", type: :request do
  let(:store) { create(:store) }
  let(:admin) { create(:user, role: :admin, store: store) }

  describe "GET /api/v1/customers" do
    context "quando autenticado" do
      before do
        create_list(:customer, 3, store: store)

        get "/api/v1/customers", headers: auth_headers(admin)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna a lista de clientes" do
        expect(json_response["data"]).to be_an(Array)
        expect(json_response["data"].size).to eq(3)
      end
    end

    context "quando não autenticado" do
      before do
        get "/api/v1/customers"
      end

      it "retorna status 401" do
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end