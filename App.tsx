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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeia os dados do banco (snake_case) para nossa interface (camelCase)
      const mappedData: InventoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        category: row.category,
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
    } catch (err) {
      console.error('Erro de conexão ou tabela inexistente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- CRUD Genérico ---
  const handleAddItem = async (item: Partial<InventoryItem>) => {
    const dbItem = {
      category: item.category,
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

    const { error } = await supabase.from('inventory').insert([dbItem]);
    if (!error) fetchInventory();
    else alert('Erro ao inserir. Verifique as chaves de API.');
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from('inventory').delete().in('id', ids);
    if (!error) setItems(prev => prev.filter(i => !ids.includes(i.id)));
  };

  const handleImportData = async (newItems: Partial<InventoryItem>[]) => {
    const dbItems = newItems.map(item => ({
      category: item.category,
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
    const { error } = await supabase.from('inventory').insert(dbItems);
    if (!error) fetchInventory();
  };

  // --- Filtros por Aba ---
  const inkData = items.filter(i => i.category === 'INK');
  const fiberData = items.filter(i => i.category === 'FIBER');
  const packagingData = items.filter(i => i.category === 'PACKAGING');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="flex-1 ml-64 p-2 transition-all duration-300">
        {currentTab === TabView.DASHBOARD && <Dashboard fiberData={fiberData} inkData={inkData} />}
        
        {currentTab === TabView.INK && (
          <InventoryTable title="Estoque de Tinta" category="INK" data={inkData} isLoading={loading}
            onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}

        {currentTab === TabView.FIBER && (
          <InventoryTable title="Estoque de Fibras" category="FIBER" data={fiberData} isLoading={loading}
            onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}

        {currentTab === TabView.PACKAGING && (
          <InventoryTable title="Estoque de Embalagem" category="PACKAGING" data={packagingData} isLoading={loading}
            onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} onBulkDelete={handleBulkDelete} onImportData={handleImportData} />
        )}
      </main>
    </div>
  );
};

export default App;