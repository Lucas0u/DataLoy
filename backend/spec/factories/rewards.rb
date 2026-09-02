FactoryBot.define do
  factory :reward do
    store
    name { "Recompensa Teste" }
    description { "Descrição de teste" }
    points_required { 50 }
    active { true }
    quantity_available { 10 }
  end
end