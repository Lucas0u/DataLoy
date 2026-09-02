class PointsTransaction < ApplicationRecord
  belongs_to :store
  belongs_to :customer
  belongs_to :sale, optional: true
  belongs_to :user, optional: true

  enum :transaction_type, {
    earned: 0,
    redeemed: 1,
    adjustment: 2
  }
end