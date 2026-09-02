require "csv"

class Api::V1::ReportsController < ApplicationController
  before_action :require_admin!

  # GET /api/v1/reports
  def index
    sales = filtered_sales

    total_sales = sales.count
    total_revenue = sales.sum(:total_amount).to_f
    total_points_generated = sales.sum(:points_earned)

    average_ticket =
      if total_sales.positive?
        total_revenue / total_sales
      else
        0
      end

    customers_count = sales.distinct.count(:customer_id)
    highest_sale = sales.maximum(:total_amount).to_f

    average_points_per_sale =
      if total_sales.positive?
        total_points_generated.to_f / total_sales
      else
        0
      end

    render json: {
      filters_applied: {
        start_date: params[:start_date],
        end_date: params[:end_date],
        customer_id: params[:customer_id],
        user_id: params[:user_id]
      },

      summary: {
        total_sales: total_sales,
        total_revenue: total_revenue,
        average_ticket: average_ticket.round(2),
        total_points_generated: total_points_generated,
        customers_count: customers_count,
        highest_sale: highest_sale,
        average_points_per_sale: average_points_per_sale.round(2)
      },

      sales: sales.order(created_at: :desc).as_json(
        only: [:id, :total_amount, :points_earned, :created_at],
        include: {
          customer: { only: [:id, :name] },
          user: { only: [:id, :name] }
        }
      )
    }, status: :ok
  end

  # GET /api/v1/reports/customers
  def customers
    customers = current_store.customers

    total_customers = customers.count
    active_customers = customers.where(status: :active).count
    inactive_customers = customers.where(status: :inactive).count

    total_revenue = current_store.sales.sum(:total_amount).to_f
    total_sales = current_store.sales.count

    customers_with_sales = customers.joins(:sales).distinct.count

    average_ticket =
      if total_sales.positive?
        total_revenue / total_sales
      else
        0
      end

    sales_stats = current_store.sales
                               .group(:customer_id)
                               .select(
                                 "customer_id",
                                 "COUNT(*) AS purchase_count",
                                 "SUM(total_amount) AS total_spent",
                                 "MAX(created_at) AS last_purchase"
                               )

    stats_by_customer = sales_stats.index_by(&:customer_id)

    customer_data = customers.map do |customer|
      stats = stats_by_customer[customer.id]

      purchase_count = stats ? stats.purchase_count.to_i : 0
      total_spent = stats ? stats.total_spent.to_f : 0

      average_ticket_customer =
        if purchase_count.positive?
          total_spent / purchase_count
        else
          0
        end

      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        points_balance: customer.points_balance,
        purchase_count: purchase_count,
        total_spent: total_spent.round(2),
        average_ticket: average_ticket_customer.round(2),
        last_purchase: stats&.last_purchase
      }
    end

    customer_data.sort_by! { |customer| -customer[:total_spent] }

    render json: {
      summary: {
        total_customers: total_customers,
        active_customers: active_customers,
        inactive_customers: inactive_customers,
        customers_with_sales: customers_with_sales,
        total_revenue: total_revenue.round(2),
        average_ticket: average_ticket.round(2)
      },
      customers: customer_data
    }, status: :ok
  end

  # GET /api/v1/reports/export
  def export
    sales = filtered_sales.order(created_at: :desc)

    csv_data = CSV.generate(headers: true) do |csv|
      csv << [
        "ID Venda",
        "Data",
        "Cliente",
        "Colaborador",
        "Valor Total",
        "Pontos Gerados"
      ]

      sales.each do |sale|
        csv << [
          sale.id,
          sale.created_at.strftime("%d/%m/%Y %H:%M"),
          sale.customer.name,
          sale.user.name,
          sale.total_amount,
          sale.points_earned
        ]
      end
    end

    send_data(
      csv_data,
      filename: "relatorio_vendas_#{Date.current}.csv",
      type: "text/csv"
    )
  end

  # GET /api/v1/reports/points
  def points
    transactions = current_store.points_transactions

    total_earned = transactions
      .where(transaction_type: :earned)
      .sum(:points)

    total_redeemed = transactions
      .where(transaction_type: :redeemed)
      .sum(:points)

    total_adjustments = transactions
      .where(transaction_type: :adjustment)
      .sum(:points)

    total_transactions = transactions.count

    customers_with_points = transactions
      .distinct
      .count(:customer_id)

    current_balance = current_store.customers.sum(:points_balance)

    points_stats = transactions
      .group(:customer_id)
      .select(
        "customer_id",
        "SUM(CASE WHEN transaction_type = 0 THEN points ELSE 0 END) AS points_earned",
        "SUM(CASE WHEN transaction_type = 1 THEN points ELSE 0 END) AS points_redeemed",
        "SUM(CASE WHEN transaction_type = 2 THEN points ELSE 0 END) AS points_adjusted",
        "MAX(created_at) AS last_transaction"
      )

    stats_by_customer = points_stats.index_by(&:customer_id)

    customers = current_store.customers

    customer_data = customers.map do |customer|
      stats = stats_by_customer[customer.id]

      {
        id: customer.id,
        name: customer.name,
        status: customer.status,
        points_balance: customer.points_balance,
        points_earned: stats ? stats.points_earned.to_i : 0,
        points_redeemed: stats ? stats.points_redeemed.to_i : 0,
        points_adjusted: stats ? stats.points_adjusted.to_i : 0,
        last_transaction: stats&.last_transaction
      }
    end

    customer_data.sort_by! { |customer| -customer[:points_balance].to_i }

    render json: {
      summary: {
        total_earned: total_earned,
        total_redeemed: total_redeemed,
        total_adjustments: total_adjustments,
        total_transactions: total_transactions,
        customers_with_points: customers_with_points,
        current_balance: current_balance
      },
      customers: customer_data
    }, status: :ok
  end

  # GET /api/v1/reports/movements
  def movements
    transactions = current_store.points_transactions.includes(:customer, :user, :sale)

    if params[:start_date].present?
      transactions = transactions.where("points_transactions.created_at >= ?", Date.parse(params[:start_date]).beginning_of_day)
    end
    if params[:end_date].present?
      transactions = transactions.where("points_transactions.created_at <= ?", Date.parse(params[:end_date]).end_of_day)
    end
    transactions = transactions.where(customer_id: params[:customer_id]) if params[:customer_id].present?
    transactions = transactions.where(transaction_type: params[:transaction_type]) if params[:transaction_type].present?
    transactions = transactions.order(created_at: :desc)

    render json: {
      summary: {
        total_movements: transactions.count,
        total_earned: transactions.where(transaction_type: :earned).sum(:points),
        total_redeemed: transactions.where(transaction_type: :redeemed).sum(:points).abs,
        total_adjustments: transactions.where(transaction_type: :adjustment).count
      },
      movements: transactions.map do |tx|
        {
          id: tx.id,
          type: tx.transaction_type,
          date: tx.created_at,
          customer: tx.customer&.name,
          description: tx.description,
          points: tx.points,
          balance_after: tx.balance_after,
          sale_amount: tx.sale&.total_amount&.to_f,
          user: tx.user&.name
        }
      end
    }, status: :ok
  end

  private

  def filtered_sales
    sales = current_store.sales.includes(:customer, :user)

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])
      sales = sales.where(
        "sales.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])
      sales = sales.where(
        "sales.created_at <= ?",
        end_date.end_of_day
      )
    end

    sales = sales.where(customer_id: params[:customer_id]) if params[:customer_id].present?
    sales = sales.where(user_id: params[:user_id]) if params[:user_id].present?

    sales
  end
end