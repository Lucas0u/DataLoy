class Customer < ApplicationRecord
  belongs_to :store

  has_many :sales
  has_many :points_transactions
  has_many :reward_redemptions

  enum :status, {
    active: 0,
    inactive: 1
  }

  before_validation :strip_cpf

  validates :name, presence: true
  validates :cpf, presence: true, uniqueness: true, length: { is: 11 }, format: { with: /\A\d+\z/, message: "deve conter apenas números" }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, presence: true
  validates :points_balance, numericality: { greater_than_or_equal_to: 0 }

  private

  def strip_cpf
    self.cpf = cpf.to_s.gsub(/\D/, "") if cpf.present?
  end
end