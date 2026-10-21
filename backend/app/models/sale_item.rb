class SaleItem < ApplicationRecord
  PRODUCT_NAME_MAX_LENGTH = 60

  belongs_to :sale

  validates :product_name, presence: true, length: { maximum: PRODUCT_NAME_MAX_LENGTH }
  validates :quantity, presence: true
  validates :unit_price, presence: true
end