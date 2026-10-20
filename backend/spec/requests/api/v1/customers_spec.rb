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

  describe "GET /api/v1/customers/:id/coupons" do
    let(:employee) { create(:user, role: :employee, store: store) }
    let(:customer) { create(:customer, store: store) }
    let(:reward) { create(:reward, store: store, name: "Cupom R$ 20") }

    let!(:available) { create(:reward_redemption, store: store, customer: customer, reward: reward) }
    let!(:used) { create(:reward_redemption, :used, store: store, customer: customer, reward: reward) }
    let!(:expired) { create(:reward_redemption, :expired, store: store, customer: customer, reward: reward) }

    it "lista todos os cupons do cliente com o status" do
      get "/api/v1/customers/#{customer.id}/coupons", headers: auth_headers(employee)

      expect(response).to have_http_status(:ok)

      statuses = json_response.to_h { |coupon| [coupon["id"], coupon["status"]] }

      expect(statuses).to eq(
        available.id => "available",
        used.id => "used",
        expired.id => "expired"
      )
    end

    it "filtra só os cupons que podem ser usados" do
      get "/api/v1/customers/#{customer.id}/coupons",
          params: { status: "available" },
          headers: auth_headers(employee)

      expect(json_response.map { |coupon| coupon["id"] }).to eq([available.id])
      expect(json_response.first).to include(
        "code" => available.code,
        "discount_type" => "fixed",
        "discount_value" => 20.0
      )
      expect(json_response.first["reward"]["name"]).to eq("Cupom R$ 20")
    end
  end
end
