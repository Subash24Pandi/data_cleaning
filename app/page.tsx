"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// @ts-ignore
import { transformData } from '../lib/transformer';
// @ts-ignore
import { saveClients } from '../lib/actions';
import { Upload, FileText, Table as TableIcon, LayoutDashboard, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ firstName: '', phone: '', company: '', car: '' });
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        setRawData(data);
        setHeaders(Object.keys(data[0]));
        setPreview([]);
        setIsSaved(false);
      } catch (err) { alert("Error reading file."); }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = () => {
    if (!mapping.firstName && !mapping.phone) return alert("Please map at least Name or Phone.");
    setPreview(transformData(rawData, mapping));
  };

  const activeMappingCols = Object.values(mapping).filter(v => v !== "");

  const getFileName = (ext: string) => {
    const userInput = prompt("Enter file name to save:", "refined_data");
    return userInput ? `${userInput}.${ext}` : `refined_data.${ext}`;
  };

  const downloadExcel = () => {
    const fileName = getFileName("xlsx");
    const ws = XLSX.utils.json_to_sheet(preview);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, fileName);
  };

  const downloadCSV = () => {
    const fileName = getFileName("csv");
    const ws = XLSX.utils.json_to_sheet(preview);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12">
      {/* --- PROFESSIONAL HEADER --- */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col items-center text-center shadow-sm">
        <div className="mb-4">
          <img src="/logo.png" alt="Aitel Logo" className="w-32 h-32 object-contain" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2"></h1>
        <p className="text-slate-500 max-w-md leading-relaxed font-medium">
          Professional AI-driven data refinery for smarter telecalling. <br />
          Transform, clean, and sync your leads instantly.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {/* --- UPLOAD SECTION --- */}
        <div className="max-w-xl mx-auto mb-10 group">
          <div className="relative border-2 border-dashed border-slate-300 p-12 rounded-[2.5rem] bg-white text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-600" size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Upload Your Lead File</h3>
            <p className="text-slate-400 text-sm mt-1">Excel or CSV files are supported</p>
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* --- MAPPING BOX (STYLISH & PROFESSIONAL) --- */}
        {headers.length > 0 && (
          <div className="max-w-3xl mx-auto mb-12 bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <LayoutDashboard className="text-blue-600" size={24}/>
              <h3 className="text-xl font-bold text-slate-800">Field Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {['firstName', 'phone', 'company', 'car'].map((f) => (
                <div key={f} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                    {f.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                    value={(mapping as any)[f]} 
                    onChange={(e) => setMapping({...mapping, [f]: e.target.value})}
                  >
                    <option value="">-- Skip Field --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <button 
              onClick={handleProcess} 
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Process & Preview <ChevronRight size={20}/>
            </button>
          </div>
        )}

        {/* --- PREVIEW SECTION --- */}
        {preview.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Data Preview</div>
                <div className="text-xl font-bold">Showing {activeMappingCols.length} Refined Columns</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={downloadExcel} className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors">
                    <TableIcon size={16}/> Excel
                </button>
                <button onClick={downloadCSV} className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors">
                    <FileText size={16}/> CSV
                </button>
                <button 
                  onClick={async () => { setLoading(true); await saveClients(preview); setLoading(false); setIsSaved(true); setPreview([]); }} 
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 transition-all"
                >
                    {loading ? "Syncing..." : "Sync to Neon"}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase font-bold tracking-widest text-slate-500 border-b border-slate-100">
                    {activeMappingCols.map(col => <th key={col} className="p-6">{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/40 transition-colors">
                      {activeMappingCols.map(col => (
                        <td key={col} className="p-6 font-semibold text-slate-700">
                          {col === mapping.phone ? (
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{row[col]}</span>
                          ) : row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50/50 uppercase tracking-tighter">
                Previewing top 10 rows • Download for the complete dataset
              </div>
            </div>
          </div>
        )}

        {isSaved && (
          <div className="fixed bottom-10 right-10 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={24} />
            <span className="font-bold">Data synced successfully!</span>
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-20 py-12 border-t border-slate-200 text-center">
        <p className="text-slate-500 text-sm font-medium">
          &copy; 2026 Aitel - AI Telecalling. All rights reserved.
        </p>
      </footer>
    </div>
  );
}