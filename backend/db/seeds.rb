# Loja padrão
store = Store.find_or_create_by!(name: "Miss Story") do |s|
  s.email = "contato@missstory.com"
end

# Usuário administrador
admin = User.find_or_initialize_by(email: "admin@dataloy.com")

admin.name = "Administrador"
admin.password = "123456" if admin.new_record?
admin.role = :admin
admin.active = true
admin.store = store

admin.save!

# Regra de pontuação padrão
# R$ 1,00 gasto = 1 ponto
LoyaltyRule.find_or_create_by!(store: store, active: true) do |rule|
  rule.points_per_currency_unit = 1.0
  rule.active_from = Time.current
end

puts "======================================"
puts "DataLoy - Seed executado com sucesso!"
puts "======================================"
puts "Loja: #{store.name}"
puts "Admin: #{admin.email}"
puts "Regra: R$ 1,00 = 1 ponto"
puts "======================================"