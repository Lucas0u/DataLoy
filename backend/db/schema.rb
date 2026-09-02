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

ActiveRecord::Schema[8.1].define(version: 2026_09_02_220620) do
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
    t.bigint "user_id", null: false
    t.index ["customer_id"], name: "index_points_transactions_on_customer_id"
    t.index ["sale_id"], name: "index_points_transactions_on_sale_id"
    t.index ["store_id"], name: "index_points_transactions_on_store_id"
    t.index ["user_id"], name: "index_points_transactions_on_user_id"
  end

  create_table "reward_redemptions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.integer "points_used", null: false
    t.datetime "redeemed_at", null: false
    t.bigint "reward_id", null: false
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["customer_id"], name: "index_reward_redemptions_on_customer_id"
    t.index ["reward_id"], name: "index_reward_redemptions_on_reward_id"
    t.index ["store_id"], name: "index_reward_redemptions_on_store_id"
    t.index ["user_id"], name: "index_reward_redemptions_on_user_id"
  end

  create_table "rewards", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "points_required", null: false
    t.integer "quantity_available"
    t.bigint "store_id"
    t.datetime "updated_at", null: false
    t.date "valid_until"
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
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.integer "points_earned", default: 0, null: false
    t.bigint "store_id"
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["customer_id"], name: "index_sales_on_customer_id"
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
  add_foreign_key "sales", "stores"
  add_foreign_key "sales", "users"
  add_foreign_key "users", "stores"
end
