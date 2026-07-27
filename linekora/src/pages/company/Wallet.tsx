import React, { useState, useEffect } from 'react';
import { 
  Wallet, Clock, CheckCircle2, 
  ArrowUpRight, ArrowDownLeft, Shield, Plus,
  CreditCard, Smartphone, X, Loader2, AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

interface CompanyTransaction {
  id: number;
  type: 'deposit' | 'escrow' | 'payment';
  amount: string;
  recipient: string;
  status: 'completed' | 'pending';
  date: string;
  role: string;
  refCode: string;
}

export default function CompanyWallet() {
  const [filter, setFilter] = useState<'all' | 'escrow' | 'completed'>('all');
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'momo' | 'card'>('momo');
  const [depositPhone, setDepositPhone] = useState('+250 788 300 120');
  const [depositIsLoading, setDepositIsLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositErrorMsg, setDepositErrorMsg] = useState('');

  // Stateful financial values
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('company_available_balance');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [escrowBalance, setEscrowBalance] = useState<number>(() => {
    const saved = localStorage.getItem('company_escrow_balance');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalSpent, setTotalSpent] = useState<number>(() => {
    const saved = localStorage.getItem('company_total_spent');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Stateful transactions
  const [transactions, setTransactions] = useState<CompanyTransaction[]>(() => {
    const saved = localStorage.getItem('company_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('company_available_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('company_escrow_balance', escrowBalance.toString());
  }, [escrowBalance]);

  useEffect(() => {
    localStorage.setItem('company_total_spent', totalSpent.toString());
  }, [totalSpent]);

  useEffect(() => {
    localStorage.setItem('company_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const stats = [
    { label: 'Company Balance', value: `RWF ${balance.toLocaleString()}`, icon: Wallet, color: 'text-blue-600' },
    { label: 'Funds in Escrow', value: `RWF ${escrowBalance.toLocaleString()}`, icon: Clock, color: 'text-yellow-600' },
    { label: 'Total Spent', value: `RWF ${totalSpent.toLocaleString()}`, icon: CheckCircle2, color: 'text-green-600' },
  ];

  const handleDepositConfirm = () => {
    const amt = parseInt(depositAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setDepositErrorMsg('Please set a valid positive deposit amount.');
      return;
    }
    setDepositErrorMsg('');
    setDepositIsLoading(true);

    // Simulate Payment Provider Push PIN Confirmation API
    setTimeout(() => {
      setDepositIsLoading(false);
      setDepositSuccess(true);
      setBalance(prev => prev + amt);

      const paymentMethodName = depositMethod === 'momo' ? 'MTN MoMo Deposit' : 'Credit Card Gateway';
      const randRef = `DEP-CORP-${Math.floor(10000 + Math.random() * 90000)}`;

      const newTx: CompanyTransaction = {
        id: Date.now(),
        type: 'deposit',
        amount: `RWF ${amt.toLocaleString()}`,
        recipient: paymentMethodName,
        status: 'completed',
        date: 'Today',
        role: 'Inbound',
        refCode: randRef
      };

      setTransactions(prev => [newTx, ...prev]);
    }, 1500);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'escrow') return tx.status === 'pending' || tx.type === 'escrow';
    if (filter === 'completed') return tx.status === 'completed';
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Corporate Wallet</h1>
              <p className="text-gray-500 font-sans font-bold mt-1 text-sm italic opacity-85 leading-tight tracking-tight">MANAGE YOUR HIRING BUDGET AND SECURE ESCROW PAYMENTS.</p>
            </div>
            <button 
              onClick={() => {
                setDepositSuccess(false);
                setDepositAmount('');
                setDepositErrorMsg('');
                setShowDeposit(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer text-sm uppercase tracking-wider"
            >
              <Plus size={20} />
              Deposit Funds
            </button>
          </div>
          <div className="mt-6 bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
             <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
             <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic">
               Live Integrations Connected: <span className="text-green-600 font-extrabold uppercase bg-green-50 px-2 py-0.5 rounded border border-green-150">Active Payment Sandbox</span> • MTN MoMo and Cards are operational.
             </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className={`h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900 font-sans tracking-tight">{stat.value}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={80} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
               <div>
                  <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">Recent Transactions</h3>
                  <p className="text-xs text-gray-400 font-sans italic mt-0.5 font-medium">Verify historical pay periods and locked talent milestones</p>
               </div>
               
               <div className="flex bg-gray-55 p-1 rounded-xl border border-gray-150 shadow-inner bg-gray-100/70">
                 {(['all', 'escrow', 'completed'] as const).map(f => (
                   <button
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest font-sans transition-all cursor-pointer ${
                       filter === f 
                         ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                         : 'text-gray-400 hover:text-gray-650'
                     }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-4">
               {filteredTransactions.map((tx) => (
                 <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-gray-105 shadow-sm flex items-center justify-between hover:border-blue-100 transition-all">
                   <div className="flex items-center gap-4">
                     <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                       tx.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                     }`}>
                       {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                     </div>
                     <div>
                       <h4 className="font-sans font-black text-gray-900 text-sm">{tx.recipient}</h4>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         {tx.role} • {tx.date} {tx.refCode && `• ${tx.refCode}`}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className={`font-sans font-black text-sm ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                       {tx.type === 'deposit' ? '+' : '-'}{tx.amount}
                     </p>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${
                       tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                     }`}>
                       {tx.status}
                     </span>
                   </div>
                 </div>
               ))}

               {filteredTransactions.length === 0 && (
                 <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 py-12 text-center text-gray-400 font-sans italic text-sm">
                   No transactions recorded in this filter.
                 </div>
               )}
             </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
              <Shield className="mb-4 opacity-50" size={32} />
              <h4 className="text-lg font-black font-sans mb-2">Escrow Protection</h4>
              <p className="text-sm font-medium text-blue-55 leading-relaxed mb-6 font-sans">
                Funds are held securely by Linekora and only released over instant mobile wallets when you mark milestones as met on active jobs.
              </p>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-sans font-black text-xs uppercase tracking-widest transition-all">
                Learn About Security
              </button>
            </div>

            <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white">
              <h4 className="text-lg font-black font-sans mb-6">Linked Payment Accounts</h4>
              <div className="space-y-3">
                <div className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-blue-400" />
                    <span className="text-sm font-bold font-sans">Corporate Card **** 7810</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase text-gray-400">Primary</span>
                </div>
                <div className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-yellow-400" />
                    <span className="text-sm font-bold font-sans">MTN MoMo (Active)</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase text-green-400">Billing On</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {showDeposit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => {
                if (!depositIsLoading) setShowDeposit(false);
              }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                disabled={depositIsLoading}
                onClick={() => setShowDeposit(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {!depositSuccess ? (
                <div>
                  <h2 className="text-2xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight">Deposit Funds</h2>
                  <p className="text-xs text-gray-400 font-sans italic mb-6 font-medium">Top up your corporate available hiring balance instantly</p>
                  
                  {depositErrorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-655 border border-red-100 text-xs font-bold rounded-2xl flex items-start gap-2 animate-pulse">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{depositErrorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Top Up Amount (RWF)</label>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active Balance: RWF {balance.toLocaleString()}</span>
                      </div>
                      <input 
                        type="number" 
                        disabled={depositIsLoading}
                        value={depositAmount}
                        onChange={(e) => {
                          setDepositAmount(e.target.value);
                          setDepositErrorMsg('');
                        }}
                        placeholder="e.g. 500000" 
                        className="w-full p-4 rounded-2xl border-2 border-gray-100 font-sans font-black text-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-gray-900 animate-fade-in" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Choose Billing Profile</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          disabled={depositIsLoading}
                          onClick={() => setDepositMethod('momo')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            depositMethod === 'momo' ? 'border-amber-500 bg-amber-50/50 text-amber-900' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <Smartphone size={22} className={depositMethod === 'momo' ? 'text-amber-550' : ''} />
                          <span className="font-sans text-[10px] font-black uppercase tracking-tight">MTN Mobile Money</span>
                        </button>
                        <button 
                          type="button"
                          disabled={depositIsLoading}
                          onClick={() => setDepositMethod('card')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                            depositMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <CreditCard size={22} className={depositMethod === 'card' ? 'text-blue-600' : ''} />
                          <span className="font-sans text-[10px] font-black uppercase tracking-tight">Corporate Card</span>
                        </button>
                      </div>
                    </div>

                    {depositMethod === 'momo' && (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">MoMo Phone Number PIN Target</label>
                        <input 
                          type="text" 
                          disabled={depositIsLoading}
                          value={depositPhone}
                          onChange={(e) => setDepositPhone(e.target.value)}
                          placeholder="+250 788 000 000"
                          className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900"
                        />
                      </div>
                    )}

                    <button 
                      type="button"
                      disabled={depositIsLoading}
                      onClick={handleDepositConfirm}
                      className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-150 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {depositIsLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Waiting for MoMo Merchant Handshake PIN...</span>
                        </>
                      ) : (
                        <span>Initiate Secure Deposit</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">Deposit Secured</h3>
                  <p className="text-sm font-sans text-gray-500 leading-relaxed max-w-xs mx-auto mb-6">
                    RWF {parseInt(depositAmount, 10).toLocaleString()} was instantly added to your available Corporate Balance.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left space-y-2 mb-8 uppercase font-sans text-[10px] font-black tracking-widest text-gray-500">
                    <div className="flex justify-between">
                      <span>Ref Code:</span>
                      <span className="text-gray-900">DEP-CORP-{Math.floor(10000 + Math.random() * 90000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Channel:</span>
                      <span className="text-gray-900">{depositMethod === 'momo' ? 'MTN Airpay Merchant' : 'Commercial Gateway'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowDeposit(false)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
