require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

require "dotenv/load" if %w[development test].include?(ENV["RAILS_ENV"] || "development")

module Dataloy
  class Application < Rails::Application
    config.load_defaults 8.1
    config.i18n.default_locale = :"pt-BR"

    
    config.api_only = true

    config.time_zone = "America/Recife"
    config.active_record.default_timezone = :local

    # Todas as rotas de negócio vivem sob /api/v1
    config.autoload_lib(ignore: %w[assets tasks])
  end
end
