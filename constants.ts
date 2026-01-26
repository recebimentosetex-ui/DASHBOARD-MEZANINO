import { StandardInventoryItem, PackagingInventoryItem } from './types';

// Mock Data for Dashboard Charts
export const CHART_DATA_BARS = [
  { name: 'SALA 1', value: 450, fill: '#FCD34D' }, // Yellow-ish
  { name: 'SALA 2', value: 920, fill: '#EF4444' }, // Red-ish
];

export const CHART_DATA_DONUT = [
  { name: 'M6010480 (25)', value: 25, fill: '#F87171' }, // Red
  { name: 'M6010483 (8)', value: 8, fill: '#FBBF24' },  // Yellow
  { name: 'M6010482 (4)', value: 4, fill: '#34D399' },  // Green
  { name: 'M6010481 (4)', value: 4, fill: '#60A5FA' },  // Blue
];

export const MACHINE_STATS = [
  { name: 'Ext 6', value: 16, max: 20, color: 'bg-blue-500' },
  { name: 'Ext 9', value: 5, max: 20, color: 'bg-green-500' },
  { name: 'Ext 2/4', value: 4, max: 20, color: 'bg-yellow-500' },
];

// Mock Data for Inventory Tables
export const MOCK_INK_DATA: StandardInventoryItem[] = [
  { id: '1', category: 'INK', material: 'Tinta Azul Royal', lote: 'L-2023-01', qtd: 50, sala: 'S1', prateleira: 'A', fileira: '1', maquinaFornecida: 'Ext 6', responsavel: 'João Silva', dataSaida: '2024-01-10', sm: 'SM-101', status: 'EM ESTOQUE' },
  { id: '2', category: 'INK', material: 'Tinta Vermelha', lote: 'L-2023-05', qtd: 12, sala: 'S1', prateleira: 'A', fileira: '2', maquinaFornecida: 'Ext 9', responsavel: 'Maria Dias', dataSaida: '2024-01-12', sm: 'SM-102', status: 'PAGO' },
  { id: '3', category: 'INK', material: 'Solvente Universal', lote: 'L-2023-08', qtd: 100, sala: 'S2', prateleira: 'B', fileira: '1', maquinaFornecida: '-', responsavel: 'Carlos Lima', dataSaida: '-', sm: 'SM-103', status: 'EM ESTOQUE' },
];

export const MOCK_FIBER_DATA: StandardInventoryItem[] = [
  { id: '1', category: 'FIBER', material: 'Fibra de Carbono T300', lote: 'F-998', qtd: 1246, sala: 'S2', prateleira: 'C', fileira: '5', maquinaFornecida: 'Ext 2/4', responsavel: 'Ana Souza', dataSaida: '2024-01-15', sm: 'SM-201', status: 'EM ESTOQUE' },
  { id: '2', category: 'FIBER', material: 'Fibra de Vidro E', lote: 'F-887', qtd: 300, sala: 'S1', prateleira: 'C', fileira: '2', maquinaFornecida: 'Ext 6', responsavel: 'Pedro Santos', dataSaida: '2024-01-14', sm: 'SM-202', status: 'PAGO' },
  { id: '3', category: 'FIBER', material: 'Kevlar 49', lote: 'F-776', qtd: 0, sala: 'S2', prateleira: 'D', fileira: '1', maquinaFornecida: '-', responsavel: '-', dataSaida: '2023-12-20', sm: 'SM-203', status: 'PAGO' },
];

export const MOCK_PACKAGING_DATA: PackagingInventoryItem[] = [
  { id: '1', category: 'PACKAGING', material: 'Caixa Papelão G', qtd: 5000, responsavel: 'Roberto Alves', dataSaida: '2024-01-05', sm: 'SM-301', status: 'EM ESTOQUE' },
  { id: '2', category: 'PACKAGING', material: 'Filme Stretch', qtd: 45, responsavel: 'Roberto Alves', dataSaida: '2024-01-08', sm: 'SM-302', status: 'PAGO' },
  { id: '3', category: 'PACKAGING', material: 'Etiqueta Adesiva', qtd: 10000, responsavel: 'Julia Costa', dataSaida: '2024-01-11', sm: 'SM-303', status: 'EM ESTOQUE' },
];