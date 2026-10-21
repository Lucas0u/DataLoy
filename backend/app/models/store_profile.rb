require "erb"
require "yaml"

# Dados da loja usados no recibo, lidos de config/store_profiles.yml.
class StoreProfile
  CONFIG_PATH = Rails.root.join("config/store_profiles.yml")

  attr_reader :store, :data

  def self.for(store)
    config = load_config
    stores = config.fetch("stores", nil) || {}
    specific = stores[store.id] || stores[store.id.to_s] || {}

    new(store, deep_merge(config.fetch("default", nil) || {}, specific))
  end

  def self.load_config
    @config = nil unless Rails.env.production?
    @config ||= YAML.safe_load(ERB.new(File.read(CONFIG_PATH)).result, aliases: true) || {}
  end

  def self.deep_merge(base, override)
    base.merge(override) do |_key, old, new|
      old.is_a?(Hash) && new.is_a?(Hash) ? deep_merge(old, new) : new
    end
  end

  def initialize(store, data)
    @store = store
    @data = data
  end

  def trade_name
    data["trade_name"].presence || store.name
  end

  %w[legal_name cnpj state_registration address city phone footer].each do |field|
    define_method(field) { data[field].to_s.strip }
  end

  def time_zone
    data["time_zone"].presence || "America/Sao_Paulo"
  end

  def receipt_settings
    data["receipt"] || {}
  end

  def columns
    value = receipt_settings["columns"].to_i
    value.positive? ? value : 48
  end

  def encoding
    receipt_settings["encoding"].presence || "cp850"
  end

  def auto_print?
    receipt_settings.fetch("auto_print", true) != false
  end

  def printer
    data["printer"] || {}
  end

  def printer_mode
    printer["mode"].presence || "none"
  end

  def printer_configured?
    printer_mode != "none"
  end
end
