import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import { TabView, InventoryItem } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.DASHBOARD);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Buscar dados do Supabase ---
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 1499);

      if (error) throw error;

      // Mapeia os dados do banco (snake_case) para nossa interface (camelCase)
      const mappedData: InventoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        category: row.category,
        codigo: row.codigo,
        material: row.material,
        qtd: row.qtd,
        status: row.status,
        responsavel: row.responsavel,
        dataSaida: row.data_saida,
        sm: row.sm,
        lote: row.lote,
        sala: row.sala,
        prateleira: row.prateleira,
        fileira: row.fileira,
        maquinaFornecida: row.maquina_fornecida
      }));
      setItems(mappedData);
    } catch (err: any) {
      console.warn('Modo Offline/Erro de Conexão:', err.message);
      // Não exibimos alerta visual para não bloquear a experiência do usuário
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- Helper para gerar ID temporário em caso de falha de conexão ---
  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // --- CRUD com Fallback Local (Optimistic UI) ---
  
  const handleAddItem = async (item: Partial<InventoryItem>) => {
    // 1. Preparar objeto para o banco (snake_case)
    const dbItem = {
      category: item.category,
      codigo: item.codigo,
      material: item.material,
      qtd: item.qtd,
      status: item.status,
      responsavel: item.responsavel,
      data_saida: item.dataSaida,
      sm: item.sm,
      lote: item.lote,
      sala: item.sala,
      prateleira: item.prateleira,
      fileira: item.fileira,
      maquina_fornecida: item.maquinaFornecida
    };

    try {
      const { error } = await supabase.from('inventory').insert([dbItem]);
      if (error) throw error;
      
      // Sucesso: Atualiza do servidor
      fetchInventory();
    } catch (error) {
      console.warn('Erro ao salvar no banco. Aplicando atualização local.', error);
      
      // Fallback: Adiciona localmente para o usuário não perder dados
      const newItem: InventoryItem = {
        id: generateTempId(),
        category: item.category!,
        codigo: item.codigo,
        material: item.material!,
        qtd: item.qtd || 0,
        status: item.status || 'EM ESTOQUE',
        responsavel: item.responsavel || '',
        dataSaida: item.dataSaida || '',
        sm: item.sm || '',
        lote: item.lote || '',
        sala: item.sala || '',
        prateleira: item.prateleira || '',
        fileira: item.fileira || '',
        maquinaFornecida: item.maquinaFornecida || ''
      };
      
      setItems(prev => [newItem, ...prev]);
    }
  };

  const handleUpdateItem = async (id: string, item: Partial<InventoryItem>) => {
    const dbItem = {
      category: item.category,
      codigo: item.codigo,
      material: item.material,
      qtd: item.qtd,
      status: item.status,
      responsavel: item.responsavel,
      data_saida: item.dataSaida,
      sm: item.sm,
      lote: item.lote,
      sala: item.sala,
      prateleira: item.prateleira,
      fileira: item.fileira,
      maquina_fornecida: item.maquinaFornecida
    };

    try {
      const { error } = await supabase.from('inventory').update(dbItem).eq('id', id);
      if (error) throw error;
      
      fetchInventory();
    } catch (error) {
      console.warn('Erro ao atualizar no banco. Aplicando atualização local.', error);
      
      // Fallback Local
      setItems(prev => prev.map(currentItem => {
        if (currentItem.id === id) {
          return { ...currentItem, ...item } as InventoryItem;
        }
        return currentItem;
      }));
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.warn('Erro ao excluir no banco. Aplicando exclusão local.', error);
      // Fallback Local
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('inventory').delete().in('id', ids);
      if (error) throw error;
      
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
    } catch (error) {
      console.warn('Erro ao excluir em massa no banco. Aplicando localmente.', error);
      // Fallback Local
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
    }
  };

  const handleImportData = async (newItems: Partial<InventoryItem>[]) => {
    const dbItems = newItems.map(item => ({
      category: item.category,
      codigo: item.codigo,
      material: item.material,
      qtd: item.qtd,
      status: item.status,
      responsavel: item.responsavel,
      data_saida: item.dataSaida,
      sm: item.sm,
      lote: item.lote,
      sala: item.sala,
      prateleira: item.prateleira,
      fileira: item.fileira,
      maquina_fornecida: item.maquinaFornecida
    }));
    
    try {
      const { error } = await supabase.from('inventory').insert(dbItems);
      if (error) throw error;
      
      fetchInventory();
      // Feedback visual sutil pode ser adicionado aqui, mas evitamos alerts bloqueantes
    } catch (error) {
      console.error("Erro Import:", error);
      
      // Fallback Importação Local
      const localImportedItems = newItems.map(item => ({
        id: generateTempId(),
        ...item
      } as InventoryItem));
      
      setItems(prev => [...localImportedItems, ...prev]);
    }
  };

  // --- Filtros por Aba ---
  const inkData = items.filter(i => i.category === 'INK');
  const fiberData = items.filter(i => i.category === 'FIBER');
  const packagingData = items.filter(i => i.category === 'PACKAGING');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="flex-1 ml-64 p-2 transition-all duration-300">
        
        {currentTab === TabView.DASHBOARD && <Dashboard fiberData={fiberData} inkData={inkData} packagingData={packagingData} />}
        
        {currentTab === TabView.INK && (
          <InventoryTable title="Estoque de Tinta" category="INK" data={inkData} isLoading={loading}
            onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}

        {currentTab === TabView.FIBER && (
          <InventoryTable title="Estoque de Fibras" category="FIBER" data={fiberData} isLoading={loading}
            onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}

        {currentTab === TabView.PACKAGING && (
          <InventoryTable title="Estoque de Embalagem" category="PACKAGING" data={packagingData} isLoading={loading}
            onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}
      </main>
    </div>
  );
};

export default App;