# Cada resgate gera um cupom de desconto associado ao cliente,
# que pode ser usado em uma próxima compra.
class RewardRedemption < ApplicationRecord
  belongs_to :store
  belongs_to :customer
  belongs_to :reward
  belongs_to :user

  # Venda em que o cupom foi utilizado
  has_one :sale

  enum :status, {
    available: 0,
    used: 1
  }

  before_validation :generate_code, on: :create

  validates :points_used, presence: true
  validates :redeemed_at, presence: true
  validates :code, presence: true, uniqueness: true
  validates :discount_type, inclusion: { in: Reward::DISCOUNT_TYPES }
  validates :discount_value, numericality: { greater_than: 0 }, on: :create

  # Cupons que ainda podem ser usados
  scope :usable, lambda {
    available.where("reward_redemptions.expires_at IS NULL OR reward_redemptions.expires_at > ?", Time.current)
  }

  def expired?
    available? && expires_at.present? && expires_at <= Time.current
  end

  def usable?
    available? && !expired?
  end

  # available | used | expired
  def coupon_status
    return "used" if used?
    return "expired" if expired?

    "available"
  end

  def percentage?
    discount_type == "percentage"
  end

  # Desconto em reais sobre o subtotal da compra (nunca maior que o subtotal)
  def discount_for(subtotal)
    base = subtotal.to_d
    value =
      if percentage?
        (base * discount_value.to_d / 100).round(2)
      else
        discount_value.to_d
      end

    [value, base].min
  end

  def as_coupon_json
    {
      id: id,
      code: code,
      status: coupon_status,
      discount_type: discount_type,
      discount_value: discount_value.to_f,
      points_used: points_used,
      redeemed_at: redeemed_at,
      expires_at: expires_at,
      used_at: used_at,
      sale_id: sale&.id,
      reward: { id: reward_id, name: reward&.name },
      customer: { id: customer_id, name: customer&.name },
      user: { id: user_id, name: user&.name }
    }
  end

  private

  def generate_code
    return if code.present?

    loop do
      self.code = "DL-#{SecureRandom.alphanumeric(6).upcase}"
      break unless self.class.exists?(code: code)
    end
  end
end
