FactoryBot.define do
  factory :reward_redemption do
    store
    customer
    reward
    user
    points_used { 10 }
    redeemed_at { Time.current }
  end
end