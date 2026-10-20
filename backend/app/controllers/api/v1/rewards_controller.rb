class Api::V1::RewardsController < ApplicationController
  before_action :set_reward, only: [:show, :update, :redeem]
  before_action :require_admin!, only: [:create, :update]

  # GET /api/v1/rewards
  def index
    rewards = current_store.rewards.order(points_required: :asc)

    rewards = rewards.where(active: true) if params[:active] == "true"

    render json: rewards, status: :ok
  end

  # GET /api/v1/rewards/:id
  def show
    render json: @reward, status: :ok
  end

  # POST /api/v1/rewards
  # Somente admin
  def create
    reward = current_store.rewards.new(reward_params)

    if reward.save
      render json: reward, status: :created
    else
      render json: {
        errors: reward.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PUT/PATCH /api/v1/rewards/:id
  # Somente admin
  def update
    if @reward.update(reward_params)
      render json: @reward, status: :ok
    else
      render json: {
        errors: @reward.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/rewards/:id/redeem
  # Body esperado: { "customer_id": 1 }
  # Admins e vendedores resgatam em nome do cliente: os pontos são
  # descontados e um cupom de desconto fica disponível para a próxima compra.
  def redeem
    customer = current_store.customers.find(params[:customer_id])
    coupon = nil

    ActiveRecord::Base.transaction do
      # Trava cliente e recompensa para evitar resgate duplo simultâneo
      customer.lock!
      @reward.lock!

      if customer.inactive?
        raise RedeemError, "Cliente inativo não pode resgatar recompensas."
      end

      unless @reward.redeemable?
        raise RedeemError, "Esta recompensa não está disponível para resgate no momento."
      end

      if customer.points_balance < @reward.points_required
        raise RedeemError, "Cliente não possui pontos suficientes para este resgate."
      end

      new_balance = customer.points_balance - @reward.points_required

      customer.update!(points_balance: new_balance)

      now = Time.current

      coupon = RewardRedemption.create!(
        store: current_store,
        customer: customer,
        reward: @reward,
        user: current_user,
        points_used: @reward.points_required,
        redeemed_at: now,
        discount_type: @reward.discount_type,
        discount_value: @reward.discount_value,
        expires_at: @reward.coupon_expiration_from(now)
      )

      PointsTransaction.create!(
        store: current_store,
        user: current_user,
        customer: customer,
        transaction_type: :redeemed,
        points: -@reward.points_required,
        balance_after: new_balance,
        description: "Resgate: #{@reward.name} (cupom #{coupon.code})"
      )

      @reward.decrement!(:quantity_available) unless @reward.quantity_available.nil?
    end

    render json: coupon.as_coupon_json.merge(
      points_balance: customer.points_balance
    ), status: :created

  rescue RedeemError => e
    render json: { error: e.message }, status: :unprocessable_entity

  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Cliente não encontrado"
    }, status: :not_found

  rescue ActiveRecord::RecordInvalid => e
    render json: {
      error: "Não foi possível realizar o resgate. #{e.message}"
    }, status: :unprocessable_entity
  end

  private

  class RedeemError < StandardError; end

  def set_reward
    @reward = current_store.rewards.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: "Recompensa não encontrada"
    }, status: :not_found
  end

  def reward_params
    params.require(:reward).permit(
      :name,
      :description,
      :points_required,
      :valid_until,
      :active,
      :quantity_available,
      :discount_type,
      :discount_value,
      :coupon_validity_days
    )
  end
end