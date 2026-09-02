FactoryBot.define do
  factory :customer do
    store
    name { Faker::Name.name }
    sequence(:cpf) { |n| n.to_s.rjust(11, "0") }
    phone { "79999999999" }
    sequence(:email) { |n| "cliente#{n}@email.com" }
    status { :active }
    active { true }
    points_balance { 0 }
  end
end