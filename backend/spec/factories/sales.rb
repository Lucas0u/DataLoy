FactoryBot.define do
  factory :sale do
    store
    customer
    user
    total_amount { 100.0 }
    points_earned { 100 }
  end
end