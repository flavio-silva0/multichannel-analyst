import { useState, useEffect, useRef } from 'react';
import './index.css';

interface CommentAnalysis {
  index: number;
  texto_original: string;
  url_post?: string;
  texto_post?: string;
  sentimento: "Positivo" | "Negativo" | "Neutro";
  categoria: "Financeiro" | "Produto" | "Suporte" | "Outros";
  urgencia: number;
  resumo: string;
}

function App() {
  const [targetUrl, setTargetUrl] = useState("https://www.instagram.com/ifoodbrasil/");
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [results, setResults] = useState<CommentAnalysis[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startScan = () => {
    setIsScanning(true);
    setLogs([]);
    setResults([]);
    setProgress({ current: 0, total: 0, status: 'Iniciando Serviço' });

    const eventSource = new EventSource(`http://localhost:3001/api/analyze?url=${encodeURIComponent(targetUrl)}`);

    eventSource.addEventListener('log', (e) => {
      const data = JSON.parse(e.data);
      addLog(data.message);
    });

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setProgress({
        current: data.current,
        total: data.total,
        status: `Analisando ${data.current}/${data.total}: ${data.text.substring(0, 30)}...`
      });
    });

    eventSource.addEventListener('result', (e) => {
      const data = JSON.parse(e.data);
      setResults(prev => [data, ...prev]);
    });

    eventSource.addEventListener('done', (e) => {
      const data = JSON.parse(e.data);
      addLog(`Escaneamento concluído! ${data.count} itens analisados.`);
      setProgress(p => ({ ...p, status: 'Concluído' }));
      setIsScanning(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      addLog(`Erro na conexão SSE ou no servidor: ${e.type}`);
      setIsScanning(false);
      eventSource.close();
    });
  };

  const getSentimentColor = (sentimento: string) => {
    switch (sentimento) {
      case 'Positivo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'Negativo': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    }
  };

  const getUrgencyStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex gap-6">

      {/* Sidebar de Controle */}
      <aside className="w-80 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col p-6 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Multichannel Analyst
        </h1>
        <p className="text-slate-400 text-sm mb-8">AI-Powered Sentiment Engine</p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Profile</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isScanning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-all"
            />
          </div>

          <button
            onClick={startScan}
            disabled={isScanning}
            className="w-full relative group overflow-hidden rounded-lg bg-cyan-600 px-4 py-3 transition-all hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed font-medium shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] disabled:shadow-none"
          >
            {isScanning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Scanning...
              </span>
            ) : "Start Analysis"}
          </button>
        </div>

        <div className="mt-auto">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Logs</label>
          <div className="bg-black/50 border border-white/5 rounded-lg p-3 h-64 overflow-y-auto text-xs font-mono text-slate-300 space-y-2 custom-scrollbar">
            {logs.length === 0 ? <span className="text-slate-600 italic">Waiting to start...</span> :
              logs.map((log, i) => <div key={i}>{log}</div>)
            }
            <div ref={logsEndRef} />
          </div>
        </div>
      </aside>

      {/* Área Principal - Feed */}
      <main className="flex-1 max-w-5xl mx-auto flex flex-col pt-2">

        {/* Progress Bar */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Live Feed Status</h2>
                <p className="text-sm text-cyan-400 h-5 mt-1 animate-pulse">{progress.status}</p>
              </div>
              <span className="text-2xl font-bold font-mono text-slate-300">
                {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Live Cards */}
        <div className="flex-1 space-y-4">
          {results.length === 0 && !isScanning && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-20 border-2 border-dashed border-slate-800 rounded-2xl">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-lg">Ready to intercept and analyze messages.</p>
            </div>
          )}

          {results.map((result) => (
            <div key={result.index} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-5 fade-in duration-500 hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg">
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSentimentColor(result.sentimento)}`}>
                        {result.sentimento}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {result.categoria}
                      </span>

                      {result.url_post && (
                        <a
                          href={result.url_post}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-0.5 bg-indigo-950/40 text-indigo-300 hover:text-indigo-200 text-xs font-medium rounded-full border border-indigo-500/30 transition-colors"
                          title="Ver Post Original no Instagram"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Post Original
                        </a>
                      )}
                    </div>
                    <div className="text-yellow-500/80 text-sm tracking-widest" title={`Urgência: ${result.urgencia}/5`}>
                      {getUrgencyStars(result.urgencia)}
                    </div>
                  </div>

                  {result.texto_post && (
                    <div className="mb-3 pl-3 border-l-2 border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Post Context</p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                        {result.texto_post}
                      </p>
                    </div>
                  )}

                  <p className="text-slate-200 text-sm leading-relaxed mb-3 pr-4">
                    "{result.texto_original}"
                  </p>

                  <div className="bg-slate-950/50 rounded p-3 border border-indigo-500/20 border-l-2 border-l-indigo-500">
                    <p className="text-xs text-indigo-300 uppercase font-semibold mb-1">AI Summary</p>
                    <p className="text-slate-400 text-sm">{result.resumo}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
