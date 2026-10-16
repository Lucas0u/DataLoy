class AddPaymentToSales < ActiveRecord::Migration[8.1]
  def change
    # pix, dinheiro ou cartao (vendas antigas ficam nulas)
    add_column :sales, :payment_method, :string

    # Taxa do cartão, só quando calculada pelo sistema
    add_column :sales, :card_fee_percentage, :decimal, precision: 5, scale: 2

    # Valor efetivamente cobrado do cliente
    # (no cartão, o valor retornado pela maquininha)
    add_column :sales, :final_amount, :decimal, precision: 10, scale: 2

    add_index :sales, :payment_method
  end
end
