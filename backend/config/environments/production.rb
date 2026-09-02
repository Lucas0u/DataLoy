require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  config.action_controller.perform_caching = true
  config.log_level = :info

  # Erros nunca devem vazar mensagens técnicas do Rails ao usuário (item 20 do escopo)
  config.action_dispatch.show_exceptions = :rescuable

  config.force_ssl = true

  config.log_tags = [:request_id]
  config.silence_healthcheck_path = "/up"

  config.active_record.dump_schema_after_migration = false
end
