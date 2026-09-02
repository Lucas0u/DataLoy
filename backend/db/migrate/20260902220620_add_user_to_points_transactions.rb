class AddUserToPointsTransactions < ActiveRecord::Migration[8.1]
  def change
    add_reference :points_transactions, :user, null: true, foreign_key: true
  end
end