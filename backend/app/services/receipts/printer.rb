require "socket"

module Receipts
  # Envia os bytes ESC/POS para a impressora configurada da loja.
  class Printer
    CONNECT_TIMEOUT = 3 # segundos

    def self.deliver(bytes, profile)
      new(profile.printer).deliver(bytes)
    end

    def initialize(settings)
      @settings = settings || {}
    end

    def deliver(bytes)
      case mode
      when "network" then send_to_network(bytes)
      when "file" then send_to_file(bytes)
      when "none"
        raise PrintError, "Nenhuma impressora configurada para esta loja."
      else
        raise PrintError, "Modo de impressora desconhecido: #{mode}."
      end

      true
    end

    private

    def mode
      @settings["mode"].to_s.presence || "none"
    end

    # Impressora de rede (porta RAW 9100)
    def send_to_network(bytes)
      host = @settings["host"].to_s.strip
      port = (@settings["port"].presence || 9100).to_i

      raise PrintError, "Informe o IP da impressora (host) na configuração." if host.empty?

      Socket.tcp(host, port, connect_timeout: CONNECT_TIMEOUT) do |socket|
        socket.write(bytes)
        socket.flush
      end
    rescue SocketError, SystemCallError, IOError => e
      raise PrintError, "Não foi possível imprimir na impressora #{host}:#{port} (#{e.message})."
    end

    # Impressora USB compartilhada no Windows (\\localhost\NOME) ou
    # arquivo de dispositivo no Linux (/dev/usb/lp0)
    def send_to_file(bytes)
      path = @settings["path"].to_s.strip

      raise PrintError, "Informe o caminho da impressora (path) na configuração." if path.empty?

      File.open(path, "wb") { |file| file.write(bytes) }
    rescue SystemCallError, IOError => e
      raise PrintError, "Não foi possível imprimir em #{path} (#{e.message})."
    end
  end
end
