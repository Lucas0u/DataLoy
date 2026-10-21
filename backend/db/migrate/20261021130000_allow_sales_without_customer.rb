class AllowSalesWithoutCustomer < ActiveRecord::Migration[8.1]
  def change
    # Venda sem cadastro: não tem cliente vinculado e não gera pontos
    change_column_null :sales, :customer_id, true

    # Nome informado pelo vendedor na venda sem cadastro
    add_column :sales, :guest_name, :string
  end
end
