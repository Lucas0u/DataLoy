require "rails_helper"

RSpec.describe SaleItem, type: :model do
  it { should belong_to(:sale) }
  it { should validate_presence_of(:product_name) }
  it { should validate_presence_of(:quantity) }
  it { should validate_presence_of(:unit_price) }
end