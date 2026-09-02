class CreateLoyaltyRules < ActiveRecord::Migration[8.1]
  def change
    create_table :loyalty_rules do |t|
      t.decimal :points_per_currency_unit, precision: 8, scale: 2, null: false, default: 1.0
      t.boolean :active, null: false, default: true
      t.datetime :active_from, null: false

      t.timestamps
    end
  end
end