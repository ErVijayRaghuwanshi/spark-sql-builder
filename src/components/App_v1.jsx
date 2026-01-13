import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Columns, 
  Filter, 
  ArrowRight,
  ChevronDown,
  X,
  Play
} from 'lucide-react';

// --- CONFIGURATION / SCHEMAS ---

const ALLOWED_INPUT_SCHEMA = {
  table_name: "user_events",
  columns: [
    { name: "user_id", type: "long", description: "Unique identifier for the user" },
    { name: "event_type", type: "string", options: ["click", "view", "purchase", "login"] },
    { name: "event_date", type: "date", description: "Date of the event" },
    { name: "amount", type: "double", description: "Transaction amount if applicable" },
    { name: "country_code", type: "string", options: ["US", "CA", "GB", "DE", "FR"] },
    { name: "is_premium", type: "boolean", description: "User subscription status" }
  ]
};

const STRICT_OUTPUT_SCHEMA = {
  name: "Reporting Standard v1",
  required_columns: ["user_id", "event_type", "event_date"],
  optional_columns: ["amount", "country_code"]
};

// --- COMPONENTS ---

const App_v1 = () => {
  const [selectedColumns, setSelectedColumns] = useState(["user_id", "event_type", "event_date"]);
  const [filters, setFilters] = useState([
    { id: '1', column: 'event_type', operator: '=', value: 'purchase' }
  ]);
  const [limit, setLimit] = useState(100);
  const [activeTab, setActiveTab] = useState('builder'); // builder | preview

  // Logic: Sync strict schema requirements
  const toggleColumn = (colName) => {
    // Cannot remove required columns
    if (STRICT_OUTPUT_SCHEMA.required_columns.includes(colName)) return;
    
    setSelectedColumns(prev => 
      prev.includes(colName) ? prev.filter(c => c !== colName) : [...prev, colName]
    );
  };

  const addFilter = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setFilters([...filters, { id: newId, column: 'user_id', operator: '=', value: '' }]);
  };

  const removeFilter = (id) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id, key, value) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // SQL Generation Engine
  const generatedSQL = useMemo(() => {
    const selectClause = selectedColumns.length > 0 ? selectedColumns.join(',\n  ') : '*';
    
    const whereClause = filters.length > 0 
      ? `WHERE\n  ` + filters.map(f => {
          const col = ALLOWED_INPUT_SCHEMA.columns.find(c => c.name === f.column);
          const isString = col?.type === 'string' || col?.type === 'date';
          const val = isString ? `'${f.value}'` : f.value;
          return `${f.column} ${f.operator} ${val}`;
        }).join('\n  AND ')
      : '';

    return `SELECT\n  ${selectClause}\nFROM ${ALLOWED_INPUT_SCHEMA.table_name}\n${whereClause}\nLIMIT ${limit};`;
  }, [selectedColumns, filters, limit]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Spark SQL Builder</h1>
          <p className="text-slate-500 mt-1">Schema-constrained query generator for data engineers.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <button 
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'builder' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Builder UI
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            SQL Preview
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Projection / Output Schema */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Columns className="w-4 h-4 text-indigo-600" />
                <span>Select Columns (Output Schema)</span>
              </div>
              <span className="text-xs font-mono text-slate-400">STRICT_MODE: ENABLED</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider font-bold">Output Specification: {STRICT_OUTPUT_SCHEMA.name}</p>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_INPUT_SCHEMA.columns.map(col => {
                  const isRequired = STRICT_OUTPUT_SCHEMA.required_columns.includes(col.name);
                  const isOptional = STRICT_OUTPUT_SCHEMA.optional_columns.includes(col.name);
                  const isSelected = selectedColumns.includes(col.name);
                  
                  if (!isRequired && !isOptional) return null;

                  return (
                    <button
                      key={col.name}
                      disabled={isRequired}
                      onClick={() => toggleColumn(col.name)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border transition-all
                        ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'}
                        ${isRequired ? 'cursor-not-allowed opacity-100 ring-1 ring-indigo-200 ring-offset-1' : ''}
                      `}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                      {col.name}
                      {isRequired && <span className="text-[10px] bg-indigo-100 px-1 rounded uppercase font-bold text-indigo-500">Required</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Filtering / WHERE Clause */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Filters (Allowed Inputs)</span>
              </div>
              <button 
                onClick={addFilter}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                + ADD CONDITION
              </button>
            </div>
            <div className="p-6 space-y-3">
              {filters.length === 0 && (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                  No filters applied. Results will include all data.
                </div>
              )}
              {filters.map((filter) => {
                const colDef = ALLOWED_INPUT_SCHEMA.columns.find(c => c.name === filter.column);
                return (
                  <div key={filter.id} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <select 
                      value={filter.column}
                      onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {ALLOWED_INPUT_SCHEMA.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                      ))}
                    </select>

                    <select 
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="LIKE">LIKE</option>
                    </select>

                    {colDef?.options ? (
                      <select 
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm flex-1 min-w-30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Select Value...</option>
                        {colDef.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={colDef?.type === 'long' || colDef?.type === 'double' ? 'number' : 'text'}
                        placeholder="Value..."
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="bg-white border border-slate-200 rounded px-3 py-1.5 text-sm flex-1 min-w-30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    )}

                    <button 
                      onClick={() => removeFilter(filter.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-100 text-sm uppercase tracking-wider mb-1">Execution Limit</h3>
              <p className="text-xs text-indigo-300">Set maximum rows to prevent Spark memory overhead.</p>
            </div>
            <div className="flex items-center bg-indigo-800/50 rounded-lg px-4 py-2 border border-indigo-700">
              <span className="text-xs font-mono mr-3 text-indigo-300">LIMIT</span>
              <input 
                type="number" 
                value={limit} 
                onChange={(e) => setLimit(e.target.value)}
                className="bg-transparent text-white font-mono w-20 focus:outline-none text-right"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results / Validation */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit sticky top-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 font-semibold">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Spark SQL Output</span>
            </div>
            <div className="p-0">
              <div className="bg-slate-900 p-6 text-indigo-300 font-mono text-sm leading-relaxed overflow-x-auto min-h-75">
                <pre className="whitespace-pre-wrap">{generatedSQL}</pre>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex-1 p-2 bg-green-50 text-green-700 rounded border border-green-100 flex items-center gap-2 italic">
                  <CheckCircle2 className="w-3 h-3" /> Syntax Verified
                </div>
                <div className="flex-1 p-2 bg-blue-50 text-blue-700 rounded border border-blue-100 flex items-center gap-2 italic">
                  <Database className="w-3 h-3" /> Input Schema Matched
                </div>
              </div>
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                onClick={() => {
                  navigator.clipboard.writeText(generatedSQL);
                  alert("Copied Spark SQL to clipboard!");
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                Copy & Run Query
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Schema Constraints</h4>
             <ul className="space-y-4">
               <li className="flex gap-3">
                 <div className="bg-indigo-100 p-2 rounded-lg h-fit">
                    <Database className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold">Strict Source</p>
                   <p className="text-xs text-slate-500">Only querying `{ALLOWED_INPUT_SCHEMA.table_name}` is permitted.</p>
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="bg-indigo-100 p-2 rounded-lg h-fit">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold">Required Projections</p>
                   <p className="text-xs text-slate-500">Columns: {STRICT_OUTPUT_SCHEMA.required_columns.join(', ')} must exist in every output.</p>
                 </div>
               </li>
             </ul>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App_v1;