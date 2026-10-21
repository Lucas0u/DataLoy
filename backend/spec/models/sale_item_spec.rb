require "rails_helper"

RSpec.describe SaleItem, type: :model do
  it { should belong_to(:sale) }
  it { should validate_presence_of(:product_name) }
  it { should validate_presence_of(:quantity) }
  it { should validate_presence_of(:unit_price) }
  it { should validate_length_of(:product_name).is_at_most(SaleItem::PRODUCT_NAME_MAX_LENGTH) }
end