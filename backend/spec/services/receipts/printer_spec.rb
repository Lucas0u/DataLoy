require "rails_helper"
require "socket"
require "tmpdir"

RSpec.describe Receipts::Printer do
  let(:bytes) { "\e@Teste\n".b }

  it "envia os bytes para uma impressora de rede" do
    server = TCPServer.new("127.0.0.1", 0)
    port = server.addr[1]
    received = nil
    thread = Thread.new do
      client = server.accept
      received = client.read
      client.close
    end

    described_class.new("mode" => "network", "host" => "127.0.0.1", "port" => port).deliver(bytes)
    thread.join(2)

    expect(received).to eq(bytes)
  ensure
    server&.close
  end

  it "grava os bytes no caminho da impressora (USB compartilhada / dispositivo)" do
    Dir.mktmpdir do |dir|
      path = File.join(dir, "impressora")

      described_class.new("mode" => "file", "path" => path).deliver(bytes)

      expect(File.binread(path)).to eq(bytes)
    end
  end

  it "avisa quando a impressora de rede não responde" do
    server = TCPServer.new("127.0.0.1", 0)
    port = server.addr[1]
    server.close

    expect {
      described_class.new("mode" => "network", "host" => "127.0.0.1", "port" => port).deliver(bytes)
    }.to raise_error(Receipts::PrintError, /Não foi possível imprimir/)
  end

  it "avisa quando não há impressora configurada" do
    expect {
      described_class.new("mode" => "none").deliver(bytes)
    }.to raise_error(Receipts::PrintError, /Nenhuma impressora configurada/)
  end
end
