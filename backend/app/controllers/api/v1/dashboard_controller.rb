class Api::V1::DashboardController < ApplicationController
  before_action :require_admin!

  # GET /api/v1/dashboard
  def index
    render json: {
      overview: overview_metrics,
      points: points_metrics,
      top_customers: top_customers,
      inactive_customers: customers_without_recent_purchases,
      sales_by_month: sales_by_month,
      customers_by_month: customers_by_month,
      most_redeemed_rewards: most_redeemed_rewards
    }, status: :ok
  end

  private

  def overview_metrics
    total_sales = current_store.sales.count
    total_revenue = current_store.sales.sum(:total_amount)

    {
      total_customers: current_store.customers.count,
      active_customers: current_store.customers.active.count,
      total_sales: total_sales,
      total_revenue: total_revenue.to_f,
      average_ticket: total_sales.zero? ? 0 : (total_revenue / total_sales).round(2)
    }
  end

  def points_metrics
    {
      total_earned: current_store.points_transactions
                                .where(transaction_type: :earned)
                                .sum(:points),

      total_redeemed: current_store.points_transactions
                                  .where(transaction_type: :redeemed)
                                  .sum(:points)
                                  .abs,

      total_redemptions: current_store.reward_redemptions.count
    }
  end

  def top_customers
    current_store.customers
                 .joins(:sales)
                 .group("customers.id")
                 .select(
                   "customers.id,
                    customers.name,
                    COUNT(sales.id) AS sales_count,
                    SUM(sales.total_amount) AS total_spent"
                 )
                 .order("total_spent DESC")
                 .limit(5)
                 .map do |customer|
      {
        id: customer.id,
        name: customer.name,
        sales_count: customer.sales_count,
        total_spent: customer.total_spent.to_f
      }
    end
  end

  def customers_without_recent_purchases
    cutoff = 30.days.ago

    current_store.customers
                 .active
                 .where(
                   "id NOT IN (
                     SELECT customer_id
                     FROM sales
                     WHERE created_at >= ?
                       AND store_id = ?
                   )",
                   cutoff,
                   current_store.id
                 )
                 .limit(10)
                 .map do |customer|
      {
        id: customer.id,
        name: customer.name
      }
    end
  end

  def sales_by_month
    current_store.sales
                 .where("created_at >= ?", 6.months.ago)
                 .group(
                   Arel.sql("DATE_TRUNC('month', created_at)")
                 )
                 .order(
                   Arel.sql("DATE_TRUNC('month', created_at)")
                 )
                 .sum(:total_amount)
                 .map do |date, total|
      {
        month: date.strftime("%Y-%m"),
        total: total.to_f
      }
    end
  end

  def customers_by_month
    current_store.customers
                 .where("created_at >= ?", 6.months.ago)
                 .group(
                   Arel.sql("DATE_TRUNC('month', created_at)")
                 )
                 .order(
                   Arel.sql("DATE_TRUNC('month', created_at)")
                 )
                 .count
                 .map do |date, count|
      {
        month: date.strftime("%Y-%m"),
        count: count
      }
    end
  end

  def most_redeemed_rewards
    current_store.rewards
                 .joins(:reward_redemptions)
                 .group("rewards.id")
                 .select(
                   "rewards.id,
                    rewards.name,
                    COUNT(reward_redemptions.id) AS redemptions_count"
                 )
                 .order("redemptions_count DESC")
                 .limit(5)
                 .map do |reward|
      {
        id: reward.id,
        name: reward.name,
        redemptions_count: reward.redemptions_count
      }
    end
  end
end