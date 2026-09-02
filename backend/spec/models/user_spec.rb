require "rails_helper"

RSpec.describe User, type: :model do
  describe "validations" do
    subject(:user) { build(:user) }

    it "é válido com atributos válidos" do
      expect(user).to be_valid
    end

    it "exige nome" do
      user.name = nil

      expect(user).not_to be_valid
    end

    it "exige e-mail" do
      user.email = nil

      expect(user).not_to be_valid
    end

    it "não permite e-mail duplicado" do
      create(:user, email: "usuario@teste.com")
      user.email = "usuario@teste.com"

      expect(user).not_to be_valid
    end

    it "possui senha criptografada" do
      user.password = "123456"

      expect(user.password_digest).to be_present
    end
  end

  describe "associations" do
    it "possui muitas vendas" do
      expect(described_class.reflect_on_association(:sales).macro).to eq(:has_many)
    end

    it "possui muitos resgates de recompensas" do
      expect(described_class.reflect_on_association(:reward_redemptions).macro).to eq(:has_many)
    end
  end

  describe "roles" do
    it "possui os perfis admin e employee" do
      expect(User.roles).to include(
        "admin" => 0,
        "employee" => 1
      )
    end
  end
end