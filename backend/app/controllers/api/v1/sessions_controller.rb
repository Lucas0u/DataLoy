class Api::V1::SessionsController < ApplicationController
  skip_before_action :authenticate_request, only: [:create]

  def create
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      token = JWT.encode(
        { user_id: user.id, exp: 24.hours.from_now.to_i },
        Rails.application.secret_key_base
      )
      render json: {
        token: token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }, status: :ok
    else
      render json: { error: "E-mail ou senha inválidos" }, status: :unauthorized
    end
  end

  def destroy
    render json: { message: "Logout realizado com sucesso" }, status: :ok
  end
end