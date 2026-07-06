import React from 'react';
import { User, ShieldCheck, Award, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface IdentityProps {
  name: string;
  type: 'Worker' | 'Company' | string;
  idType: string;
  idNumber?: string;
  details?: string;
  code?: string;
}

export default function IdentityCardVisual({ name, type, idType, idNumber, details, code }: IdentityProps) {
  // Extract custom numbers out of details if not provided
  const derivedIdNo = idNumber || details?.match(/(?:NID|Passport|Reg Code|Company Reg Code):\s*([A-Za-z0-9-_ \+]+)/)?.[1] || '1199480138402124';
  
  const isCompany = type.toLowerCase() === 'company';
  const isPassport = idType.toLowerCase().includes('passport');

  if (isCompany) {
    // RDB Certificate of Incorporation
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-amber-50 rounded-[2rem] border-4 border-amber-800/20 p-6 shadow-xl relative overflow-hidden text-stone-900 font-serif selection:bg-amber-100"
      >
        {/* Subtle Guilloche/Grid Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#b45309_0.4px,transparent_0.4px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
        
        {/* Borders */}
        <div className="absolute inset-2 border border-amber-800/10 pointer-events-none" />

        {/* Header containing RDB simulated crest */}
        <div className="flex flex-col items-center text-center border-b border-amber-800/15 pb-4 mb-4">
          <div className="h-10 w-10 rounded-full border border-amber-800/30 flex items-center justify-center bg-white text-amber-800 mb-2 shadow-sm font-sans font-black text-xs">
            RDB
          </div>
          <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-amber-900">Republic of Rwanda</h4>
          <h3 className="text-xs font-sans font-extrabold uppercase tracking-wider text-amber-800 mt-1">Rwanda Development Board</h3>
          <p className="text-[14px] font-bold italic mt-2 text-stone-805">Certificate of Incorporation</p>
        </div>

        {/* Body content */}
        <div className="space-y-3.5 text-center px-2">
          <p className="text-[10px] font-sans text-stone-500 uppercase tracking-widest">This is to certify that</p>
          
          <p className="text-[15px] font-extrabold text-stone-950 font-serif underline decoration-dotted decoration-amber-600 underline-offset-4 leading-tight">
            {name}
          </p>

          <p className="text-[10px] font-sans text-stone-500 leading-relaxed max-w-xs mx-auto">
            Is officially registered under the Law on State/Worker Administration of Rwanda and maintains credentialed status.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-850/10 text-left font-sans">
            <div>
              <span className="text-[8px] font-black uppercase text-stone-500 block mb-0.5 tracking-wider">Registration Number</span>
              <span className="text-[10px] font-mono font-bold text-stone-900">{derivedIdNo}</span>
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-stone-500 block mb-0.5 tracking-wider">Registration Date</span>
              <span className="text-[10px] font-mono font-bold text-stone-900">23 June 2026</span>
            </div>
          </div>
        </div>

        {/* Golden verification seal stamp */}
        <div className="absolute bottom-5 right-5 h-12 w-12 rounded-full border-4 border-amber-600/35 bg-amber-100 flex items-center justify-center transform rotate-12 opacity-80 pointer-events-none">
          <ShieldCheck size={20} className="text-amber-800" />
        </div>
      </motion.div>
    );
  }

  if (isPassport) {
    // Passport Page layout
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-slate-900 rounded-[2rem] border border-blue-900/40 p-5 shadow-xl relative overflow-hidden text-gray-200 font-sans select-none"
      >
        {/* Subtle grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none" />

        <div className="flex items-center justify-between border-b border-blue-950/60 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded text-blue-400 border border-blue-900/30">RWA</span>
            <span className="text-[10px] font-black tracking-tight text-white uppercase font-sans">Rwanda Passport</span>
          </div>
          <span className="text-[8px] font-mono text-gray-500">Document Code: {code || 'P-98'}</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Portrait Photo container */}
          <div className="col-span-1">
            <div className="aspect-[4/5] bg-slate-950 rounded-xl border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group">
              <User size={36} className="text-blue-500/25 stroke-[1.5]" />
              <div className="absolute bottom-1 right-1 h-3 w-3 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              </div>
            </div>
            <p className="text-[7px] text-center font-mono text-gray-500 uppercase tracking-widest mt-1.5">Facial Verify: Ok</p>
          </div>

          {/* Demographics details */}
          <div className="col-span-2 space-y-2.5 text-[10px]">
            <div>
              <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider font-sans mb-0.5">Passport Number</span>
              <span className="font-mono font-black text-white">{derivedIdNo}</span>
            </div>
            <div>
              <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Full Name</span>
              <span className="font-black text-gray-200 uppercase font-sans tracking-tight">{name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Nationality</span>
                <span className="font-bold text-gray-300 font-sans">RWANDAN</span>
              </div>
              <div>
                <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Sex</span>
                <span className="font-bold text-gray-300 font-sans">{name.includes('Aline') ? 'FEMALE' : 'MALE'}</span>
              </div>
            </div>
            <div>
              <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Date of Birth</span>
              <span className="font-bold text-gray-300 font-mono">14 DEC 1995</span>
            </div>
          </div>
        </div>

        {/* Machine-readable zone at bottom */}
        <div className="mt-5 pt-3.5 border-t border-gray-950/80 font-mono text-[8px] text-gray-500 leading-none select-none tracking-[0.22em] text-center break-all whitespace-pre">
          P&lt;RWA{name.toUpperCase().replace(/\s+/g, '&lt;')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
          {derivedIdNo.substring(0, 9).toUpperCase()}&lt;1RWA9512140M2532152&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6
        </div>
      </motion.div>
    );
  }

  // National ID Card
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-gradient-to-br from-slate-905 to-slate-950 rounded-[2rem] border border-gray-850 p-5 shadow-xl relative overflow-hidden text-gray-200 font-sans select-none"
    >
      {/* Subliminal Guilloche grid lines */}
      <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

      {/* Colored corner flag stripes of Rwanda */}
      <div className="absolute top-0 right-0 h-1 flex w-full">
        <div className="bg-blue-500 flex-1" />
        <div className="bg-yellow-500 flex-1" />
        <div className="bg-green-600 flex-1" />
      </div>

      <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-blue-900 flex items-center justify-center p-1 text-[8px] font-black text-yellow-405 border border-yellow-800">RWA</div>
          <div>
            <span className="text-[8px] font-sans font-black uppercase tracking-wider text-gray-400 block mb-0.5 leading-none">Republic of Rwanda</span>
            <span className="text-[10px] font-sans font-black uppercase text-white tracking-tight leading-none block">National Identity Card</span>
          </div>
        </div>
        <span className="text-[7px] font-mono text-gray-500 font-black uppercase tracking-widest bg-gray-950 px-1.5 py-0.5 rounded border border-gray-900">NIDA Official</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Profile Picture */}
        <div className="col-span-1">
          <div className="aspect-[4/5] bg-gray-950 rounded-xl border border-gray-850 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group">
            <User size={34} className="text-gray-502 stroke-[1.5]" />
            <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/40 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
            </div>
          </div>
          <p className="text-[7.5px] text-center font-black text-gray-500 uppercase tracking-widest mt-1.5 font-mono">ID MATCHED</p>
        </div>

        {/* Details values */}
        <div className="col-span-2 space-y-2.5 text-[10px] font-sans">
          <div>
            <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">National ID Number (NID)</span>
            <span className="font-mono font-black text-white">{derivedIdNo}</span>
          </div>
          <div>
            <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Full Names</span>
            <span className="font-black text-gray-200 uppercase font-sans tracking-tight">{name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Gender</span>
              <span className="font-bold text-gray-300 font-sans">{name.includes('Aline') || name.includes('Mukeshimana') ? 'FEMALE' : 'MALE'}</span>
            </div>
            <div>
              <span className="text-[7px] font-black uppercase text-gray-500 block leading-none tracking-wider mb-0.5">Place of Issue</span>
              <span className="font-bold text-gray-300 font-sans">KIGALI</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
