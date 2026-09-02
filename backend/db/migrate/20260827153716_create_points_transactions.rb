class CreatePointsTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :points_transactions do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :sale, null: true, foreign_key: true
      t.integer :transaction_type, null: false
      t.integer :points, null: false
      t.integer :balance_after, null: false
      t.string :description

      t.timestamps
    end
  end
end