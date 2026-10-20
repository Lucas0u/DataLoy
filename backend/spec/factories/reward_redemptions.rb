FactoryBot.define do
  factory :reward_redemption do
    store
    customer
    reward
    user
    points_used { 10 }
    redeemed_at { Time.current }
    discount_type { "fixed" }
    discount_value { 20.0 }
    status { :available }
    expires_at { 30.days.from_now }

    trait :percentage do
      discount_type { "percentage" }
      discount_value { 10 }
    end

    trait :used do
      status { :used }
      used_at { Time.current }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end
  end
end
