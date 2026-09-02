class Reward < ApplicationRecord
  belongs_to :store
  
  has_many :reward_redemptions
  
  validates :name, presence: true
  validates :points_required, presence: true, numericality: { greater_than: 0 }
  validates :quantity_available, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def redeemable?
    return false unless active?
    return false if valid_until.present? && valid_until < Date.current
    return false if !quantity_available.nil? && quantity_available <= 0

    true
  end
end