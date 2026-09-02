require "rails_helper"

RSpec.describe RewardRedemption, type: :model do
  it { should belong_to(:customer) }
  it { should belong_to(:reward) }
  it { should belong_to(:user) }
  it { should validate_presence_of(:points_used) }
  it { should validate_presence_of(:redeemed_at) }
end