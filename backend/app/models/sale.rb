class Sale < ApplicationRecord
  PAYMENT_METHODS = %w[pix dinheiro cartao].freeze
  MAX_AMOUNT = 1_000_000

  # Valor efetivamente cobrado; vendas antigas (sem final_amount)
  # continuam usando o total dos produtos.
  CHARGED_AMOUNT_SQL = "COALESCE(sales.final_amount, sales.total_amount)".freeze

  belongs_to :store
  belongs_to :customer
  belongs_to :user

  # Cupom de recompensa utilizado nesta venda (no máximo um)
  belongs_to :reward_redemption, optional: true

  has_many :sale_items, dependent: :destroy
  has_many :points_transactions

  validates :total_amount, presence: true
  validates :total_amount,
            numericality: {
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: MAX_AMOUNT
            },
            allow_nil: true

  # Obrigatório nas vendas novas; vendas antigas podem ficar sem
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }, on: :create
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }, allow_nil: true

  validates :final_amount,
            numericality: {
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: MAX_AMOUNT
            },
            allow_nil: true
  validates :final_amount, presence: true, if: :card?

  validates :discount_amount, numericality: { greater_than_or_equal_to: 0 }

  validates :card_fee_percentage,
            numericality: {
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 100
            },
            allow_nil: true

  def card?
    payment_method == "cartao"
  end

  def charged_amount
    (final_amount || total_amount).to_f
  end

  def payment_method_label
    {
      "pix" => "Pix",
      "dinheiro" => "Dinheiro",
      "cartao" => "Cartão"
    }.fetch(payment_method, "Não informado")
  end
end
