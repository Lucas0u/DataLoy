require "rails_helper"

RSpec.describe Sale, type: :model do
  it { should belong_to(:customer) }
  it { should belong_to(:user) }
  it { should have_many(:sale_items).dependent(:destroy) }
  it { should validate_presence_of(:total_amount) }

  it "remove os itens junto quando a venda é destruída" do
    sale = create(:sale)
    create(:sale_item, sale: sale)

    expect { sale.destroy }.to change(SaleItem, :count).by(-1)
  end
end