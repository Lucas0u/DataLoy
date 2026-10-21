class Reward < ApplicationRecord
  DISCOUNT_TYPES = %w[fixed percentage].freeze

  belongs_to :store

  has_many :reward_redemptions

  # Recompensas que não foram excluídas
  scope :kept, -> { where(deleted_at: nil) }

  validates :name, presence: true
  validates :points_required, presence: true, numericality: { greater_than: 0 }
  validates :quantity_available, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Desconto que o cupom gerado por esta recompensa concede
  validates :discount_type, inclusion: { in: DISCOUNT_TYPES }
  # Obrigatório nas recompensas novas; as antigas (simbólicas) podem ficar
  # sem desconto até o administrador editar, mas não podem ser resgatadas.
  validates :discount_value, presence: true, on: :create
  validates :discount_value,
            numericality: {
              greater_than: 0,
              less_than_or_equal_to: Sale::MAX_AMOUNT
            },
            allow_nil: true
  validates :discount_value,
            numericality: { less_than_or_equal_to: 100 },
            allow_nil: true,
            if: :percentage?

  # Quantos dias o cupom vale após o resgate (vazio = não vence)
  validates :coupon_validity_days,
            numericality: { only_integer: true, greater_than: 0 },
            allow_nil: true

  def percentage?
    discount_type == "percentage"
  end

  def deleted?
    deleted_at.present?
  end

  def redeemable?
    return false if deleted?
    return false unless active?
    return false if discount_value.blank?
    return false if valid_until.present? && valid_until < Date.current
    return false if !quantity_available.nil? && quantity_available <= 0

    true
  end

  # Data de vencimento de um cupom resgatado agora
  def coupon_expiration_from(time = Time.current)
    return nil if coupon_validity_days.blank?

    (time.to_date + coupon_validity_days.days).end_of_day
  end
end
