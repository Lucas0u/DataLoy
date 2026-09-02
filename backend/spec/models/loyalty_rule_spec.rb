require "rails_helper"

RSpec.describe LoyaltyRule, type: :model do
  it { should validate_presence_of(:points_per_currency_unit) }
  it { should validate_presence_of(:active_from) }

  describe ".current" do
    it "retorna a regra ativa mais recente" do
      create(:loyalty_rule, active: true, active_from: 2.days.ago, points_per_currency_unit: 1.0)
      recent = create(:loyalty_rule, active: true, active_from: 1.hour.ago, points_per_currency_unit: 2.0)

      expect(LoyaltyRule.current).to eq(recent)
    end

    it "ignora regras inativas" do
      create(:loyalty_rule, active: false, active_from: 1.hour.ago)

      expect(LoyaltyRule.current).to be_nil
    end

    it "ignora regras que ainda não entraram em vigor" do
      create(:loyalty_rule, active: true, active_from: 1.day.from_now)

      expect(LoyaltyRule.current).to be_nil
    end
  end
end