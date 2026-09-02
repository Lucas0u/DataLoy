class RewardRedemption < ApplicationRecord
  belongs_to :store
  belongs_to :customer
  belongs_to :reward
  belongs_to :user

  validates :points_used, presence: true
  validates :redeemed_at, presence: true
end