import { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, 
  CreditCard, Smartphone, CheckCircle2, AlertCircle, Plus, X, Shield, Landmark, ArrowRight, Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';

interface Transaction {
  id: number;
  type: 'withdraw' | 'payment' | 'escrow';
  amount: string;
  method: string;
  status: 'completed' | 'pending';
  date: string;
  description: string;
  refCode: string;
}

export default function WorkerWallet() {
  const { profile } = useAuth();
  const walletUid = profile?.firebaseUid || profile?.id || 'guest';
  const wk = (key: string) => `${key}_${walletUid}`;
  
  const [activeTab, setActiveTab] = useState<'all' | 'escrow' | 'completed'>('all');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Stateful financial values
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem(wk('worker_available_balance'));
    return saved ? parseInt(saved, 10) : 0;
  });

  const [pendingBalance, setPendingBalance] = useState<number>(() => {
    const saved = localStorage.getItem(wk('worker_pending_balance'));
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(() => {
    const saved = localStorage.getItem(wk('worker_total_withdrawn'));
    return saved ? parseInt(saved, 10) : 0;
  });

  // Stateful transactions loaded from localStorage
  const [txList, setTxList] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(wk('worker_transactions'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  // Keep localStorage sync'd
  useEffect(() => {
    localStorage.setItem(wk('worker_available_balance'), balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem(wk('worker_pending_balance'), pendingBalance.toString());
  }, [pendingBalance]);

  useEffect(() => {
    localStorage.setItem(wk('worker_total_withdrawn'), totalWithdrawn.toString());
  }, [totalWithdrawn]);

  useEffect(() => {
    localStorage.setItem(wk('worker_transactions'), JSON.stringify(txList));
  }, [txList]);

  // Deposit input state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'momo' | 'card'>('momo');
  const [depositIsLoading, setDepositIsLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositErrorMsg, setDepositErrorMsg] = useState('');

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawType, setWithdrawType] = useState<'mtn' | 'airtel' | 'bank'>('mtn');
  const [withdrawPhone, setWithdrawPhone] = useState('+250 788 300 120');
  const [withdrawBankAcc, setWithdrawBankAcc] = useState('00010-2342412-22');
  const [withdrawIsLoading, setWithdrawIsLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');

  const stats = [
    { label: 'Available Balance', value: `RWF ${balance.toLocaleString()}`, icon: Wallet },
    { label: 'Pending (Escrow)', value: `RWF ${pendingBalance.toLocaleString()}`, icon: Clock },
    { label: 'Total Withdrawn', value: `RWF ${totalWithdrawn.toLocaleString()}`, icon: CheckCircle2 },
  ];

  const handleDepositConfirm = () => {
    const amt = parseInt(depositAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setDepositErrorMsg('Please enter a valid positive deposit amount.');
      return;
    }
    setDepositErrorMsg('');
    setDepositIsLoading(true);

    setTimeout(() => {
      setDepositIsLoading(false);
      setDepositSuccess(true);
      setBalance(prev => prev + amt);

      const newTx: Transaction = {
        id: Date.now(),
        type: 'payment',
        amount: `RWF ${amt.toLocaleString()}`,
        method: depositMethod === 'momo' ? 'MTN MoMo Deposit' : 'Credit Card Settlement',
        status: 'completed',
        date: 'Today',
        description: 'Funds loaded onto available digital balance to facilitate platform features & matches.',
        refCode: `DEP-TXN-${Math.floor(Math.random() * 90000) + 10000}`
      };
      setTxList(prev => [newTx, ...prev]);
    }, 1200);
  };

  const handleWithdrawConfirm = () => {
    const amt = parseInt(withdrawAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawErrorMsg('Please specify a positive integer amount to withdraw.');
      return;
    }
    if (amt > balance) {
      setWithdrawErrorMsg(`Insufficient funds. Your maximum cash withdrawal threshold is RWF ${balance.toLocaleString()}.`);
      return;
    }
    setWithdrawErrorMsg('');
    setWithdrawIsLoading(true);

    setTimeout(() => {
      setWithdrawIsLoading(false);
      setWithdrawSuccess(true);
      setBalance(prev => prev - amt);
      setTotalWithdrawn(prev => prev + amt);

      const resolvedMethod = 
        withdrawType === 'mtn' ? 'MTN Mobile Money' : 
        withdrawType === 'airtel' ? 'Airtel Money' : 'Bank Transfer (I&M Bank)';

      const resolvedRef = 
        withdrawType === 'mtn' ? `TXN-MTN-${Math.floor(Math.random() * 900000) + 100000}X` : 
        withdrawType === 'airtel' ? `TXN-AIR-${Math.floor(Math.random() * 900000) + 100000}Y` : 
        `TXN-BNK-${Math.floor(Math.random() * 900000) + 100000}B`;

      const descriptionMsg = 
        withdrawType === 'bank' 
          ? `Commercial bank transfer matching payout processed securely to account ending in ${withdrawBankAcc.slice(-4)}`
          : `Automated instant telecommunication tower payout transferred securely to registered mobile number ${withdrawPhone}`;

      const newTx: Transaction = {
        id: Date.now(),
        type: 'withdraw',
        amount: `RWF ${amt.toLocaleString()}`,
        method: resolvedMethod,
        status: 'completed',
        date: 'Today',
        description: descriptionMsg,
        refCode: resolvedRef
      };

      setTxList(prev => [newTx, ...prev]);
    }, 1500);
  };

  const filteredTransactions = txList.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'escrow') return tx.type === 'escrow' || tx.status === 'pending';
    if (activeTab === 'completed') return tx.status === 'completed';
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight uppercase">Financial Wallet</h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">Manage your earnings, escrow matching balances, and secure instant payouts.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setDepositSuccess(false);
                setDepositAmount('');
                setDepositErrorMsg('');
                setDepositIsLoading(false);
                setShowDeposit(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Plus size={20} />
              Add Funds
            </button>
            <button 
              onClick={() => {
                setWithdrawSuccess(false);
                setWithdrawAmount('');
                setWithdrawErrorMsg('');
                setShowWithdraw(true);
              }}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-sans font-bold shadow-lg hover:bg-black transition-all cursor-pointer"
            >
              <ArrowUpRight size={20} />
              Withdraw
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <stat.icon size={20} />
                </div>
                <p className="font-sans text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
              <h3 className="text-2xl font-black text-gray-900 font-sans">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-sans uppercase tracking-tight">Recent Transactions</h2>
              <p className="text-xs text-gray-400 font-sans italic mt-0.5 font-medium">Click any row below to view full verification, instructions & security details</p>
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 self-start">
              {(['all', 'escrow', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest font-sans transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-sans">Details</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-sans">Method</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-sans">Amount</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-sans">Status</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-sans">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-sans">
                {filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-blue-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          tx.type === 'withdraw' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                        }`}>
                          {tx.type === 'withdraw' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-sans font-bold text-gray-900 text-sm group-hover:text-blue-650 transition-colors">{tx.method}</p>
                          <p className="text-[10px] text-gray-400 font-sans leading-tight mt-0.5 font-medium">{tx.refCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-gray-500 uppercase tracking-tight">
                      {tx.type === 'withdraw' ? 'Standard Standard' : tx.type === 'escrow' ? 'Vault Escrow' : 'Direct Credit'}
                    </td>
                    <td className="px-8 py-6">
                      <p className={`font-sans font-black text-sm ${
                        tx.type === 'withdraw' ? 'text-red-500' : 'text-green-600'
                      }`}>
                        {tx.type === 'withdraw' ? '-' : '+'}{tx.amount}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        tx.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-101'
                      }`}>
                        {tx.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {tx.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-xs font-bold text-gray-400 font-sans">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setSelectedTx(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-650 transition-colors bg-gray-50"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 mt-2">
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded ${
                  selectedTx.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-101'
                }`}>
                  {selectedTx.status}
                </span>
                <span className="text-[10px] font-mono text-gray-400 font-bold">{selectedTx.refCode}</span>
              </div>

              <h3 className="text-xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight">
                {selectedTx.method}
              </h3>
              <p className="text-xs text-gray-400 font-sans font-medium mb-6">Recorded on {selectedTx.date}</p>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block mb-0.5">Amount Transacted</span>
                  <span className={`text-2xl font-black font-sans ${
                    selectedTx.type === 'withdraw' ? 'text-red-500' : 'text-green-600'
                  }`}>
                    {selectedTx.type === 'withdraw' ? '-' : '+'}{selectedTx.amount}
                  </span>
                </div>
                <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                  <Landmark size={20} />
                </div>
              </div>

              <div className="space-y-4 mb-8 font-sans">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block mb-1">Transaction description</span>
                  <p className="text-xs text-gray-650 font-medium leading-relaxed italic">
                    "{selectedTx.description}"
                  </p>
                </div>

                {selectedTx.type === 'escrow' && (
                  <div className="p-4 bg-blue-50/50 border border-blue-105 rounded-2xl flex items-start gap-2.5">
                    <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-black text-blue-900 uppercase">LINEKORA Escrow Secured</p>
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed mt-0.5">
                        These funds are protected. LINEKORA verified the clients deposit into vault before you start. Finish milestone to trigger instant mobile launch.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Details Button */}
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WITHDRAW FUNDS MODAL */}
      <AnimatePresence>
        {showWithdraw && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-905/60 backdrop-blur-sm bg-gray-900/40" 
              onClick={() => {
                if (!withdrawIsLoading) setShowWithdraw(false);
              }} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
            >
              <button 
                disabled={withdrawIsLoading}
                onClick={() => setShowWithdraw(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {!withdrawSuccess ? (
                <div>
                  <h2 className="text-2xl font-black text-gray-950 font-sans mb-1 uppercase tracking-tight">Withdraw Funds</h2>
                  <p className="text-xs text-gray-400 font-sans italic mb-6 font-medium">Get instantly paid into your registered money channel</p>
                  
                  {withdrawErrorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-2xl flex items-start gap-2 animate-pulse">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{withdrawErrorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Amount (RWF)</label>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Available: RWF {balance.toLocaleString()}</span>
                      </div>
                      <input 
                        type="number" 
                        disabled={withdrawIsLoading}
                        value={withdrawAmount}
                        onChange={(e) => {
                          setWithdrawAmount(e.target.value);
                          setWithdrawErrorMsg('');
                        }}
                        placeholder="e.g. 5000" 
                        className="w-full p-4 rounded-2xl border-2 border-gray-100 font-sans font-black text-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-gray-900" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Choose Destination operator</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          type="button"
                          disabled={withdrawIsLoading}
                          onClick={() => setWithdrawType('mtn')}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            withdrawType === 'mtn' ? 'border-amber-500 bg-amber-50/50 text-amber-900' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <Smartphone size={18} />
                          <span className="font-sans text-[9px] font-black uppercase tracking-tight">MTN MoMo</span>
                        </button>
                        <button 
                          type="button"
                          disabled={withdrawIsLoading}
                          onClick={() => setWithdrawType('airtel')}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            withdrawType === 'airtel' ? 'border-red-500 bg-red-50/50 text-red-900' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <Smartphone size={18} />
                          <span className="font-sans text-[9px] font-black uppercase tracking-tight">Airtel</span>
                        </button>
                        <button 
                          type="button"
                          disabled={withdrawIsLoading}
                          onClick={() => setWithdrawType('bank')}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            withdrawType === 'bank' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                          }`}
                        >
                          <Landmark size={18} />
                          <span className="font-sans text-[9px] font-black uppercase tracking-tight">Bank (I&M)</span>
                        </button>
                      </div>
                    </div>

                    {withdrawType !== 'bank' ? (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Registered Mobile Number</label>
                        <input 
                          type="text" 
                          disabled={withdrawIsLoading}
                          value={withdrawPhone}
                          onChange={(e) => setWithdrawPhone(e.target.value)}
                          placeholder="+250 788 000 000"
                          className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">I&M Bank Account Number</label>
                        <input 
                          type="text" 
                          disabled={withdrawIsLoading}
                          value={withdrawBankAcc}
                          onChange={(e) => setWithdrawBankAcc(e.target.value)}
                          placeholder="00010-XXXXXX-XX"
                          className="w-full p-4 rounded-xl border border-gray-200 outline-none font-sans font-bold text-sm bg-gray-50 focus:bg-white focus:border-blue-600 text-gray-900"
                        />
                      </div>
                    )}

                    <button 
                      type="button"
                      disabled={withdrawIsLoading}
                      onClick={handleWithdrawConfirm}
                      className="w-full py-4.5 bg-gray-900 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[11px] hover:bg-black shadow-xl shadow-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {withdrawIsLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing Payout...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight size={16} />
                          <span>Request Withdraw</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">Payout Succeeded</h3>
                  <p className="text-sm font-sans text-gray-500 leading-relaxed max-w-xs mx-auto mb-6">
                    RWF {parseInt(withdrawAmount, 10).toLocaleString()} has been successfully securely transferred to your digital channel!
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left space-y-2 mb-8 uppercase font-sans text-[10px] font-black tracking-widest text-gray-500">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="text-gray-900">{withdrawType === 'bank' ? 'I&M Bank Transfer' : 'Mobile Instant'}</span>
                    </div>
                    <div className="flex justify-between animate-pulse">
                      <span>Status:</span>
                      <span className="text-green-600">Settled Instantly</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowWithdraw(false)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
                  >
                    Close Dialog
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit Funds Modal */}
      <AnimatePresence>
        {showDeposit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
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
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>

              {!depositSuccess ? (
                <div>
                  <h2 className="text-xl font-black text-gray-950 font-sans mb-1 text-center uppercase tracking-tight">Add Funds</h2>
                  <p className="text-xs text-gray-400 font-sans italic mb-6 text-center font-medium">Instantly load funds onto your digital wallet balance</p>

                  {depositErrorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-2xl flex items-start gap-2 animate-pulse">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{depositErrorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-3">Amount (RWF)</label>
                      <input 
                        type="number" 
                        disabled={depositIsLoading}
                        value={depositAmount}
                        onChange={(e) => {
                          setDepositAmount(e.target.value);
                          setDepositErrorMsg('');
                        }}
                        placeholder="0.00" 
                        className="w-full p-4 rounded-2xl border-2 border-gray-100 font-sans font-black text-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-gray-900" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        disabled={depositIsLoading}
                        onClick={() => setDepositMethod('momo')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          depositMethod === 'momo' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                        }`}
                      >
                        <Smartphone size={24} />
                        <span className="font-sans text-[10px] font-black uppercase tracking-tighter">Mobile Money</span>
                      </button>
                      <button 
                        type="button"
                        disabled={depositIsLoading}
                        onClick={() => setDepositMethod('card')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          depositMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-blue-600'
                        }`}
                      >
                        <CreditCard size={24} />
                        <span className="font-sans text-[10px] font-black uppercase tracking-tighter">Debit Card</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleDepositConfirm}
                      disabled={depositIsLoading}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-sans font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {depositIsLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing Placement...</span>
                        </>
                      ) : (
                        <span>Confirm Deposit</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">Deposit Succeeded</h3>
                  <p className="text-sm font-sans text-gray-500 leading-relaxed max-w-xs mx-auto mb-6">
                    RWF {parseInt(depositAmount, 10).toLocaleString()} has been successfully loaded into your available balance!
                  </p>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left space-y-2 mb-8 uppercase font-sans text-[10px] font-black tracking-widest text-gray-500">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="text-gray-900">{depositMethod === 'momo' ? 'Mobile Money Transfer' : 'Direct Card Credit'}</span>
                    </div>
                    <div className="flex justify-between animate-pulse">
                      <span>Security:</span>
                      <span className="text-green-650">Escrow Protected</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowDeposit(false)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-sans font-black uppercase tracking-widest text-[10px] text-center transition-all shadow-lg cursor-pointer"
                  >
                    Close Dialog
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
