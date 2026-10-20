class Api::V1::SalesController < ApplicationController
  before_action :set_sale, only: [:show]

  # GET /api/v1/sales
  # Params opcionais: customer_id, page, per_page
  def index
    sales = current_store.sales
                         .includes(:customer, :user, :sale_items, reward_redemption: :reward)
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
      data: sales.as_json(sale_json_options),
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
    render json: @sale.as_json(sale_json_options), status: :ok
  end

  # POST /api/v1/sales
  # Body esperado:
  # {
  #   "sale": {
  #     "customer_id": 1,
  #     "payment_method": "pix" | "dinheiro" | "cartao",
  #     "final_amount": 96.5,          # obrigatório no cartão (valor da maquininha)
  #     "card_fee_percentage": 3.5,    # opcional, só no cartão
  #     "coupon_id": 7,                # opcional, cupom de recompensa do cliente
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

    items_error = validate_items(items)

    if items_error
      return render json: { error: items_error }, status: :unprocessable_entity
    end

    payment_method = sale_params[:payment_method].to_s

    unless Sale::PAYMENT_METHODS.include?(payment_method)
      return render json: {
        error: "Selecione uma forma de pagamento válida (Pix, dinheiro ou cartão)"
      }, status: :unprocessable_entity
    end

    card = payment_method == "cartao"

    if card && sale_params[:final_amount].blank?
      return render json: {
        error: "Informe o valor cobrado na maquininha"
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

    # Valor dos produtos (antes do desconto)
    total_amount = items.sum do |item|
      item[:quantity].to_i * item[:unit_price].to_d
    end

    if total_amount > Sale::MAX_AMOUNT
      return render json: {
        error: "O total da venda não pode passar de R$ 1.000.000,00"
      }, status: :unprocessable_entity
    end

    # Cupom de recompensa (opcional): precisa ser do próprio cliente
    coupon = nil

    if sale_params[:coupon_id].present?
      coupon = customer.reward_redemptions
                       .where(store: current_store)
                       .find_by(id: sale_params[:coupon_id])

      if coupon.nil?
        return render json: {
          error: "Cupom não encontrado para este cliente"
        }, status: :unprocessable_entity
      end
    end

    sale = nil

    ActiveRecord::Base.transaction do
      # Trava o cupom para não ser usado em duas vendas ao mesmo tempo
      if coupon
        coupon.lock!
        raise SaleError, "Este cupom já foi utilizado ou está vencido" unless coupon.usable?
      end

      discount_amount = coupon ? coupon.discount_for(total_amount) : 0.to_d
      amount_due = total_amount - discount_amount

      # Pontos sobre o valor dos produtos menos o desconto do cupom
      points_earned = (amount_due * rule.points_per_currency_unit.to_d).floor

      # Valor cobrado: no cartão vem da maquininha; nos demais é o valor a pagar
      final_amount = card ? sale_params[:final_amount].to_d : amount_due

      card_fee_percentage =
        if card && sale_params[:card_fee_percentage].present?
          sale_params[:card_fee_percentage].to_d
        end

      sale = current_store.sales.create!(
        customer: customer,
        user: current_user,
        total_amount: total_amount,
        discount_amount: discount_amount,
        reward_redemption: coupon,
        final_amount: final_amount,
        payment_method: payment_method,
        card_fee_percentage: card_fee_percentage,
        points_earned: points_earned
      )

      items.each do |item|
        sale.sale_items.create!(
          product_name: item[:product_name],
          quantity: item[:quantity],
          unit_price: item[:unit_price]
        )
      end

      coupon&.update!(status: :used, used_at: Time.current)

      customer.lock!
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

    render json: sale.as_json(sale_json_options), status: :created

  rescue SaleError => e
    render json: { error: e.message }, status: :unprocessable_entity

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

  class SaleError < StandardError; end

  # Campos da venda devolvidos pela API (hash novo a cada chamada)
  def sale_json_options
    {
      only: [
        :id,
        :total_amount,
        :discount_amount,
        :final_amount,
        :payment_method,
        :points_earned,
        :created_at
      ],
      include: {
        customer: { only: [:id, :name] },
        user: { only: [:id, :name] },
        sale_items: {
          only: [:id, :product_name, :quantity, :unit_price]
        },
        reward_redemption: {
          only: [:id, :code, :discount_type, :discount_value],
          include: { reward: { only: [:id, :name] } }
        }
      }
    }
  end

  def set_sale
    @sale = current_store.sales.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Venda não encontrada"
    }, status: :not_found
  end

  def validate_items(items)
    items.each do |item|
      quantity = item[:quantity].to_i
      unit_price = item[:unit_price].to_f

      if item[:product_name].blank? || quantity <= 0 || unit_price.negative?
        return "Preencha corretamente todos os produtos da venda"
      end

      if quantity > Sale::MAX_AMOUNT || unit_price > Sale::MAX_AMOUNT
        return "Quantidade e preço não podem passar de 1.000.000"
      end
    end

    nil
  end

  def sale_params
    params.require(:sale).permit(
      :customer_id,
      :payment_method,
      :final_amount,
      :card_fee_percentage,
      :coupon_id,
      sale_items: [
        :product_name,
        :quantity,
        :unit_price
      ]
    )
  end
end