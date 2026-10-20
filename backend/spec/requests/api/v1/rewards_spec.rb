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
          active: true,
          discount_type: "percentage",
          discount_value: 10,
          coupon_validity_days: 15
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

        reward = Reward.last

        expect(reward.discount_type).to eq("percentage")
        expect(reward.discount_value).to eq(10)
        expect(reward.coupon_validity_days).to eq(15)
      end

      it "não cria recompensa sem desconto" do
        post "/api/v1/rewards",
             params: valid_params.deep_merge(reward: { discount_value: nil }),
             headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_content)
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

    it "gera um cupom de desconto para o cliente" do
      reward.update!(discount_type: "fixed", discount_value: 25, coupon_validity_days: 30)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      coupon = RewardRedemption.last

      expect(coupon.customer).to eq(customer)
      expect(coupon.user).to eq(employee)
      expect(coupon).to be_available
      expect(coupon.discount_type).to eq("fixed")
      expect(coupon.discount_value).to eq(25)
      expect(coupon.expires_at.to_date).to eq(Date.current + 30)

      expect(json_response).to include(
        "code" => coupon.code,
        "status" => "available",
        "points_balance" => 400
      )
    end

    it "gera cupom sem vencimento quando a validade está vazia" do
      reward.update!(coupon_validity_days: nil)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(RewardRedemption.last.expires_at).to be_nil
    end

    it "mantém o desconto do cupom mesmo se a recompensa for alterada depois" do
      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      reward.update!(discount_value: 99)

      expect(RewardRedemption.last.discount_value).to eq(20)
    end

    it "não permite resgate de recompensa sem desconto definido" do
      reward.update_column(:discount_value, nil)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(response).to have_http_status(:unprocessable_content)
      expect(customer.reload.points_balance).to eq(500)
    end

    it "não permite resgate para cliente inativo" do
      customer.update!(status: :inactive)

      post "/api/v1/rewards/#{reward.id}/redeem",
           params: { customer_id: customer.id },
           headers: auth_headers(employee)

      expect(response).to have_http_status(:unprocessable_content)
      expect(RewardRedemption.count).to eq(0)
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