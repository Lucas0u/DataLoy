FactoryBot.define do
  factory :loyalty_rule do
    store
    points_per_currency_unit { 1.0 }
    active { true }
    active_from { Time.current }
  end
end