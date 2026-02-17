"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
// @ts-ignore
import { transformData } from '../lib/transformer';
// @ts-ignore
import { saveClients } from '../lib/actions';
import { Upload, Database, Download, FileText, Table as TableIcon, RefreshCw, ShieldCheck } from 'lucide-react';

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
        const rawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setPreview(transformData(rawData));
        setIsSaved(false);
      } catch (err) { alert("error reading file. support: xlsx, csv, xls."); }
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

  const downloadWord = async () => {
    const cols = getCols();
    const tableRows = [
      new TableRow({
        children: cols.map(c => new TableCell({ children: [new Paragraph({ text: c, bold: true })] }))
      }),
      ...preview.map(row => new TableRow({
        children: cols.map(c => new TableCell({ children: [new Paragraph(row[c] || "")] }))
      }))
    ];
    const doc = new Document({
      sections: [{ children: [new Paragraph({ text: "cleaned data report", heading: "Heading1" }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows })] }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "cleaned_report.docx");
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans lowercase">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h1 className="text-2xl font-black italic tracking-tighter text-slate-800">data<span className="text-blue-600 uppercase italic tracking-normal">pure</span></h1>
          <div className="flex gap-2">
            {preview.length > 0 && (
              <>
                <button onClick={downloadExcel} title="excel" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition shadow-sm"><TableIcon size={18}/></button>
                <button onClick={downloadWord} title="word" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition shadow-sm"><Download size={18}/></button>
              </>
            )}
          </div>
        </header>

        <div className="bg-slate-50/40 rounded-[2.5rem] p-12 border-2 border-dashed border-slate-200 text-center mb-10 relative group hover:border-blue-500 transition-all">
          <Upload className="mx-auto mb-4 text-slate-300 group-hover:text-blue-500 transition-all" size={40} />
          <h2 className="text-lg font-bold text-slate-700 tracking-tight">upload client file</h2>
          <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest font-black italic">auto-detects name, phone & car</p>
          <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv, .xls, .xlsx" />
        </div>

        {isSaved && (
          <div className="mb-10 p-6 bg-blue-600 text-white rounded-[2rem] flex items-center shadow-lg animate-in fade-in zoom-in">
            <ShieldCheck className="w-6 h-6 mr-4 opacity-80" />
            <span className="font-bold tracking-tight">sync complete! checked and saved in lowercase.</span>
          </div>
        )}

        {preview.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">preview: {preview.length} rows</span>
              <button onClick={async () => { setLoading(true); await saveClients(preview); setLoading(false); setIsSaved(true); setPreview([]); }} disabled={loading} className="bg-blue-600 px-10 py-3 rounded-2xl font-bold text-xs hover:bg-blue-700 transition flex items-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={14}/> : <Database size={14}/>} sync to neon
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    {getCols().map(col => <th key={col} className="p-8 border-b border-slate-100">{col}</th>)}
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                      {getCols().map(col => <td key={col} className={`p-8 ${col === 'first name' ? 'font-bold text-slate-900' : ''}`}>{row[col]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}