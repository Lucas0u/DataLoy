class AddDeletedAtToRewards < ActiveRecord::Migration[8.1]
  def change
    # Exclusão lógica: a recompensa some do sistema, mas os cupons já
    # resgatados e o histórico de vendas continuam apontando para ela.
    add_column :rewards, :deleted_at, :datetime
    add_index :rewards, :deleted_at
  end
end
