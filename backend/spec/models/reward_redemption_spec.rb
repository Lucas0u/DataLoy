require "rails_helper"

RSpec.describe RewardRedemption, type: :model do
  it { should belong_to(:customer) }
  it { should belong_to(:reward) }
  it { should belong_to(:user) }
  it { should validate_presence_of(:points_used) }
  it { should validate_presence_of(:redeemed_at) }

  describe "código do cupom" do
    it "gera um código único ao criar" do
      coupon = create(:reward_redemption)

      expect(coupon.code).to match(/\ADL-[A-Z0-9]{6}\z/)
    end
  end

  describe "#coupon_status e #usable?" do
    it "está disponível quando não foi usado nem venceu" do
      coupon = build(:reward_redemption)

      expect(coupon.coupon_status).to eq("available")
      expect(coupon.usable?).to be(true)
    end

    it "está vencido quando passou da validade" do
      coupon = build(:reward_redemption, :expired)

      expect(coupon.coupon_status).to eq("expired")
      expect(coupon.usable?).to be(false)
    end

    it "está utilizado depois de usado numa venda" do
      coupon = build(:reward_redemption, :used)

      expect(coupon.coupon_status).to eq("used")
      expect(coupon.usable?).to be(false)
    end

    it "não vence quando não tem data de validade" do
      coupon = build(:reward_redemption, expires_at: nil)

      expect(coupon.usable?).to be(true)
    end
  end

  describe ".usable" do
    it "traz só cupons disponíveis e dentro da validade" do
      customer = create(:customer)
      usable = create(:reward_redemption, customer: customer)
      create(:reward_redemption, :used, customer: customer)
      create(:reward_redemption, :expired, customer: customer)

      expect(customer.reward_redemptions.usable).to contain_exactly(usable)
    end
  end

  describe "#discount_for" do
    it "aplica valor fixo" do
      coupon = build(:reward_redemption, discount_value: 20)

      expect(coupon.discount_for(100)).to eq(20)
    end

    it "aplica porcentagem" do
      coupon = build(:reward_redemption, :percentage, discount_value: 10)

      expect(coupon.discount_for(155.50)).to eq(BigDecimal("15.55"))
    end

    it "nunca passa do valor da compra" do
      coupon = build(:reward_redemption, discount_value: 50)

      expect(coupon.discount_for(30)).to eq(30)
    end
  end
end
