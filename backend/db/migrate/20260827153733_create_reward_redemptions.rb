class CreateRewardRedemptions < ActiveRecord::Migration[8.1]
  def change
    create_table :reward_redemptions do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :reward, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :points_used, null: false
      t.datetime :redeemed_at, null: false

      t.timestamps
    end
  end
end