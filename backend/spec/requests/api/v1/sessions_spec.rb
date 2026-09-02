require "rails_helper"

RSpec.describe "Login", type: :request do
  let!(:user) { create(:user, email: "teste@dataloy.com", password: "123456") }

  describe "POST /api/v1/login" do
    it "autentica com credenciais válidas e retorna um token" do
      post "/api/v1/login", params: { email: "teste@dataloy.com", password: "123456" }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to have_key("token")
    end

    it "rejeita senha incorreta" do
      post "/api/v1/login", params: { email: "teste@dataloy.com", password: "senha_errada" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejeita e-mail inexistente" do
      post "/api/v1/login", params: { email: "naoexiste@dataloy.com", password: "123456" }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end