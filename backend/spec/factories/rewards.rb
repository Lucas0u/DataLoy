FactoryBot.define do
  factory :reward do
    store
    name { "Recompensa Teste" }
    description { "Descrição de teste" }
    points_required { 50 }
    active { true }
    quantity_available { 10 }
    discount_type { "fixed" }
    discount_value { 20.0 }
    coupon_validity_days { 30 }

    trait :percentage do
      discount_type { "percentage" }
      discount_value { 10 }
    end
  end
end