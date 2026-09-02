class SaleItem < ApplicationRecord
  belongs_to :sale

  validates :product_name, presence: true
  validates :quantity, presence: true
  validates :unit_price, presence: true
end