class CreateRewards < ActiveRecord::Migration[8.1]
  def change
    create_table :rewards do |t|
      t.string :name, null: false
      t.text :description
      t.integer :points_required, null: false
      t.date :valid_until
      t.boolean :active, null: false, default: true
      t.integer :quantity_available

      t.timestamps
    end
  end
end