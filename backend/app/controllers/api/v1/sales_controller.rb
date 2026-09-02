class Api::V1::SalesController < ApplicationController
  before_action :set_sale, only: [:show]

  # GET /api/v1/sales
  # Params opcionais: customer_id, page, per_page
  def index
    sales = current_store.sales
                         .includes(:customer, :user, :sale_items)
                         .order(created_at: :desc)

    if params[:customer_id].present?
      sales = sales.where(customer_id: params[:customer_id])
    end

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i.clamp(1, 100)

    total = sales.count

    sales = sales
      .offset((page - 1) * per_page)
      .limit(per_page)

    render json: {
      data: sales.as_json(
        only: [:id, :total_amount, :points_earned, :created_at],
        include: {
          customer: { only: [:id, :name] },
          user: { only: [:id, :name] },
          sale_items: {
            only: [:id, :product_name, :quantity, :unit_price]
          }
        }
      ),
      meta: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }, status: :ok
  end

  # GET /api/v1/sales/:id
  def show
    render json: @sale,
           include: [:sale_items, :customer, :user],
           status: :ok
  end

  # POST /api/v1/sales
  # Body esperado:
  # {
  #   "sale": {
  #     "customer_id": 1,
  #     "sale_items": [
  #       {
  #         "product_name": "X",
  #         "quantity": 2,
  #         "unit_price": 10.0
  #       }
  #     ]
  #   }
  # }
  def create
    customer = current_store.customers.find(sale_params[:customer_id])
    items = sale_params[:sale_items] || []

    if items.blank?
      return render json: {
        error: "A venda precisa ter ao menos um item"
      }, status: :unprocessable_entity
    end

    rule = current_store.loyalty_rules
                         .where(active: true)
                         .order(active_from: :desc)
                         .first

    if rule.nil?
      return render json: {
        error: "Nenhuma regra de pontuação ativa configurada"
      }, status: :unprocessable_entity
    end

    total_amount = items.sum do |item|
      item[:quantity].to_i * item[:unit_price].to_f
    end

    points_earned = (total_amount * rule.points_per_currency_unit).floor

    sale = nil

    ActiveRecord::Base.transaction do
      sale = current_store.sales.create!(
        customer: customer,
        user: current_user,
        total_amount: total_amount,
        points_earned: points_earned
      )

      items.each do |item|
        sale.sale_items.create!(
          product_name: item[:product_name],
          quantity: item[:quantity],
          unit_price: item[:unit_price]
        )
      end

      new_balance = customer.points_balance + points_earned

      customer.update!(
        points_balance: new_balance
      )

      PointsTransaction.create!(
        store: current_store,
        user: current_user,
        customer: customer,
        sale: sale,
        transaction_type: :earned,
        points: points_earned,
        balance_after: new_balance,
        description: "Pontos gerados pela venda ##{sale.id}"
        )
      end

      render json: sale,
       include: [:sale_items],
        status: :created

  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Cliente não encontrado"
    }, status: :not_found

  rescue ActiveRecord::RecordInvalid => e
    render json: {
      error: "Não foi possível registrar a venda. #{e.message}"
    }, status: :unprocessable_entity
  end

  private

  def set_sale
    @sale = current_store.sales.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Venda não encontrada"
    }, status: :not_found
  end

  def sale_params
    params.require(:sale).permit(
      :customer_id,
      sale_items: [
        :product_name,
        :quantity,
        :unit_price
      ]
    )
  end
end