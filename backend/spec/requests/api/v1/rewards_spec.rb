require "rails_helper"

RSpec.describe "Api::V1::Rewards", type: :request do
  let(:store) { create(:store) }
  let(:admin) { create(:user, role: :admin, store: store) }
  let(:employee) { create(:user, role: :employee, store: store) }

  describe "GET /api/v1/rewards" do
    context "quando autenticado" do
      before do
        create(:reward, store: store, name: "Camiseta")
        create(:reward, store: store, name: "Caneca")

        get "/api/v1/rewards", headers: auth_headers(employee)
      end

      it "retorna status 200" do
        expect(response).to have_http_status(:ok)
      end

      it "retorna as recompensas" do
        expect(json_response).to be_an(Array)
        expect(json_response.size).to eq(2)
      end
    end

    context "quando não autenticado" do
      before do
        get "/api/v1/rewards"
      end

      it "retorna status 401" do
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/rewards" do
    let(:valid_params) do
      {
        reward: {
          name: "Camiseta",
          description: "Camiseta DataLoy",
          points_required: 100,
          quantity_available: 10,
          active: true
        }
      }
    end

    context "quando administrador" do
      it "cria uma recompensa" do
        expect {
          post "/api/v1/rewards",
               params: valid_params,
               headers: auth_headers(admin)
        }.to change(Reward, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "quando funcionário" do
      it "retorna 403" do
        post "/api/v1/rewards",
             params: valid_params,
             headers: auth_headers(employee)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/v1/rewards/:id" do
    let(:reward) { create(:reward, store: store, name: "Camiseta") }

    context "quando administrador" do
      it "atualiza a recompensa" do
        patch "/api/v1/rewards/#{reward.id}",
              params: { reward: { name: "Camiseta Premium" } },
              headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(reward.reload.name).to eq("Camiseta Premium")
      end
    end

    context "quando funcionário" do
      it "retorna 403" do
        patch "/api/v1/rewards/#{reward.id}",
              params: { reward: { name: "Alterada" } },
              headers: auth_headers(employee)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/rewards/:id/redeem" do
    let(:customer) { create(:customer, store: store, points_balance: 500) }
    let(:reward) do
      create(
        :reward,
        store: store,
        points_required: 100,
        quantity_available: 10,
        active: true
      )
    end

    it "realiza o resgate quando o cliente possui pontos suficientes" do
      expect {
        post "/api/v1/rewards/#{reward.id}/redeem",
             params: { customer_id: customer.id },
             headers: auth_headers(employee)
      }.to change(RewardRedemption, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(customer.reload.points_balance).to eq(400)
      expect(reward.reload.quantity_available).to eq(9)
    end

    it "não permite resgate sem pontos suficientes" do
      customer.update!(points_balance: 50)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to include("pontos suficientes")
    end

    it "não permite resgate de recompensa inativa" do
      reward.update!(active: false)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to include("não está disponível")
    end

    it "não permite resgate quando não há estoque" do
      reward.update!(quantity_available: 0)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to include("não está disponível")
    end
  end
end