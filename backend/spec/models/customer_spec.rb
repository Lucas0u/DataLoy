require "rails_helper"

RSpec.describe Customer, type: :model do
  describe "validations" do
    subject(:customer) { build(:customer) }

    it "é válido com atributos válidos" do
      expect(customer).to be_valid
    end

    it "exige nome" do
      customer.name = nil

      expect(customer).not_to be_valid
    end

    it "exige CPF" do
      customer.cpf = nil

      expect(customer).not_to be_valid
    end

    it "exige CPF com 11 dígitos" do
      customer.cpf = "1234567890"

      expect(customer).not_to be_valid
    end

    it "aceita CPF formatado e remove a formatação" do
      customer.cpf = "123.456.789-00"
      customer.valid?

      expect(customer.cpf).to eq("12345678900")
    end

    it "não permite CPF duplicado" do
      create(:customer, cpf: "12345678900")
      customer.cpf = "12345678900"

      expect(customer).not_to be_valid
    end

    it "não permite saldo de pontos negativo" do
      customer.points_balance = -1

      expect(customer).not_to be_valid
    end
  end

  describe "associations" do
    it "possui muitas vendas" do
      expect(described_class.reflect_on_association(:sales).macro).to eq(:has_many)
    end

    it "possui muitas transações de pontos" do
      expect(described_class.reflect_on_association(:points_transactions).macro).to eq(:has_many)
    end

    it "possui muitos resgates de recompensas" do
      expect(described_class.reflect_on_association(:reward_redemptions).macro).to eq(:has_many)
    end
  end
end