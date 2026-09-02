class Api::V1::CustomersController < ApplicationController
  before_action :set_customer, only: [:show, :update, :deactivate, :points_history]

  # GET /api/v1/customers
  def index
    customers = current_store.customers

    customers = customers.where(
      "name ILIKE :q OR cpf ILIKE :q OR email ILIKE :q",
      q: "%#{params[:q]}%"
    ) if params[:q].present?

    customers = customers.where(status: params[:status]) if params[:status].present?

    customers = customers.order(created_at: :desc)

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i.clamp(1, 100)

    total = customers.count

    customers = customers
      .offset((page - 1) * per_page)
      .limit(per_page)

    render json: {
      data: customers.as_json(
        only: [:id, :name, :phone, :email, :status, :points_balance, :created_at]
      ),
      meta: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }, status: :ok
  end

  # GET /api/v1/customers/:id
  def show
    render json: @customer, status: :ok
  end

  # POST /api/v1/customers
  def create
    customer = current_store.customers.new(customer_params)

    if customer.save
      render json: customer, status: :created
    else
      render json: { errors: customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT/PATCH /api/v1/customers/:id
  def update
    if @customer.update(customer_params)
      render json: @customer, status: :ok
    else
      render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/customers/:id/deactivate
  def deactivate
    @customer.update!(status: :inactive, active: false)
    render json: @customer, status: :ok
  end

  # GET /api/v1/customers/:id/points_history
  def points_history
    transactions = @customer.points_transactions.order(created_at: :desc)

    earned = transactions.where(transaction_type: :earned).sum(:points)
    redeemed = transactions.where(transaction_type: :redeemed).sum(:points).abs

    render json: {
      customer: {
        id: @customer.id,
        name: @customer.name,
        points_balance: @customer.points_balance
      },
      summary: {
        total_earned: earned,
        total_redeemed: redeemed,
        current_balance: @customer.points_balance
      },
      transactions: transactions.as_json(
        only: [
          :id,
          :transaction_type,
          :points,
          :balance_after,
          :description,
          :created_at
        ]
      )
    }, status: :ok
  end

  private

  def set_customer
    @customer = current_store.customers.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Cliente não encontrado" }, status: :not_found
  end

  def customer_params
    params.require(:customer).permit(
      :name,
      :cpf,
      :phone,
      :email,
      :status
    )
  end
end