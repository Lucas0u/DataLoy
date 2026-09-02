FactoryBot.define do
  factory :sale_item do
    sale
    product_name { "Produto Teste" }
    quantity { 1 }
    unit_price { 10.0 }
  end
end
