class Store < ApplicationRecord
  has_many :users, dependent: :restrict_with_error
  has_many :customers, dependent: :restrict_with_error
  has_many :sales, dependent: :restrict_with_error
  has_many :loyalty_rules, dependent: :restrict_with_error
  has_many :rewards, dependent: :restrict_with_error
  has_many :points_transactions, dependent: :restrict_with_error
  has_many :reward_redemptions, dependent: :restrict_with_error

  validates :name, presence: true
end