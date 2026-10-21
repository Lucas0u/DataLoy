require "rails_helper"

RSpec.describe StoreProfile do
  let(:store) { create(:store, name: "Loja Teste") }

  it "usa o nome da loja quando o nome fantasia não está definido" do
    profile = described_class.new(store, { "trade_name" => "" })

    expect(profile.trade_name).to eq("Loja Teste")
  end

  it "junta os dados padrão com os dados da loja" do
    base = { "footer" => "Volte sempre", "receipt" => { "columns" => 48, "encoding" => "cp850" } }
    specific = { "cnpj" => "12.345.678/0001-90", "receipt" => { "columns" => 32 } }

    merged = described_class.deep_merge(base, specific)
    profile = described_class.new(store, merged)

    expect(profile.cnpj).to eq("12.345.678/0001-90")
    expect(profile.footer).to eq("Volte sempre")
    expect(profile.columns).to eq(32)
    expect(profile.encoding).to eq("cp850")
  end

  it "nunca configura impressora real nos testes" do
    expect(described_class.for(store).printer_mode).to eq("none")
    expect(described_class.for(store)).not_to be_printer_configured
  end
end
