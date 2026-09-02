class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.string :name, null: false
      t.string :cpf, null: false
      t.string :phone
      t.string :email
      t.integer :status, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :points_balance, null: false, default: 0

      t.timestamps
    end
    add_index :customers, :cpf, unique: true
  end
end