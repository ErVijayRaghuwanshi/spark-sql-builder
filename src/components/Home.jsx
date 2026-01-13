
import { Link } from "react-router-dom";
import { 
  Database, 
  Zap, 
  ArrowRight, 
  Code2, 
  ShieldCheck
} from "lucide-react";

// --- HOME / HUB COMPONENT ---
const Home = () => {
  const versions = [
    {
      path: "/1",
      title: "V1: Core Query Builder",
      description: "Basic SELECT/FROM/WHERE implementation with schema-driven field selection.",
      icon: <Database className="text-blue-500" />,
      color: "hover:border-blue-500/50",
      tag: "Foundation"
    },
    {
      path: "/2",
      title: "V2: Anomaly Detection Template",
      description: "Advanced CTE-based pipeline focusing on training periods and behavior thresholds.",
      icon: <Zap className="text-amber-500" />,
      color: "hover:border-amber-500/50",
      tag: "Analytics"
    },
    {
      path: "/3",
      title: "V3: Production-Ready Builder",
      description: "Polished UI with dark-mode editor, strict metadata mapping, and HDFS optimization.",
      icon: <ShieldCheck className="text-indigo-500" />,
      color: "hover:border-indigo-500/50",
      tag: "Production"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-6 shadow-xl shadow-indigo-200">
            <Code2 size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Spark SQL Builder <span className="text-indigo-600 italic">Labs</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            A progression of query generation interfaces, from basic projections 
            to complex anomaly detection rule templates.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {versions.map((v, idx) => (
            <Link 
              key={idx} 
              to={v.path}
              className={`group relative bg-white border border-slate-200 p-8 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${v.color}`}
            >
              <div className="mb-6 flex justify-between items-start">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  {v.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                  {v.tag}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3 group-hover:text-indigo-600 transition-colors">{v.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{v.description}</p>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                Launch Version <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};


export default Home;