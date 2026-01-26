import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Label
} from 'recharts';
import { Layers, Droplet, ClipboardCheck, Calendar, Package } from 'lucide-react';
import { StandardInventoryItem } from '../types';

interface DashboardProps {
  fiberData: StandardInventoryItem[];
  inkData: StandardInventoryItem[];
  packagingData: StandardInventoryItem[];
}

const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#818CF8', '#F472B6'];

const Dashboard: React.FC<DashboardProps> = ({ fiberData, inkData, packagingData }) => {
  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  
  // --- Calculations ---

  const stats = useMemo(() => {
    // 1. Total Fiber Lines (Quantidade de Linhas de Fibra) - Card 1
    // REQUISITO: Contar apenas itens da aba ESTOQUE DE FIBRAS com STATUS "EM ESTOQUE"
    const totalFiberLines = fiberData.filter(item => {
      const s = item.status ? item.status.trim().toUpperCase() : '';
      return s === 'EM ESTOQUE';
    }).length;

    // 2. Total Ink Lines (Quantidade de Linhas de Tinta) - Card 2
    // REQUISITO: Contar apenas itens da aba ESTOQUE DE TINTA com STATUS "EM ESTOQUE"
    const totalInkLines = inkData.filter(item => {
      const s = item.status ? item.status.trim().toUpperCase() : '';
      return s === 'EM ESTOQUE';
    }).length;

    // 3. Total Packaging Lines (Quantidade de Linhas de Embalagem) - Card Novo
    const totalPackagingLines = packagingData.filter(item => {
      const s = item.status ? item.status.trim().toUpperCase() : '';
      return s === 'EM ESTOQUE';
    }).length;

    // 4. Saídas Fibras (Total Consumption) - Card 3
    // REQUISITO: Somar QTD apenas de itens com STATUS "PAGO" na aba ESTOQUE DE FIBRAS.
    const totalFiberOutput = fiberData.reduce((acc, item) => {
      const s = item.status ? item.status.trim().toUpperCase() : '';
      if (s === 'PAGO') {
        return acc + (Number(item.qtd) || 0);
      }
      return acc;
    }, 0);

    return { totalFiberLines, totalInkLines, totalPackagingLines, totalFiberOutput };
  }, [fiberData, inkData, packagingData]);

  // Bar Chart Data: Quantity per Room (Sala) - Baseado em Fibras
  const barChartData = useMemo(() => {
    const roomMap: Record<string, number> = {};
    
    fiberData.forEach(item => {
      const roomName = item.sala ? item.sala.toUpperCase() : 'SEM SALA';
      roomMap[roomName] = (roomMap[roomName] || 0) + (Number(item.qtd) || 0);
    });

    return Object.keys(roomMap).map((room, index) => ({
      name: room,
      value: roomMap[room],
      fill: index % 2 === 0 ? '#FCD34D' : '#EF4444' // Alternating colors like original design
    }));
  }, [fiberData]);

  // Donut Chart Data: Materiais Pagos (Estoque de Fibras)
  // Regra: Filtrar Status = PAGO e contar a quantidade de vezes (frequência)
  const donutChartData = useMemo(() => {
    // 1. Filtrar itens PAGOS
    const paidItems = fiberData.filter(item => {
      const status = item.status ? item.status.trim().toUpperCase() : '';
      return status === 'PAGO';
    });

    const materialMap: Record<string, number> = {};
    let totalCount = 0;

    paidItems.forEach(item => {
      // 2. Contabilizar a quantidade de VEZES (Count row occurrences)
      const material = item.material || 'Sem Material';
      materialMap[material] = (materialMap[material] || 0) + 1;
      totalCount++;
    });

    // 3. Converter para array, ordenar e pegar Top 5
    const chartData = Object.keys(materialMap)
      .map((material, index) => ({
        name: material, // Nome curto para o gráfico
        rawName: material, // Nome completo
        value: materialMap[material],
        fill: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Take top 5

    return { chartData, totalCount };
  }, [fiberData]);

  // Machine Stats: Top Machines - Baseado em Fibras onde STATUS = 'PAGO'
  const machineStats = useMemo(() => {
    const machineMap: Record<string, number> = {};
    
    fiberData.forEach(item => {
      // Normalização para garantir match correto
      const status = item.status ? item.status.trim().toUpperCase() : '';
      const maquina = item.maquinaFornecida ? item.maquinaFornecida.trim() : '';

      // Filtro: Tem máquina definida E status é 'PAGO'
      if (maquina && maquina !== '-' && status === 'PAGO') {
        machineMap[maquina] = (machineMap[maquina] || 0) + 1;
      }
    });

    const sortedMachines = Object.keys(machineMap)
      .map(machine => ({
        name: machine,
        value: machineMap[machine]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Top 3

    // Calculate max for bar width
    const maxVal = sortedMachines.length > 0 ? sortedMachines[0].value : 10; // Default max to avoid div by zero if empty

    const barColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

    return sortedMachines.map((m, i) => ({
      ...m,
      max: maxVal,
      color: barColors[i % barColors.length]
    }));
  }, [fiberData]);


  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h4 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Bem-vindo ao Portal de Dados</h4>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Dashboard Integrado</h1>
        </div>
        <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center shadow-sm">
          <Calendar className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-gray-600 text-sm font-medium capitalize">{currentMonthName}</span>
        </div>
      </div>

      {/* Top Cards - Agora com 4 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 - Total Fibra Count */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mr-4 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Estoque Fibras</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalFiberLines}</p>
          </div>
        </div>

        {/* Card 2 - Total Ink Count */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mr-4 shrink-0">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Estoque Tintas</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalInkLines}</p>
          </div>
        </div>

        {/* Card 3 - Total Packaging Count (Novo) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mr-4 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Estoque Embalagem</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalPackagingLines}</p>
          </div>
        </div>

        {/* Card 4 - Saídas Fibras */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 mr-4 shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Saídas Fibras (Qtd)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalFiberOutput.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Quantidade de Fibras por Sala</h3>
            <div className="flex space-x-4 text-xs font-semibold">
              {barChartData.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.fill }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} barSize={80}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill="transparent" 
                        stroke={entry.fill} 
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Charts */}
        <div className="flex flex-col space-y-6">
          
          {/* Top Machines - Agora mostrando 'PAGO' */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-6">Máquinas + Utilizadas (Pagos)</h3>
            <div className="space-y-6">
              {machineStats.length > 0 ? machineStats.map((machine) => (
                <div key={machine.name}>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>{machine.name}</span>
                    <span>{machine.value} lotes</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`${machine.color} h-2 rounded-full`} 
                      style={{ width: `${(machine.value / machine.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                 <p className="text-gray-400 text-sm text-center">Nenhuma máquina com item PAGO</p>
              )}
            </div>
          </div>

          {/* Donut Chart - Updated: Count Frequency of 'PAGO' items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Fibras Pagas (Top 5)</h3>
            
            {donutChartData.chartData.length > 0 ? (
              <div className="flex flex-row items-center justify-between flex-1">
                <div className="h-[160px] w-[160px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutChartData.chartData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {donutChartData.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                        ))}
                        <Label
                          value={donutChartData.totalCount}
                          position="center"
                          className="text-2xl font-bold fill-slate-800"
                          dy={-10}
                        />
                        <Label
                          value="TOTAL"
                          position="center"
                          className="text-xs font-medium fill-gray-400"
                          dy={15}
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 pl-4 space-y-3 min-w-0">
                  {donutChartData.chartData.map((item, idx) => (
                    <div key={idx} className="flex items-center text-xs truncate">
                      <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.fill }}></span>
                      <span className="font-semibold text-slate-700 truncate" title={item.rawName}>{item.rawName}</span>
                      <span className="ml-auto text-gray-500 pl-1">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Nenhum item PAGO encontrado
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;