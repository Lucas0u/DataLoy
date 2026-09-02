class User < ApplicationRecord
  has_secure_password

  belongs_to :store

  has_many :sales
  has_many :reward_redemptions

  enum :role, {
    admin: 0,
    employee: 1
  }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
end