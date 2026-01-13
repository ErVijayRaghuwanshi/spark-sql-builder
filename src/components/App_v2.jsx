import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Code2, 
  Settings, 
  AlertCircle, 
  Calendar, 
  ShieldCheck,
  Target,
  FileCode,
  Copy,
  Zap
} from 'lucide-react';

// --- SCHEMA & METADATA CONFIG ---

const PROTOCOLS = ["VOICE", "SMS", "DATA"];
const DATA_SOURCE_PATH = "parquet.`hdfs://SUNIPR/user/ctadmin/vijay/TargetAnomalies/MASS`";

const INITIAL_TARGETS = [
  { tel: "9811002233", name: "VIP Exec Global" },
  { tel: "9123456789", name: "Gateway Node East" },
  { tel: "8800112244", name: "Staff Admin Alpha" }
];

const App_v2 = () => {
  // Rule State
  const [ruleName, setRuleName] = useState("Target is calling one person only");
  const [trainingPeriod, setTrainingPeriod] = useState(5);
  const [referenceDate, setReferenceDate] = useState("2026-01-08");
  const [protocol, setProtocol] = useState("VOICE");
  const [anomalyThreshold, setAnomalyThreshold] = useState(1);
  const [groupId, setGroupId] = useState("1767861204");
  const [groupName, setGroupName] = useState("Release v110 Full Suite");

  // SQL Template Generator
  const generatedSQL = useMemo(() => {
    const targetsJson = JSON.stringify(INITIAL_TARGETS.map(t => ({ [t.tel]: { target_name: t.name } })));
    const refTS = `${referenceDate} 00:00:00`;

    return `WITH targets AS (
  SELECT target_entry.key AS mobile_number, target_entry.value.target_name AS target_name 
  FROM (SELECT from_json('${targetsJson}', 'array<map<string,struct<target_name:string>>>') AS arr) raw 
  LATERAL VIEW EXPLODE(arr) a AS target_map 
  LATERAL VIEW EXPLODE(MAP_ENTRIES(target_map)) t AS target_entry
), 
T_summary_tp AS (
  SELECT MOBILENUMBER, COUNT(DISTINCT CALLEDNUMBER) AS unique_destinations 
  FROM ${DATA_SOURCE_PATH}
  WHERE to_date(DATE) BETWEEN date_sub('${refTS}', CAST('${trainingPeriod}' AS INT)) AND date_sub('${refTS}', 1)
    AND PROTOCOL = '${protocol}' 
    AND MOBILENUMBER IN (SELECT mobile_number FROM targets)
  GROUP BY MOBILENUMBER
), 
T_anomaly AS (
  SELECT t.mobile_number, t.target_name, s.unique_destinations 
  FROM targets t 
  JOIN T_summary_tp s ON t.mobile_number = s.MOBILENUMBER 
  WHERE s.unique_destinations = ${anomalyThreshold}
), 
T_active_agg AS (
  SELECT MOBILENUMBER, MIN(TRANSACTIONSTARTTIME) AS FirstSeenStartTime, MAX(TRANSACTIONSTARTTIME) AS LastSeenStartTime 
  FROM ${DATA_SOURCE_PATH}
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
  concat('Target connected to exactly ${anomalyThreshold} unique destination(s) during the ${trainingPeriod} days prior.') AS Evidence,
  '${refTS}' AS Date,
  a.unique_destinations AS BehaviourMetricValue,
  d.FirstSeenStartTime, 
  d.LastSeenStartTime 
FROM T_anomaly a 
JOIN T_active_agg d ON d.MOBILENUMBER = a.mobile_number;`;
  }, [ruleName, trainingPeriod, referenceDate, protocol, anomalyThreshold, groupId, groupName]);

  const copyToClipboard = () => {
    const el = document.createElement('textarea');
    el.value = generatedSQL;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4">
      <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Anomaly Rule Builder</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Spark SQL Template Generator</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyToClipboard} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Copy size={16} /> Copy SQL
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Zap size={16} /> Deploy Rule
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Rule Basics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold mb-4 text-slate-700">
              <Settings size={18} className="text-indigo-600" /> General Identification
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rule Template Name</label>
                <input 
                  type="text" 
                  value={ruleName} 
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Name</label>
                  <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group ID</label>
                  <input type="text" value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold mb-4 text-slate-700">
              <Calendar size={18} className="text-indigo-600" /> Analysis Parameters
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Training Period (Days)</label>
                  <input 
                    type="number" 
                    value={trainingPeriod} 
                    onChange={(e) => setTrainingPeriod(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference Date</label>
                  <input 
                    type="date" 
                    value={referenceDate} 
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Protocol Type</label>
                  <select 
                    value={protocol} 
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unique Dest. Threshold</label>
                  <input 
                    type="number" 
                    value={anomalyThreshold} 
                    onChange={(e) => setAnomalyThreshold(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Targets Simulation */}
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="flex items-center gap-2 font-semibold text-indigo-400">
                 <Target size={18} /> Static Target List
               </h3>
               <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 uppercase">JSON Seed</span>
             </div>
             <div className="space-y-2 opacity-80">
               {INITIAL_TARGETS.map(t => (
                 <div key={t.tel} className="flex justify-between text-xs font-mono border-b border-white/10 pb-1">
                   <span>{t.tel}</span>
                   <span className="text-slate-400">{t.name}</span>
                 </div>
               ))}
               <p className="text-[10px] text-slate-500 pt-2 italic">* This list is automatically encoded into the CTE using Spark's from_json.</p>
             </div>
          </div>
        </div>

        {/* Right: SQL Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-4 flex flex-col h-[calc(100vh-120px)]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <FileCode size={18} className="text-indigo-600" />
                <span>Generated Spark SQL Rule</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Live Template</span>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 p-6 overflow-auto custom-scrollbar">
              <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
                {generatedSQL}
              </pre>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 text-xs text-slate-500 italic">
                <AlertCircle size={14} /> This query uses CTEs for optimized execution plans in Spark Catalyst.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App_v2;