class AddCouponsToRewards < ActiveRecord::Migration[8.1]
  def up
    # Recompensa = modelo de cupom criado pelo administrador
    change_table :rewards do |t|
      t.string :discount_type, null: false, default: "fixed" # fixed (R$) ou percentage (%)
      t.decimal :discount_value, precision: 10, scale: 2
      t.integer :coupon_validity_days # vazio = cupom não vence
    end

    # Resgate = cupom do cliente
    change_table :reward_redemptions do |t|
      t.string :code
      t.integer :status, null: false, default: 0 # 0 disponível, 1 utilizado
      t.string :discount_type
      t.decimal :discount_value, precision: 10, scale: 2
      t.datetime :expires_at
      t.datetime :used_at
    end

    # Resgates feitos antes desta mudança eram simbólicos (sem desconto):
    # recebem um código e ficam marcados como utilizados.
    execute <<~SQL
      UPDATE reward_redemptions
      SET code = 'ANT-' || id,
          status = 1,
          used_at = redeemed_at,
          discount_type = 'fixed',
          discount_value = 0
    SQL

    change_column_null :reward_redemptions, :code, false
    add_index :reward_redemptions, :code, unique: true
    add_index :reward_redemptions, [:customer_id, :status]

    # Venda: cupom utilizado e desconto aplicado
    add_reference :sales, :reward_redemption, foreign_key: true, index: { unique: true }
    add_column :sales, :discount_amount, :decimal, precision: 10, scale: 2, null: false, default: 0
  end

  def down
    remove_column :sales, :discount_amount
    remove_reference :sales, :reward_redemption, foreign_key: true, index: { unique: true }

    remove_index :reward_redemptions, [:customer_id, :status]
    remove_index :reward_redemptions, :code
    change_table :reward_redemptions do |t|
      t.remove :code, :status, :discount_type, :discount_value, :expires_at, :used_at
    end

    change_table :rewards do |t|
      t.remove :discount_type, :discount_value, :coupon_validity_days
    end
  end
end
