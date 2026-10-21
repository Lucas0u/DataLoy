# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_21_130000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "customers", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "cpf", null: false
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.integer "points_balance", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.index ["cpf"], name: "index_customers_on_cpf", unique: true
    t.index ["store_id"], name: "index_customers_on_store_id"
  end

  create_table "loyalty_rules", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "active_from", null: false
    t.datetime "created_at", null: false
    t.decimal "points_per_currency_unit", precision: 8, scale: 2, default: "1.0", null: false
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.index ["store_id"], name: "index_loyalty_rules_on_store_id"
  end

  create_table "points_transactions", force: :cascade do |t|
    t.integer "balance_after", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "description"
    t.integer "points", null: false
    t.bigint "sale_id"
    t.bigint "store_id"
    t.integer "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["customer_id"], name: "index_points_transactions_on_customer_id"
    t.index ["sale_id"], name: "index_points_transactions_on_sale_id"
    t.index ["store_id"], name: "index_points_transactions_on_store_id"
    t.index ["user_id"], name: "index_points_transactions_on_user_id"
  end

  create_table "reward_redemptions", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "discount_type"
    t.decimal "discount_value", precision: 10, scale: 2
    t.datetime "expires_at"
    t.integer "points_used", null: false
    t.datetime "redeemed_at", null: false
    t.bigint "reward_id", null: false
    t.integer "status", default: 0, null: false
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.bigint "user_id", null: false
    t.index ["code"], name: "index_reward_redemptions_on_code", unique: true
    t.index ["customer_id", "status"], name: "index_reward_redemptions_on_customer_id_and_status"
    t.index ["customer_id"], name: "index_reward_redemptions_on_customer_id"
    t.index ["reward_id"], name: "index_reward_redemptions_on_reward_id"
    t.index ["store_id"], name: "index_reward_redemptions_on_store_id"
    t.index ["user_id"], name: "index_reward_redemptions_on_user_id"
  end

  create_table "rewards", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.integer "coupon_validity_days"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.string "discount_type", default: "fixed", null: false
    t.decimal "discount_value", precision: 10, scale: 2
    t.string "name", null: false
    t.integer "points_required", null: false
    t.integer "quantity_available"
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.date "valid_until"
    t.index ["deleted_at"], name: "index_rewards_on_deleted_at"
    t.index ["store_id"], name: "index_rewards_on_store_id"
  end

  create_table "sale_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "product_name", null: false
    t.integer "quantity", default: 1, null: false
    t.bigint "sale_id", null: false
    t.decimal "unit_price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["sale_id"], name: "index_sale_items_on_sale_id"
  end

  create_table "sales", force: :cascade do |t|
    t.decimal "card_fee_percentage", precision: 5, scale: 2
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.decimal "discount_amount", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "final_amount", precision: 10, scale: 2
    t.string "guest_name"
    t.string "payment_method"
    t.integer "points_earned", default: 0, null: false
    t.bigint "reward_redemption_id"
    t.bigint "store_id"
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["customer_id"], name: "index_sales_on_customer_id"
    t.index ["payment_method"], name: "index_sales_on_payment_method"
    t.index ["reward_redemption_id"], name: "index_sales_on_reward_redemption_id", unique: true
    t.index ["store_id"], name: "index_sales_on_store_id"
    t.index ["user_id"], name: "index_sales_on_user_id"
  end

  create_table "stores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.integer "role", default: 0, null: false
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["store_id"], name: "index_users_on_store_id"
  end

  add_foreign_key "customers", "stores"
  add_foreign_key "loyalty_rules", "stores"
  add_foreign_key "points_transactions", "customers"
  add_foreign_key "points_transactions", "sales"
  add_foreign_key "points_transactions", "stores"
  add_foreign_key "points_transactions", "users"
  add_foreign_key "reward_redemptions", "customers"
  add_foreign_key "reward_redemptions", "rewards"
  add_foreign_key "reward_redemptions", "stores"
  add_foreign_key "reward_redemptions", "users"
  add_foreign_key "rewards", "stores"
  add_foreign_key "sale_items", "sales"
  add_foreign_key "sales", "customers"
  add_foreign_key "sales", "reward_redemptions"
  add_foreign_key "sales", "stores"
  add_foreign_key "sales", "users"
  add_foreign_key "users", "stores"
end
