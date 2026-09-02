require "rails_helper"

RSpec.describe Reward, type: :model do
  describe "validations" do
    subject(:reward) { build(:reward) }

    it "é válido com atributos válidos" do
      expect(reward).to be_valid
    end

    it "exige nome" do
      reward.name = nil

      expect(reward).not_to be_valid
    end

    it "exige pontos necessários" do
      reward.points_required = nil

      expect(reward).not_to be_valid
    end

    it "não permite pontos necessários menores ou iguais a zero" do
      reward.points_required = 0

      expect(reward).not_to be_valid
    end

    it "não permite quantidade disponível negativa" do
      reward.quantity_available = -1

      expect(reward).not_to be_valid
    end
  end

  describe "#redeemable?" do
    it "retorna true para uma recompensa disponível" do
      reward = build(:reward, active: true, quantity_available: 10)

      expect(reward.redeemable?).to be(true)
    end

    it "retorna false quando está inativa" do
      reward = build(:reward, active: false)

      expect(reward.redeemable?).to be(false)
    end

    it "retorna false quando está expirada" do
      reward = build(:reward, active: true, valid_until: Date.current - 1.day)

      expect(reward.redeemable?).to be(false)
    end

    it "retorna false quando não há estoque" do
      reward = build(:reward, active: true, quantity_available: 0)

      expect(reward.redeemable?).to be(false)
    end

    it "permite recompensa sem limite de estoque" do
      reward = build(:reward, active: true, quantity_available: nil)

      expect(reward.redeemable?).to be(true)
    end
  end

  describe "associations" do
    it "possui muitos resgates" do
      expect(described_class.reflect_on_association(:reward_redemptions).macro).to eq(:has_many)
    end
  end
end