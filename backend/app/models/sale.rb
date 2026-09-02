class Sale < ApplicationRecord
  belongs_to :store
  belongs_to :customer
  belongs_to :user

  has_many :sale_items, dependent: :destroy
  has_many :points_transactions

  validates :total_amount, presence: true
end