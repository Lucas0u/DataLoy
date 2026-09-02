FactoryBot.define do
  factory :user do
    store
    sequence(:email) { |n| "user#{n}@dataloy.com" }
    name { Faker::Name.name }
    password { "123456" }
    role { :employee }
    active { true }

    trait :admin do
      role { :admin }
    end
  end
end