class AddStoreReferences < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :store, foreign_key: true
    add_reference :customers, :store, foreign_key: true
    add_reference :sales, :store, foreign_key: true
    add_reference :loyalty_rules, :store, foreign_key: true
    add_reference :rewards, :store, foreign_key: true
    add_reference :points_transactions, :store, foreign_key: true
    add_reference :reward_redemptions, :store, foreign_key: true
  end
end