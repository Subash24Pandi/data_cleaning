"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Image from 'next/image';
// @ts-ignore
import { transformData } from '../lib/transformer';
// @ts-ignore
import { saveClients } from '../lib/actions';
import { 
  Upload, 
  Database, 
  FileText, 
  Table as TableIcon, 
  RefreshCw, 
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
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
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: XLSX.utils.sheet_to_json(sheet).length > 0 ? 0 : 1 });
        const processedData = Array.isArray(rawData[0]) 
          ? rawData.map((arr: any) => Object.assign({}, arr))
          : rawData;

        setPreview(transformData(processedData));
        setIsSaved(false);
      } catch (err) { alert("error reading file."); }
    };
    reader.readAsBinaryString(file);
  };

  const getCols = () => preview.length > 0 ? Object.keys(preview[0]) : [];

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(preview);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    XLSX.writeFile(wb, "cleaned_data.xlsx");
  };

  const downloadCSV = () => {
    const ws = XLSX.utils.json_to_sheet(preview);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "cleaned_data.csv");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans lowercase selection:bg-blue-100">
      {/* Navigation Bar */}
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            {/* BIGGER LOGO SECTION */}
            <div className="relative w-16 h-16 transition-transform hover:scale-105 duration-300">
              <img 
                src="/logo.png" 
                alt="The AItel Logo" 
                className="object-contain w-full h-full"
                onError={(e) => {
                  console.error("Logo not found in public folder");
                  e.currentTarget.src = "https://via.placeholder.com/150?text=AItel"; // Fallback if logo missing
                }}
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase leading-none mb-1">
                The Data Cleaning Website
              </span>
              <span className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">
                powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 uppercase not-italic tracking-normal">The AItel</span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            {preview.length > 0 && (
              <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 backdrop-blur-sm">
                <button onClick={downloadExcel} className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-50 transition-all font-bold text-xs">
                   <TableIcon size={18}/> excel
                </button>
                <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 rounded-xl hover:bg-white hover:shadow-sm transition-all font-bold text-xs">
                   <FileText size={18}/> csv
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Professional Data <span className="text-blue-600">Refining.</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            Upload your automotive datasets. We handle headers, clean names, format numbers, and sync to your cloud.
          </p>
        </div>

        {/* Upload Container */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-[2.5rem] p-16 border-2 border-dashed border-slate-200 flex flex-col items-center text-center transition-all group-hover:border-blue-400">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Drop your client database here</h3>
              <p className="text-slate-400 text-sm font-medium tracking-wide italic">Accepts XLSX, XLS, and CSV files</p>
              <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv, .xls, .xlsx" />
            </div>
          </div>
        </div>

        {/* Sync Success Alert */}
        {isSaved && (
          <div className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-top-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-bold text-emerald-900">Synchronization Success</p>
                <p className="text-emerald-600 text-sm italic">All data has been normalized to lowercase and stored in Neon DB.</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview Card */}
        {preview.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <LayoutDashboard size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-none">Cleaned Results</h4>
                  <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-1 italic">Total entries: {preview.length}</p>
                </div>
              </div>
              <button 
                onClick={async () => { setLoading(true); await saveClients(preview); setLoading(false); setIsSaved(true); setPreview([]); }} 
                disabled={loading} 
                className="bg-blue-600 px-12 py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <Database size={18}/>} 
                {loading ? "Processing..." : "Sync to Neon"}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                    {getCols().map(col => (
                      <th key={col} className="p-10 border-b border-slate-100">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {preview.map((row, i) => (
                    <tr key={i} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                      {getCols().map(col => (
                        <td key={col} className={`p-10 transition-colors ${col === 'first name' ? 'font-bold text-slate-900' : 'font-medium'}`}>
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase italic italic">
          &copy; {new Date().getFullYear()} The AItel Data Refinery | All rights reserved
        </p>
      </footer>
    </div>
  );
}