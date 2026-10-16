FactoryBot.define do
  factory :sale do
    store
    customer
    user
    total_amount { 100.0 }
    points_earned { 100 }
    payment_method { "pix" }

    trait :card do
      payment_method { "cartao" }
      final_amount { 96.5 }
      card_fee_percentage { 3.5 }
    end
  end
end