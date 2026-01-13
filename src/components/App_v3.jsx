import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Calendar, 
  Target, 
  FileCode, 
  Copy, 
  Zap, 
  Database, 
  AlertCircle,
  Check,
  Cpu,
  History
} from 'lucide-react';

// --- CONSTANTS & DEFAULTS ---
const PROTOCOLS = ["VOICE", "SMS", "DATA"];
const DATA_SOURCE = "parquet.`hdfs://SUNIPR/user/ctadmin/vijay/TargetAnomalies/MASS`";

const INITIAL_TARGETS = [
  { tel: "9811002233", name: "VIP Exec Global" },
  { tel: "9123456789", name: "Gateway Node East" },
  { tel: "8800112244", name: "Staff Admin Alpha" },
  { tel: "7042556677", name: "Sensor Fleet 01" }
];

const App_v3 = () => {
  // State for Rule Configuration
  const [ruleName, setRuleName] = useState("Target is calling one person only");
  const [trainingPeriod, setTrainingPeriod] = useState(5);
  const [referenceDate, setReferenceDate] = useState("2026-01-08");
  const [protocol, setProtocol] = useState("VOICE");
  const [threshold, setThreshold] = useState(1);
  const [groupId, setGroupId] = useState("1767861204");
  const [groupName, setGroupName] = useState("Release v110 Full Suite");
  
  // UI States
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  // SQL Generator Engine
  const generatedSQL = useMemo(() => {
    const targetsJson = JSON.stringify(INITIAL_TARGETS.map(t => ({ [t.tel]: { target_name: t.name } })));
    const refTS = `${referenceDate} 00:00:00`;

    return `WITH targets AS (
  SELECT target_entry.key AS mobile_number, target_entry.value.target_name AS target_name 
  FROM (SELECT from_json('${targetsJson}', 'array<map<string,struct<target_name:string>>>') AS raw) raw 
  LATERAL VIEW EXPLODE(arr) a AS target_map 
  LATERAL VIEW EXPLODE(MAP_ENTRIES(target_map)) t AS target_entry
), 
T_summary_tp AS (
  -- Training Period Summary: Analyzing historical behavior
  SELECT MOBILENUMBER, COUNT(DISTINCT CALLEDNUMBER) AS unique_destinations 
  FROM ${DATA_SOURCE}
  WHERE to_date(DATE) BETWEEN date_sub('${refTS}', CAST('${trainingPeriod}' AS INT)) AND date_sub('${refTS}', 1)
    AND PROTOCOL = '${protocol}' 
    AND MOBILENUMBER IN (SELECT mobile_number FROM targets)
  GROUP BY MOBILENUMBER
), 
T_anomaly AS (
  -- Identifying targets that meet the threshold criteria
  SELECT t.mobile_number, t.target_name, s.unique_destinations 
  FROM targets t 
  JOIN T_summary_tp s ON t.mobile_number = s.MOBILENUMBER 
  WHERE s.unique_destinations = ${threshold}
), 
T_active_agg AS (
  -- Current Activity: Capturing metadata for the detection date
  SELECT MOBILENUMBER, MIN(TRANSACTIONSTARTTIME) AS FirstSeenStartTime, MAX(TRANSACTIONSTARTTIME) AS LastSeenStartTime 
  FROM ${DATA_SOURCE}
  WHERE to_date(DATE) = to_date('${refTS}') 
    AND PROTOCOL = '${protocol}' 
    AND MOBILENUMBER IN (SELECT mobile_number FROM targets) 
  GROUP BY MOBILENUMBER 
)
SELECT 
  concat(a.mobile_number, '-AID-${trainingPeriod}-', '${protocol}-', '${refTS}') AS id,
  a.mobile_number AS MobileNumber,
  a.target_name AS TargetName,
  '${trainingPeriod}' AS RuleId,
  '${ruleName}' AS RuleName,
  '${groupId}' AS GroupId,
  '${groupName}' AS GroupName,
  concat('Target connected to exactly ${threshold} unique destination(s) during the ${trainingPeriod} days prior.') AS Evidence,
  '${refTS}' AS Date,
  a.unique_destinations AS BehaviourMetricValue,
  d.FirstSeenStartTime, 
  d.LastSeenStartTime 
FROM T_anomaly a 
JOIN T_active_agg d ON d.MOBILENUMBER = a.mobile_number;`;
  }, [ruleName, trainingPeriod, referenceDate, protocol, threshold, groupId, groupName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SparkAnomaly UI</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connected to HDFS-SUNIPR</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95">
            <Zap size={16} fill="currentColor" />
            Deploy Template
          </button>
        </div>
      </nav>

      <main className="max-w-400 mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Sidebar: Controls */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Section: Rule Context */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-indigo-600" size={18} />
              <h2 className="font-bold text-slate-800">Rule Identification</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template Label</label>
                <input 
                  type="text" 
                  value={ruleName} 
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group Name</label>
                  <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Group ID</label>
                  <input type="text" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Analysis Engine */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <History className="text-indigo-600" size={18} />
              <h2 className="font-bold text-slate-800">Temporal Parameters</h2>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 italic">Lookback (Days)</label>
                  <div className="relative">
                    <History className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="number" 
                      value={trainingPeriod} 
                      onChange={(e) => setTrainingPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 italic">Ref. Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="date" 
                      value={referenceDate} 
                      onChange={(e) => setReferenceDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Protocol</label>
                  <select 
                    value={protocol} 
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                  >
                    {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Threshold (==)</label>
                  <input 
                    type="number" 
                    value={threshold} 
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Target Summary */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Target size={80} />
             </div>
             <h3 className="flex items-center gap-2 font-bold text-indigo-400 text-sm mb-4">
               <Cpu size={16} /> Targeted Catalog ({INITIAL_TARGETS.length})
             </h3>
             <div className="space-y-3 max-h-50 overflow-y-auto pr-2 custom-scrollbar">
               {INITIAL_TARGETS.map(t => (
                 <div key={t.tel} className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                   <span className="text-slate-300">{t.tel}</span>
                   <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded italic">{t.name}</span>
                 </div>
               ))}
             </div>
             <p className="mt-4 text-[10px] text-slate-500 leading-relaxed italic">
               Note: These targets are exploded via MAP_ENTRIES in the initial CTE block.
             </p>
          </div>
        </div>

        {/* Right: Code Editor Surface */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[calc(100vh-140px)]">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileCode size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Spark SQL Engine v2.5</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] text-slate-500 font-mono">ENCODING: UTF-8</div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="text-[10px] text-slate-500 font-mono">DIALECT: SPARK-SQL</div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
              <pre className="text-sm font-mono leading-relaxed text-indigo-100/90 whitespace-pre">
                {generatedSQL}
              </pre>
            </div>
            
            <div className="p-4 bg-white/2 border-t border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <AlertCircle size={14} />
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Optimized with CTE lookups to minimize shuffling across the Spark Cluster. 
                Ensure `targets` metadata matches HDFS partitioning for best performance.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
};

export default App_v3;