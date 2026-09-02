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
  def redeem
    customer = current_store.customers.find(params[:customer_id])

    unless @reward.redeemable?
      return render json: {
        error: "Esta recompensa não está disponível para resgate no momento."
      }, status: :unprocessable_entity
    end

    if customer.points_balance < @reward.points_required
      return render json: {
        error: "Cliente não possui pontos suficientes para este resgate."
      }, status: :unprocessable_entity
    end

    redemption = nil

    ActiveRecord::Base.transaction do
      new_balance = customer.points_balance - @reward.points_required

      customer.update!(
        points_balance: new_balance
      )

      redemption = RewardRedemption.create!(
        store: current_store,
        customer: customer,
        reward: @reward,
        user: current_user,
        points_used: @reward.points_required,
        redeemed_at: Time.current
      )

      PointsTransaction.create!(
        store: current_store,
        user: current_user,
        customer: customer,
        transaction_type: :redeemed,
        points: -@reward.points_required,
        balance_after: new_balance,
        description: "Resgate: #{@reward.name}"
      )
      @reward.decrement!(:quantity_available) unless @reward.quantity_available.nil?
    end

    render json: redemption, status: :created

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
      :quantity_available
    )
  end
end