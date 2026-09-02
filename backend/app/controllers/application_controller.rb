class ApplicationController < ActionController::API
  before_action :authenticate_request

  attr_reader :current_user, :current_store

  private

  def authenticate_request
    header = request.headers["Authorization"]
    token = header.split(" ").last if header

    decoded = JWT.decode(token, Rails.application.secret_key_base).first
    @current_user = User.find(decoded["user_id"])
    @current_store = @current_user.store
  rescue JWT::ExpiredSignature
    render json: { error: "Sessão expirada. Faça login novamente." }, status: :unauthorized
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    render json: { error: "Não autorizado" }, status: :unauthorized
  end

  def require_admin!
    return if current_user&.admin?

    render json: { error: "Acesso restrito a administradores" }, status: :forbidden
  end
end