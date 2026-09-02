class LoyaltyRule < ApplicationRecord
  validates :points_per_currency_unit, presence: true, numericality: { greater_than: 0 }
  validates :active_from, presence: true
  belongs_to :store

  

  def self.current
    where(active: true).where("active_from <= ?", Time.current).order(active_from: :desc).first
  end
end