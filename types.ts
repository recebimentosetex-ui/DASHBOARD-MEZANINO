// Interface combinada para o banco de dados
export interface InventoryItem {
  id: string; // UUID no Supabase
  category: 'INK' | 'FIBER' | 'PACKAGING';
  material: string;
  qtd: number;
  status: string;
  responsavel: string;
  dataSaida: string; // Mapeado para data_saida no DB
  sm: string;
  
  // Propriedades opcionais (Standard items apenas)
  lote?: string;
  sala?: string;
  prateleira?: string;
  fileira?: string;
  maquinaFornecida?: string; // Mapeado para maquina_fornecida no DB
}

export type StandardInventoryItem = InventoryItem;
export type PackagingInventoryItem = InventoryItem;

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  INK = 'ESTOQUE DE TINTA',
  FIBER = 'ESTOQUE DE FIBRAS',
  PACKAGING = 'ESTOQUE DE EMBALAGEM'
}