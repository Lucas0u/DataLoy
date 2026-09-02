class CreateStores < ActiveRecord::Migration[8.1]
  def change
    create_table :stores do |t|
      t.string :name
      t.string :email
      t.string :phone

      t.timestamps
    end
  end
end
