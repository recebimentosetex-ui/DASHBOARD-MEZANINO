import React, { useRef, useState } from 'react';
import { InventoryItem } from '../types';
import { Download, Upload, FileSpreadsheet, Plus, Trash2, X, CheckSquare, Square, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryTableProps {
  title: string;
  type: 'STANDARD' | 'PACKAGING';
  category: 'INK' | 'FIBER' | 'PACKAGING';
  data: InventoryItem[];
  isLoading?: boolean;
  onAddItem: (item: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onImportData: (items: Partial<InventoryItem>[]) => Promise<void>;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  title, 
  type, 
  category,
  data, 
  isLoading = false,
  onAddItem, 
  onDeleteItem,
  onBulkDelete,
  onImportData 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the new item form
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    status: 'EM ESTOQUE'
  });

  const getStatusColor = (status: string) => {
    const s = status ? status.toUpperCase().trim() : '';
    if (s === 'EM ESTOQUE') return 'bg-green-100 text-green-700';
    if (s === 'PAGO') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // --- Export / Import Logic ---
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    // Prepare data for export (flatten structure if needed)
    const exportData = data.map(item => ({
      Material: item.material,
      Qtd: item.qtd,
      Status: item.status,
      Responsavel: item.responsavel,
      DataSaida: item.dataSaida,
      SM: item.sm,
      ...(type === 'STANDARD' ? {
        Lote: item.lote || '',
        Sala: item.sala || '',
        Prateleira: item.prateleira || '',
        Fileira: item.fileira || '',
        Maquina: item.maquinaFornecida || ''
      } : {})
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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

  // --- Selection Logic ---
  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(item => item.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // --- Delete Logic ---
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
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} itens?`)) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // --- Add Item Logic ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newItem: Partial<InventoryItem> = {
      ...formData,
      category: category,
      qtd: Number(formData.qtd) || 0,
    };

    try {
      await onAddItem(newItem);
      setIsModalOpen(false);
      setFormData({ status: 'EM ESTOQUE' });
    } catch (error) {
      alert('Erro ao adicionar item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
         <div>
           <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
             {isLoading && <Loader2 className="w-5 h-5 animate-spin text-green-600" />}
           </div>
           <p className="text-gray-500 mt-1">Gerencie os itens do estoque abaixo.</p>
         </div>
         
         <div className="flex flex-wrap gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
            
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading || isSubmitting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </button>

            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={isLoading || isSubmitting}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir ({selectedIds.size})
              </button>
            )}

            <div className="h-8 w-px bg-gray-300 mx-2 hidden sm:block"></div>
            
            <button 
              onClick={handleImportClick}
              disabled={isLoading || isSubmitting}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </button>
            
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-4">
                  <button onClick={handleSelectAll} className="flex items-center">
                    {data.length > 0 && selectedIds.size === data.length ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">Material</th>
                {type === 'STANDARD' && <th className="px-6 py-4 font-semibold">Lote</th>}
                <th className="px-6 py-4 font-semibold">Qtd</th>
                {type === 'STANDARD' && (
                  <>
                    <th className="px-6 py-4 font-semibold">Sala</th>
                    <th className="px-6 py-4 font-semibold">Prateleira</th>
                    <th className="px-6 py-4 font-semibold">Fileira</th>
                    <th className="px-6 py-4 font-semibold">Máq. Forn.</th>
                  </>
                )}
                <th className="px-6 py-4 font-semibold">Responsável</th>
                <th className="px-6 py-4 font-semibold">Data Saída</th>
                <th className="px-6 py-4 font-semibold">SM</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(item.id) ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => handleSelectOne(item.id)} className="flex items-center">
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.material}</td>
                  {type === 'STANDARD' && (
                    <td className="px-6 py-4">{item.lote || '-'}</td>
                  )}
                  <td className="px-6 py-4 font-semibold text-slate-700">{item.qtd}</td>
                  {type === 'STANDARD' && (
                    <>
                      <td className="px-6 py-4">{item.sala || '-'}</td>
                      <td className="px-6 py-4">{item.prateleira || '-'}</td>
                      <td className="px-6 py-4">{item.fileira || '-'}</td>
                      <td className="px-6 py-4">{item.maquinaFornecida || '-'}</td>
                    </>
                  )}
                  <td className="px-6 py-4">{item.responsavel || '-'}</td>
                  <td className="px-6 py-4">{item.dataSaida || '-'}</td>
                  <td className="px-6 py-4">{item.sm || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOne(item.id);
                      }}
                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
            <p>Nenhum item encontrado.</p>
            <p className="text-sm mt-1">Adicione itens manualmente ou importe uma planilha.</p>
          </div>
        )}
        {isLoading && data.length === 0 && (
           <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
             <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
             <p>Carregando dados...</p>
           </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-800">Adicionar Novo Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <input required name="material" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
              </div>

              {type === 'STANDARD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                  <input name="lote" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input required type="number" name="qtd" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
              </div>

              {type === 'STANDARD' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                    <input name="sala" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prateleira</label>
                    <input name="prateleira" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fileira</label>
                    <input name="fileira" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Máq. Fornecida</label>
                    <input name="maquinaFornecida" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input name="responsavel" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Saída</label>
                <input type="date" name="dataSaida" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SM</label>
                <input name="sm" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={handleInputChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <input 
                  list="status-options" 
                  name="status" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                  onChange={handleInputChange} 
                  defaultValue="EM ESTOQUE"
                  placeholder="Selecione ou digite..."
                />
                <datalist id="status-options">
                  <option value="EM ESTOQUE" />
                  <option value="PAGO" />
                </datalist>
              </div>

              <div className="col-span-1 md:col-span-2 pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Adicionar Item'}
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