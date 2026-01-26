import React, { useRef, useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Download, Upload, Plus, Trash2, CheckSquare, Square, Loader2, Pencil, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryTableProps {
  title: string;
  category: 'INK' | 'FIBER' | 'PACKAGING';
  data: InventoryItem[];
  isLoading?: boolean;
  onAddItem: (item: Partial<InventoryItem>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onImportData: (items: Partial<InventoryItem>[]) => Promise<void>;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  title, 
  category,
  data, 
  isLoading = false,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBulkDelete,
  onImportData 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do formulário
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    status: 'EM ESTOQUE'
  });

  const getStatusColor = (status: string) => {
    const s = status ? status.toUpperCase().trim() : '';
    if (s === 'EM ESTOQUE') return 'bg-green-100 text-green-700';
    if (s === 'PAGO') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // --- Lógica de Pesquisa ---
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerTerm = searchTerm.toLowerCase();
    
    return data.filter((item) => {
      return (
        item.material.toLowerCase().includes(lowerTerm) ||
        (item.lote && item.lote.toLowerCase().includes(lowerTerm)) ||
        (item.sm && item.sm.toLowerCase().includes(lowerTerm)) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(lowerTerm)) ||
        (item.status && item.status.toLowerCase().includes(lowerTerm)) ||
        (item.maquinaFornecida && item.maquinaFornecida.toLowerCase().includes(lowerTerm))
      );
    });
  }, [data, searchTerm]);

  // --- Importação Excel ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
      
      const processedData: Partial<InventoryItem>[] = jsonData.map((item) => ({
        category: category,
        material: item.Material || item.material || 'Desconhecido',
        qtd: Number(item.Qtd || item.qtd || 0),
        status: item.Status || item.status || 'EM ESTOQUE',
        responsavel: item.Responsavel || item.responsavel || '-',
        dataSaida: item.DataSaida || item.dataSaida || '-',
        sm: item.SM || item.sm || '-',
        lote: item.Lote || item.lote || '-',
        sala: item.Sala || item.sala || '-',
        prateleira: item.Prateleira || item.prateleira || '-',
        fileira: item.Fileira || item.fileira || '-',
        maquinaFornecida: item.Maquina || item.maquinaFornecida || '-'
      }));

      if (confirm(`Deseja importar ${processedData.length} itens?`)) {
        setIsSubmitting(true);
        await onImportData(processedData);
        setIsSubmitting(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Exportação Excel ---
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData = filteredData.map(item => ({
      Material: item.material,
      Qtd: item.qtd,
      Status: item.status,
      Responsavel: item.responsavel,
      DataSaida: item.dataSaida,
      SM: item.sm,
      Lote: item.lote || '',
      Sala: item.sala || '',
      Prateleira: item.prateleira || '',
      Fileira: item.fileira || '',
      Maquina: item.maquinaFornecida || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
  };

  // --- Seleção ---
  const handleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // --- Deletar ---
  const handleDeleteOne = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      await onDeleteItem(id);
      if (selectedIds.has(id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Excluir ${selectedIds.size} itens selecionados?`)) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // --- Adicionar / Editar ---
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData({ status: 'EM ESTOQUE' });
    setIsModalOpen(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      material: item.material,
      qtd: item.qtd,
      status: item.status,
      responsavel: item.responsavel,
      dataSaida: item.dataSaida,
      sm: item.sm,
      lote: item.lote,
      sala: item.sala,
      prateleira: item.prateleira,
      fileira: item.fileira,
      maquinaFornecida: item.maquinaFornecida
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateItem(editingId, { ...formData, category, qtd: Number(formData.qtd) || 0 });
      } else {
        await onAddItem({ ...formData, category, qtd: Number(formData.qtd) || 0 });
      }
      setIsModalOpen(false);
      setFormData({ status: 'EM ESTOQUE' });
      setEditingId(null);
    } catch (error) {
      alert('Erro ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
         <div>
           <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
             {isLoading && <Loader2 className="w-5 h-5 animate-spin text-green-600" />}
           </div>
         </div>
         
         <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full md:w-auto">
            {/* Campo de Pesquisa */}
            <div className="relative group w-full md:w-64 order-first md:order-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-600 transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
            
            <button onClick={handleOpenNewModal} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Novo Item
            </button>

            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 shadow-sm transition-colors whitespace-nowrap">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir ({selectedIds.size})
              </button>
            )}

            <button onClick={handleImportClick} className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap">
              <Upload className="w-4 h-4 mr-2" /> Importar
            </button>
            
            <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" /> Exportar
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-4"><button onClick={handleSelectAll}><Square className="w-5 h-5 text-gray-400" /></button></th>
                <th className="px-6 py-4 font-semibold">Material</th>
                <th className="px-6 py-4 font-semibold">Qtd</th>
                <th className="px-6 py-4 font-semibold">Lote</th>
                <th className="px-6 py-4 font-semibold">Local (Sala/Prat)</th>
                <th className="px-6 py-4 font-semibold">Resp.</th>
                <th className="px-6 py-4 font-semibold">Data Saída</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.has(item.id) ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => handleSelectOne(item.id)}>
                      {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.material}</td>
                  <td className="px-6 py-4 font-semibold">{item.qtd}</td>
                  <td className="px-6 py-4">{item.lote || '-'}</td>
                  <td className="px-6 py-4">{item.sala ? `${item.sala} ${item.prateleira || ''}` : '-'}</td>
                  <td className="px-6 py-4">{item.responsavel || '-'}</td>
                  <td className="px-6 py-4">{item.dataSaida || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteOne(item.id); }} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-400">
              {searchTerm ? 'Nenhum item encontrado para esta pesquisa.' : 'Nenhum item cadastrado.'}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Item' : `Novo Item (${category})`}</h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required name="material" value={formData.material || ''} placeholder="Material" className="border p-2 rounded" onChange={handleInputChange} />
              <input required type="number" name="qtd" value={formData.qtd || ''} placeholder="Quantidade" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="lote" value={formData.lote || ''} placeholder="Lote" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="sala" value={formData.sala || ''} placeholder="Sala" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="prateleira" value={formData.prateleira || ''} placeholder="Prateleira" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="fileira" value={formData.fileira || ''} placeholder="Fileira" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="maquinaFornecida" value={formData.maquinaFornecida || ''} placeholder="Máquina Fornecida" className="border p-2 rounded" onChange={handleInputChange} />
              <input name="responsavel" value={formData.responsavel || ''} placeholder="Responsável" className="border p-2 rounded" onChange={handleInputChange} />
              <input type="date" name="dataSaida" value={formData.dataSaida || ''} className="border p-2 rounded" onChange={handleInputChange} />
              <input name="sm" value={formData.sm || ''} placeholder="SM" className="border p-2 rounded" onChange={handleInputChange} />
              
              <div className="flex flex-col">
                 <select 
                   name="status" 
                   value={formData.status || 'EM ESTOQUE'} 
                   className="border p-2 rounded bg-white" 
                   onChange={handleInputChange}
                 >
                   <option value="EM ESTOQUE">EM ESTOQUE</option>
                   <option value="PAGO">PAGO</option>
                 </select>
              </div>

              <div className="col-span-full flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  {editingId ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;