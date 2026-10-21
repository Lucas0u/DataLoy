class Customer < ApplicationRecord
  belongs_to :store

  has_many :sales
  has_many :points_transactions
  has_many :reward_redemptions

  enum :status, {
    active: 0,
    inactive: 1
  }

  # Telefone brasileiro: DDD + 8 dígitos (fixo) ou DDD + 9 + 8 dígitos (celular)
  PHONE_FORMAT = /\A[1-9]{2}(?:[2-8]\d{7}|9\d{8})\z/

  before_validation :strip_cpf
  before_validation :strip_phone

  validates :name, presence: true
  validates :cpf, presence: true, uniqueness: true, length: { is: 11 }, format: { with: /\A\d+\z/, message: "deve conter apenas números" }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, presence: true
  validates :phone,
            format: {
              with: PHONE_FORMAT,
              message: "deve seguir o padrão brasileiro: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX"
            },
            allow_blank: true
  validates :points_balance, numericality: { greater_than_or_equal_to: 0 }

  private

  def strip_cpf
    self.cpf = cpf.to_s.gsub(/\D/, "") if cpf.present?
  end

  # Guarda só os números: "(75) 99999-9999" -> "75999999999"
  def strip_phone
    self.phone = phone.to_s.gsub(/\D/, "") if phone.present?
  end
end