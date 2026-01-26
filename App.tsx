import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import { TabView, InventoryItem } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.DASHBOARD);
  
  // Application State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Supabase Data Fetching ---
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        // Map DB snake_case columns to camelCase if necessary, 
        // but here we align types manually or rename in select. 
        // For simplicity, we assume DB columns match mapped logic in fetching or we adjust.
        // Actually, let's map it safely.
        const mappedData: InventoryItem[] = (data || []).map((row: any) => ({
          id: row.id,
          category: row.category,
          material: row.material,
          qtd: row.qtd,
          status: row.status,
          responsavel: row.responsavel,
          dataSaida: row.data_saida, // DB column -> Prop
          sm: row.sm,
          lote: row.lote,
          sala: row.sala,
          prateleira: row.prateleira,
          fileira: row.fileira,
          maquinaFornecida: row.maquina_fornecida // DB column -> Prop
        }));
        setItems(mappedData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- CRUD Operations ---
  
  const handleAddItem = async (item: Partial<InventoryItem>) => {
    // Convert camelCase to snake_case for DB
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

    const { data, error } = await supabase.from('inventory').insert([dbItem]).select();
    
    if (error) {
      console.error('Error adding item:', error);
      throw error;
    }

    if (data) {
      // Add local optimistic update or re-fetch
      fetchInventory();
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      console.error('Error deleting item:', error);
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from('inventory').delete().in('id', ids);
    if (error) {
      console.error('Error deleting items:', error);
    } else {
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
    }
  };

  const handleImportData = async (newItems: Partial<InventoryItem>[]) => {
    // Prepare all items for DB
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
    
    if (error) {
      console.error('Error importing items:', error);
      alert('Erro ao importar. Verifique o console.');
    } else {
      fetchInventory();
    }
  };

  // --- Filtering Logic ---
  const inkData = items.filter(i => i.category === 'INK');
  const fiberData = items.filter(i => i.category === 'FIBER');
  const packagingData = items.filter(i => i.category === 'PACKAGING');

  const renderContent = () => {
    switch (currentTab) {
      case TabView.DASHBOARD:
        return <Dashboard fiberData={fiberData} inkData={inkData} />;
      case TabView.INK:
        return (
          <InventoryTable 
            title="Estoque de Tintas" 
            type="STANDARD" 
            category="INK"
            data={inkData}
            isLoading={loading}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onBulkDelete={handleBulkDelete}
            onImportData={handleImportData}
          />
        );
      case TabView.FIBER:
        return (
          <InventoryTable 
            title="Estoque de Fibras" 
            type="STANDARD" 
            category="FIBER"
            data={fiberData}
            isLoading={loading}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onBulkDelete={handleBulkDelete}
            onImportData={handleImportData}
          />
        );
      case TabView.PACKAGING:
        return (
          <InventoryTable 
            title="Estoque de Embalagens" 
            type="PACKAGING" 
            category="PACKAGING"
            data={packagingData}
            isLoading={loading}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onBulkDelete={handleBulkDelete}
            onImportData={handleImportData}
          />
        );
      default:
        return <Dashboard fiberData={fiberData} inkData={inkData} />;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="flex-1 ml-64 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;