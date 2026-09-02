require "rails_helper"

RSpec.describe PointsTransaction, type: :model do
  it { should belong_to(:customer) }
  it { should belong_to(:sale).optional }

  it "possui os tipos earned, redeemed e adjustment" do
    expect(PointsTransaction.transaction_types.keys).to match_array(%w[earned redeemed adjustment])
  end
end