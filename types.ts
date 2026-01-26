// Definição das abas do sistema
export enum TabView {
  DASHBOARD = 'DASHBOARD',
  INK = 'ESTOQUE DE TINTA',
  FIBER = 'ESTOQUE DE FIBRAS',
  PACKAGING = 'ESTOQUE DE EMBALAGEM'
}

// Tipo principal do item de inventário
export interface InventoryItem {
  id: string; 
  category: 'INK' | 'FIBER' | 'PACKAGING';
  material: string;
  qtd: number;
  status: string; // Ex: 'EM ESTOQUE', 'PAGO'
  responsavel: string;
  dataSaida: string; // Mapeado do DB: data_saida
  sm: string;
  
  // Campos opcionais (usados principalmente em Tinta e Fibra)
  lote?: string;
  sala?: string;
  prateleira?: string;
  fileira?: string;
  maquinaFornecida?: string; // Mapeado do DB: maquina_fornecida
}

// Alias types to support imports in other files
export type StandardInventoryItem = InventoryItem;
export type PackagingInventoryItem = InventoryItem;