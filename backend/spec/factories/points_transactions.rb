FactoryBot.define do
  factory :points_transaction do
    store
    customer
    sale { nil }
    transaction_type { :earned }
    points { 10 }
    balance_after { 10 }
    description { "Transação de teste" }
  end
end