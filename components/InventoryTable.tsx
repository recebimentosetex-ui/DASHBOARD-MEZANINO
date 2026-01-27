import React, { useRef, useState, useMemo, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Download, Upload, Plus, Trash2, CheckSquare, Square, Loader2, Pencil, Search, Filter, ArrowUpAZ, ArrowDownZA } from 'lucide-react';
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

// Interface for form state to handle string inputs comfortably
interface FormState {
  codigo: string;
  material: string; // Descrição
  qtd: string;
  lote: string;
  sala: string; // Rua
  prateleira: string;
  fileira: string; // Posição/Fileira
  maquinaFornecida: string; 
  responsavel: string;
  dataSaida: string;
  sm: string;
  status: string;
}

const initialFormState: FormState = {
  codigo: '',
  material: '',
  qtd: '',
  lote: '',
  sala: '',
  prateleira: '',
  fileira: '',
  maquinaFornecida: '',
  responsavel: '',
  dataSaida: '',
  sm: '',
  status: 'EM ESTOQUE'
};

const getSafeValue = (item: InventoryItem, key: keyof InventoryItem): string => {
  const val = item[key];
  if (val === undefined || val === null) return '';
  return String(val);
};

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
  
  // UI State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter & Sort State
  const [activeMenuColumn, setActiveMenuColumn] = useState<keyof InventoryItem | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({}); 
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'asc' | 'desc' } | null>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuColumn && !(e.target as Element).closest('.filter-menu-container')) {
        setActiveMenuColumn(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuColumn]);

  // --- Data Processing ---
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerTerm)
        );
      });
    }

    // 2. Column Filters (Excel Style)
    Object.keys(filters).forEach((key) => {
      const allowedValues = filters[key];
      if (allowedValues) {
        result = result.filter(item => {
          const val = getSafeValue(item, key as keyof InventoryItem);
          return allowedValues.includes(val === '' ? '-' : val);
        });
      }
    });

    // 3. Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = getSafeValue(a, sortConfig.key).toLowerCase();
        const valB = getSafeValue(b, sortConfig.key).toLowerCase();

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        
        // Try numeric sort first
        if (!isNaN(numA) && !isNaN(numB) && !valA.includes('-') && !valB.includes('-')) {
             return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig]);

  // --- Filter Logic ---
  const getUniqueValues = (key: keyof InventoryItem) => {
    const values = new Set<string>();
    data.forEach(item => {
      const val = getSafeValue(item, key);
      values.add(val === '' ? '-' : val);
    });
    return Array.from(values).sort();
  };

  const handleSort = (direction: 'asc' | 'desc') => {
    if (activeMenuColumn) {
      setSortConfig({ key: activeMenuColumn, direction });
      setActiveMenuColumn(null);
    }
  };

  const handleFilterChange = (value: string, checked: boolean) => {
    if (!activeMenuColumn) return;
    
    setFilters(prev => {
      const currentFilters = prev[activeMenuColumn] || getUniqueValues(activeMenuColumn);
      let newFilters: string[];

      if (checked) {
        newFilters = [...currentFilters, value];
      } else {
        newFilters = currentFilters.filter(v => v !== value);
      }
      return { ...prev, [activeMenuColumn]: newFilters };
    });
  };

  const handleSelectAllFilters = (checked: boolean) => {
    if (!activeMenuColumn) return;
    if (checked) {
      const newFilters = { ...filters };
      delete newFilters[activeMenuColumn];
      setFilters(newFilters);
    } else {
      setFilters(prev => ({ ...prev, [activeMenuColumn]: [] }));
    }
  };

  // --- Header Component ---
  const HeaderCell = ({ label, columnKey, className = "" }: { label: string, columnKey: keyof InventoryItem, className?: string }) => {
    const uniqueValues = getUniqueValues(columnKey);
    const currentFilters = filters[columnKey];
    const isAllSelected = !currentFilters || currentFilters.length === uniqueValues.length;
    
    const isOpen = activeMenuColumn === columnKey;
    const isFiltered = !!currentFilters;

    return (
      <th className={`px-2 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider relative group ${className}`}>
        <div 
          className="flex items-center justify-between hover:bg-gray-200 rounded px-2 py-1 transition-colors cursor-pointer select-none" 
          onClick={(e) => { e.stopPropagation(); setActiveMenuColumn(isOpen ? null : columnKey); }}
        >
          <span className="truncate">{label}</span>
          <div className={`ml-2 p-1 rounded ${isOpen || isFiltered ? 'bg-gray-300 text-slate-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
            <Filter className="w-3 h-3" />
          </div>
        </div>

        {isOpen && (
          <div className="filter-menu-container absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-2xl z-50 text-left font-normal normal-case cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border-b border-gray-100 space-y-1">
              <button onClick={() => handleSort('asc')} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                <ArrowUpAZ className="w-4 h-4 mr-2" /> Classificar de A a Z
              </button>
              <button onClick={() => handleSort('desc')} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                <ArrowDownZA className="w-4 h-4 mr-2" /> Classificar de Z a A
              </button>
            </div>

            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
               <label className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer font-bold text-sm text-gray-800">
                  <input 
                    type="checkbox" 
                    className="rounded text-green-600 focus:ring-green-500 mr-2"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAllFilters(e.target.checked)}
                  />
                  (Selecionar Tudo)
               </label>
            </div>

            <div className="p-2 max-h-56 overflow-y-auto">
               {uniqueValues.map(val => (
                 <label key={val} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700">
                    <input 
                      type="checkbox" 
                      className="rounded text-green-600 focus:ring-green-500 mr-2"
                      checked={!currentFilters || currentFilters.includes(val)}
                      onChange={(e) => handleFilterChange(val, e.target.checked)}
                    />
                    <span className="truncate">{val}</span>
                 </label>
               ))}
               {uniqueValues.length === 0 && <div className="text-xs text-gray-400 px-2">Vazio</div>}
            </div>
            
            <div className="p-2 border-t bg-gray-50 flex justify-end">
               <button 
                 onClick={() => setActiveMenuColumn(null)}
                 className="text-xs px-4 py-1.5 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors"
               >
                 OK
               </button>
            </div>
          </div>
        )}
      </th>
    );
  };

  // --- CRUD Operations ---
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      codigo: item.codigo || '',
      material: item.material || '',
      qtd: String(item.qtd),
      lote: item.lote || '',
      sala: item.sala || '',
      prateleira: item.prateleira || '',
      fileira: item.fileira || '',
      maquinaFornecida: item.maquinaFornecida || '',
      responsavel: item.responsavel || '',
      dataSaida: item.dataSaida || '',
      sm: item.sm || '',
      status: item.status || 'EM ESTOQUE'
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
      const payload: Partial<InventoryItem> = {
        category,
        codigo: formData.codigo,
        material: formData.material,
        qtd: formData.qtd === '' ? 0 : Number(formData.qtd),
        lote: formData.lote,
        sala: category === 'PACKAGING' ? '' : formData.sala,
        prateleira: category === 'PACKAGING' ? '' : formData.prateleira,
        fileira: formData.fileira,
        maquinaFornecida: formData.maquinaFornecida,
        responsavel: formData.responsavel,
        dataSaida: formData.dataSaida,
        sm: formData.sm,
        status: formData.status
      };

      if (editingId) {
        await onUpdateItem(editingId, payload);
      } else {
        await onAddItem(payload);
      }
      
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar o item. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Bulk Selection ---
  const handleSelectAll = () => {
    const visibleIds = processedData.map(item => item.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    
    const newSelected = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleIds.forEach(id => newSelected.delete(id));
    } else {
      visibleIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkDeleteAction = async () => {
    if (window.confirm(`Excluir ${selectedIds.size} itens selecionados?`)) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (window.confirm('Excluir este item?')) {
      await onDeleteItem(id);
    }
  };

  // --- File Imports/Exports ---
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
      const itemsToImport = jsonData.map(item => ({
        category,
        codigo: item.Codigo || item.codigo || '',
        material: item.Descricao || item.descricao || item.Material || item.material || 'Importado',
        qtd: Number(item.Qtd || item.qtd || 0),
        status: item.Status || 'EM ESTOQUE',
        lote: item.Lote || '',
        sala: category === 'PACKAGING' ? '' : (item.Rua || item.rua || ''), 
        fileira: item.Posicao || item.posicao || item.Fileira || item.fileira || '', 
        prateleira: category === 'PACKAGING' ? '' : (item.Prateleira || '')
      }));
      if (confirm(`Importar ${itemsToImport.length} itens?`)) {
        setIsSubmitting(true);
        await onImportData(itemsToImport);
        setIsSubmitting(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    const exportData = processedData.map(item => {
      const base = {
        Codigo: item.codigo,
        Descricao: item.material,
        Lote: item.lote,
        Qtd: item.qtd,
      };
      
      // Condicional para exportação também
      if (category !== 'PACKAGING') {
        Object.assign(base, { Prateleira: item.prateleira, Posicao: item.fileira, Rua: item.sala });
      } else {
        Object.assign(base, { Fileira: item.fileira });
      }

      Object.assign(base, {
        Responsavel: item.responsavel,
        DataSaida: item.dataSaida,
        SM: item.sm,
        Status: item.status
      });

      return base;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const isAllVisibleSelected = processedData.length > 0 && processedData.every(item => selectedIds.has(item.id));

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
         <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-green-600" />}
         </div>
         
         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <button onClick={handleOpenNewModal} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> Novo Item
            </button>

            {selectedIds.size > 0 && (
              <button onClick={handleBulkDeleteAction} className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 shadow-sm transition-colors whitespace-nowrap">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir ({selectedIds.size})
              </button>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
            <button onClick={handleImportClick} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap">
              <Upload className="w-4 h-4 inline mr-2" /> Importar
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm whitespace-nowrap">
              <Download className="w-4 h-4 inline mr-2" /> Exportar
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left text-gray-500 relative">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-4 text-center">
                  <button onClick={handleSelectAll}>
                     {isAllVisibleSelected ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                  </button>
                </th>
                
                {/* 
                   ORDEM SOLICITADA:
                   ITEM (Checkbox) | MATERIAL (Código) | LOTE | QTD | PRATELEIRA? | POSIÇÃO/FILEIRA | RUA | DESCRIÇÃO DO MATERIAL | RESPONSÁVEL | DATA SAÍDA | SM | STATUS
                */}
                <HeaderCell label="MATERIAL" columnKey="codigo" className="min-w-[100px]" />
                <HeaderCell label="LOTE" columnKey="lote" />
                <HeaderCell label="QTD" columnKey="qtd" />
                
                {category !== 'PACKAGING' && (
                  <HeaderCell label="PRATELEIRA" columnKey="prateleira" />
                )}
                
                <HeaderCell label={category === 'PACKAGING' ? "FILEIRA" : "POSIÇÃO"} columnKey="fileira" />
                
                {category !== 'PACKAGING' && (
                  <HeaderCell label="RUA" columnKey="sala" />
                )}
                
                <HeaderCell label="DESCRIÇÃO DO MATERIAL" columnKey="material" className="min-w-[200px]" />
                <HeaderCell label="RESPONSÁVEL PELO MATERIAL FORNECIDO" columnKey="responsavel" className="min-w-[200px]" />
                <HeaderCell label="DATA DE SAÍDA" columnKey="dataSaida" className="min-w-[120px]" />
                <HeaderCell label="SM" columnKey="sm" />
                <HeaderCell label="STATUS" columnKey="status" />

                <th className="px-4 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(item.id) ? 'bg-green-50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleSelectOne(item.id)}>
                      {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                    </button>
                  </td>

                  <td className="px-2 py-3 font-medium text-gray-900">{item.codigo || '-'}</td>
                  <td className="px-2 py-3">{item.lote || '-'}</td>
                  <td className="px-2 py-3 font-semibold text-slate-700">{item.qtd}</td>
                  
                  {category !== 'PACKAGING' && (
                    <td className="px-2 py-3">{item.prateleira || '-'}</td>
                  )}
                  
                  <td className="px-2 py-3">{item.fileira || '-'}</td>
                  
                  {category !== 'PACKAGING' && (
                    <td className="px-2 py-3">{item.sala || '-'}</td>
                  )}

                  <td className="px-2 py-3">{item.material}</td>
                  <td className="px-2 py-3">{item.responsavel || '-'}</td>
                  <td className="px-2 py-3 text-sm">{item.dataSaida || '-'}</td>
                  <td className="px-2 py-3">{item.sm || '-'}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${item.status === 'EM ESTOQUE' ? 'bg-green-100 text-green-700' : 
                        item.status === 'PAGO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="px-2 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteOne(item.id); }} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {processedData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={category === 'PACKAGING' ? 11 : 13} className="p-12 text-center text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{searchTerm ? 'Nenhum item encontrado.' : 'Nenhum item cadastrado.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">{editingId ? 'Editar Item' : `Novo Item (${category})`}</h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="col-span-full md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">CÓDIGO (MATERIAL)</label>
                <input name="codigo" value={formData.codigo} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="Ex: M601..." />
              </div>

              <div className="col-span-full md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIÇÃO DO MATERIAL</label>
                <input required name="material" value={formData.material} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="Ex: Tinta Azul..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">LOTE</label>
                <input name="lote" value={formData.lote} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">QUANTIDADE</label>
                <input required type="number" name="qtd" value={formData.qtd} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              {category !== 'PACKAGING' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">RUA (SALA)</label>
                  <input name="sala" value={formData.sala} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              )}

              {category !== 'PACKAGING' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">PRATELEIRA</label>
                  <input name="prateleira" value={formData.prateleira} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{category === 'PACKAGING' ? "FILEIRA" : "POSIÇÃO (FILEIRA)"}</label>
                <input name="fileira" value={formData.fileira} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-1">RESPONSÁVEL PELO MATERIAL</label>
                <input name="responsavel" value={formData.responsavel} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">DATA DE SAÍDA</label>
                <input type="date" name="dataSaida" value={formData.dataSaida} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">SM</label>
                <input name="sm" value={formData.sm} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">STATUS</label>
                 <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded bg-white focus:ring-2 focus:ring-green-500 outline-none">
                   <option value="EM ESTOQUE">EM ESTOQUE</option>
                   <option value="PAGO">PAGO</option>
                 </select>
              </div>

              <div className="col-span-full flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-md transition-colors flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingId ? 'Salvar Alterações' : 'Adicionar Item'}
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