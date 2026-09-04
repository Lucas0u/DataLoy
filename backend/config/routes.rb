Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      resources :rewards, except: [:destroy]
      post "rewards/:id/redeem", to: "rewards#redeem"
      get "dashboard", to: "dashboard#index"
      get "reports", to: "reports#index"
      get "reports/export", to: "reports#export"
      get "reports/customers", to: "reports#customers"
      get "reports/points", to: "reports#points"
      get "reports/movements", to: "reports#movements"
      get "reports/export_customers", to: "reports#export_customers"
      get "reports/export_points", to: "reports#export_points"
      get "reports/export_movements", to: "reports#export_movements"

      resources :customers, except: [:destroy] do
        member do
          patch :deactivate
          get :points_history
        end
      end

      resources :sales, only: [:index, :show, :create]
    end
  end
end