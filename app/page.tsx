"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// @ts-ignore
import { transformData } from '../lib/transformer';
// @ts-ignore
import { saveClients } from '../lib/actions';
import { Upload, FileText, Table as TableIcon, LayoutDashboard, ChevronRight, CheckCircle2, FileSpreadsheet, Search, ChevronDown } from 'lucide-react';
import { ALL_COUNTRIES } from '../lib/countries';

export default function Home() {
  const [sheets, setSheets] = useState<{ id: string; name: string; data: any[]; headers: string[] }[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [mapping, setMapping] = useState({ firstName: '', email: '', phone: '', countryCode: '', company: '', car: '' });
  const [defaultCountry, setDefaultCountry] = useState('+91');
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const activeSheet = sheets.find(s => s.id === activeSheetId);
  const rawData = activeSheet?.data || [];
  const headers = activeSheet?.headers || [];

  const autoMap = (detectedHeaders: string[]) => {
    const autoMapping = { firstName: '', email: '', phone: '', countryCode: '', company: '', car: '' };
    detectedHeaders.forEach(h => {
      const lower = h.toLowerCase();
      if ((lower.includes('name') || lower.includes('first')) && !lower.includes('company')) autoMapping.firstName = h;
      else if (lower.includes('mail')) autoMapping.email = h;
      else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('call')) autoMapping.phone = h;
      else if (lower.includes('country') || lower.includes('code')) autoMapping.countryCode = h;
      else if (lower.includes('company') || lower.includes('org') || lower.includes('business')) autoMapping.company = h;
      else if (lower.includes('car') || lower.includes('vehicle')) autoMapping.car = h;
    });
    setMapping(autoMapping);
    setPreview([]);
    setIsSaved(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newSheets: { id: string; name: string; data: any[]; headers: string[] }[] = [];
    
    for (const file of files) {
      try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const isMultiSheet = wb.SheetNames.length > 1;
        wb.SheetNames.forEach(sheetName => {
          const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
          
          // Skip completely empty sheets
          if (sheetData.length === 0) return;
          
          // Heuristic: If it's a multi-sheet file, Excel often leaves a default "Sheet1".
          // If "Sheet1" has less than 5 rows, it's almost certainly a blank/ghost sheet, so we ignore it.
          const normalizedName = sheetName.toLowerCase().replace(/\s/g, '');
          if (isMultiSheet && (normalizedName === 'sheet1' || normalizedName === 'sheet2' || normalizedName === 'sheet3') && sheetData.length < 5) {
            return;
          }

          newSheets.push({
            id: `${file.name}-${sheetName}-${Date.now()}-${Math.random()}`,
            name: files.length === 1 ? sheetName : `${file.name} (${sheetName})`,
            data: sheetData,
            headers: Object.keys(sheetData[0])
          });
        });
      } catch (err) {
        alert(`Error reading file ${file.name}.`);
      }
    }
    
    setSheets(prev => [...prev, ...newSheets]);
    
    if (newSheets.length > 0) {
      // If nothing was active before, activate the first new sheet
      setActiveSheetId(prev => {
        if (!prev) {
          autoMap(newSheets[0].headers);
          return newSheets[0].id;
        }
        return prev;
      });
    }
    
    // Reset file input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveSheet = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent activating the sheet
    setSheets(prev => {
      const filtered = prev.filter(s => s.id !== idToRemove);
      // If we are removing the active sheet, pick another one
      if (activeSheetId === idToRemove) {
        if (filtered.length > 0) {
          setActiveSheetId(filtered[0].id);
          autoMap(filtered[0].headers);
        } else {
          setActiveSheetId(null);
          setPreview([]);
        }
      }
      return filtered;
    });
  };

  const handleSheetSelect = (id: string) => {
    setActiveSheetId(id);
    const sheet = sheets.find(s => s.id === id);
    if (sheet) {
      autoMap(sheet.headers);
    }
  };

  const handleProcess = () => {
    if (!mapping.firstName && !mapping.phone) return alert("Please map at least Name or Phone.");
    setPreview(transformData(rawData, mapping, defaultCountry));
  };

  const activeMappingCols = Object.values(mapping).filter(v => v !== "");

  const getFileName = (ext: string) => {
    const userInput = prompt("Enter file name to save:", "refined_data");
    return userInput ? `${userInput}.${ext}` : `refined_data.${ext}`;
  };

  const getCleanData = () => {
    return preview.map(row => {
      const cleanRow: any = {};
      if (mapping.firstName) cleanRow['contact_name'] = row[mapping.firstName];
      if (mapping.email) cleanRow['Email'] = row[mapping.email];
      if (mapping.phone) cleanRow['contact_number'] = row[mapping.phone];
      if (mapping.company) cleanRow['Company'] = row[mapping.company];
      if (mapping.car) cleanRow['Car'] = row[mapping.car];
      return cleanRow;
    });
  };

  const downloadExcel = () => {
    const fileName = getFileName("xlsx");
    const cleanData = getCleanData();
    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clean Data");
    XLSX.writeFile(wb, fileName);
  };

  const downloadCSV = () => {
    const fileName = getFileName("csv");
    const cleanData = getCleanData();
    const ws = XLSX.utils.json_to_sheet(cleanData);
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
            <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* --- SHEET SELECTION TABS --- */}
        {sheets.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {sheets.map(sheet => (
              <div
                key={sheet.id}
                onClick={() => handleSheetSelect(sheet.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer group ${activeSheetId === sheet.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                <FileSpreadsheet size={16} />
                {sheet.name}
                <button 
                  onClick={(e) => handleRemoveSheet(sheet.id, e)}
                  className={`ml-1 rounded-full p-1 transition-colors ${activeSheetId === sheet.id ? 'hover:bg-blue-500 text-blue-200 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100'}`}
                  title="Remove Sheet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- MAPPING BOX (STYLISH & PROFESSIONAL) --- */}
        {headers.length > 0 && (
          <div className="max-w-3xl mx-auto mb-12 bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <LayoutDashboard className="text-blue-600" size={24}/>
              <h3 className="text-xl font-bold text-slate-800">Field Configuration</h3>
            </div>
            
            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 block mb-2">
                Default Country Code (Fallback)
              </label>
              <div className="relative w-full md:w-1/2">
                <div 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 cursor-pointer flex justify-between items-center hover:border-blue-300 transition-all"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                >
                  <span>{ALL_COUNTRIES.find(c => c.code === defaultCountry)?.name || 'Select Country'} ({defaultCountry})</span>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                        <Search size={16} className="text-slate-400 mr-2" />
                        <input 
                          type="text" 
                          placeholder="Search country..." 
                          className="w-full text-sm outline-none bg-transparent font-medium text-slate-700"
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).map((country, idx) => (
                        <div 
                          key={idx}
                          className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-medium text-slate-700 transition-colors flex justify-between items-center"
                          onClick={() => {
                             setDefaultCountry(country.code);
                             setIsCountryDropdownOpen(false);
                             setCountrySearch('');
                          }}
                        >
                          <span>{country.name}</span>
                          <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded-md">{country.code}</span>
                        </div>
                      ))}
                      {ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).length === 0 && (
                        <div className="p-6 text-center text-sm text-slate-500 font-medium">No countries found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-1">Used when the phone number has no country code.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {['firstName', 'email', 'phone', 'countryCode', 'company', 'car'].map((f) => (
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
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="text-[11px] uppercase font-bold tracking-widest text-slate-500 border-b border-slate-100">
                    {activeMappingCols.map(col => <th key={col} className="p-6">{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
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
                Previewing all {preview.length} rows • Download for the complete dataset
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