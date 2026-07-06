import React, { useState } from 'react';
import { 
  MessageSquare, Search, Send, Plus, 
  MoreVertical, Phone, Video, Shield,
  Check, CheckCheck, Clock, AlertCircle,
  Pin, VolumeX, Flag, Trash, AlertTriangle, X, Users
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'motion/react';

interface ChatItem {
  id: number;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string;
  pinned?: boolean;
  muted?: boolean;
}

interface MessageItem {
  id: number;
  text: string;
  sent: boolean;
  time: string;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function CompanyMessages() {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');

  // Stateful chats list
  const [chatsList, setChatsList] = useState<ChatItem[]>([
    { 
      id: 1, 
      name: 'John Mweru', 
      role: 'Applicant (Office Cleaner)', 
      lastMsg: "I have 3 years experience in office cleaning.", 
      time: '5m ago', 
      unread: 1, 
      online: true,
      avatar: 'JM',
      pinned: false,
      muted: false
    },
    { 
      id: 2, 
      name: 'Sarah Nakato', 
      role: 'Applicant (Office Cleaner)', 
      lastMsg: "When can we schedule the interview?", 
      time: '2h ago', 
      unread: 0, 
      online: false,
      avatar: 'SN',
      pinned: false,
      muted: false
    },
    { 
      id: 3, 
      name: 'LINEKORA Support', 
      role: 'System Support', 
      lastMsg: "Your company verification is successful.", 
      time: '1d ago', 
      unread: 0, 
      online: true,
      avatar: 'LK',
      pinned: false,
      muted: false
    }
  ]);

  // Messages database keyed by chatId
  const [messagesDB, setMessagesDB] = useState<Record<number, MessageItem[]>>({
    1: [
      { id: 1, text: "Hello John, we reviewed your application for the Office Cleaner role.", sent: true, time: '11:00 AM' },
      { id: 2, text: "Thank you for the update. I am very interested.", sent: false, time: '11:05 AM' },
      { id: 3, text: "I have 3 years experience in office cleaning.", sent: false, time: '11:06 AM' }
    ],
    2: [
      { id: 1, text: "Greetings Sarah, when are you open next week for a face-to-face meet?", sent: true, time: 'Yesterday' },
      { id: 2, text: "When can we schedule the interview? Anytime Tuesday or Thursday works.", sent: false, time: 'Yesterday' }
    ],
    3: [
      { id: 1, text: "Welcome to LINEKORA! Your registration process in Kigali registry database has been greenlisted.", sent: false, time: 'Tuesday' }
    ]
  });

  // UI Interactive States
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportComments, setReportComments] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Get ordered chats (pinned ones always at the top)
  const getSortedChats = () => {
    return [...chatsList].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  };

  // Mark active chat's unread count to 0
  const handleChatSelect = (id: number) => {
    setActiveChat(id);
    setChatsList(prev => prev.map(chat => chat.id === id ? { ...chat, unread: 0 } : chat));
    setIsHeaderDropdownOpen(false);
  };

  // Send a real message to applicant
  const handleSendMessage = () => {
    if (!message.trim() || activeChat === null) return;

    const newMsg: MessageItem = {
      id: Date.now(),
      text: message.trim(),
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages database
    setMessagesDB(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg]
    }));

    // Update last message in sidebar listing
    setChatsList(prev => prev.map(chat => 
      chat.id === activeChat ? { ...chat, lastMsg: message.trim(), time: 'Just now' } : chat
    ));

    setMessage('');
    addToast('Message Dispatched 🛫', "Message routed successfully to professional's smartphone pager.", 'success');
  };

  // Action: Toggle Pin Chat
  const handleTogglePin = () => {
    if (activeChat === null) return;
    setChatsList(prev => prev.map(chat => {
      if (chat.id === activeChat) {
        const nextPin = !chat.pinned;
        addToast(
          nextPin ? 'Pinned Conversation 📌' : 'Unpinned Conversation 📍',
          nextPin ? `"${chat.name}" is now pinned to the top of talent inbox.` : `"${chat.name}" unpinned from top list.`,
          'success'
        );
        return { ...chat, pinned: nextPin };
      }
      return chat;
    }));
    setIsHeaderDropdownOpen(false);
  };

  // Action: Toggle Mute Chat
  const handleToggleMute = () => {
    if (activeChat === null) return;
    setChatsList(prev => prev.map(chat => {
      if (chat.id === activeChat) {
        const nextMute = !chat.muted;
        addToast(
          nextMute ? 'Alerts Muted 🔕' : 'Alerts Restored 🔔',
          nextMute ? `Sound alerts muted for applicant "${chat.name}".` : `Notifications restored for applicant "${chat.name}".`,
          'info'
        );
        return { ...chat, muted: nextMute };
      }
      return chat;
    }));
    setIsHeaderDropdownOpen(false);
  };

  // Action: Clear Chat Thread
  const handleClearHistory = () => {
    if (activeChat === null) return;
    const targetChat = chatsList.find(c => c.id === activeChat);
    
    setMessagesDB(prev => ({
      ...prev,
      [activeChat]: []
    }));

    addToast(
      'Clean Workspace ✨',
      `Chat history for ${targetChat?.name} has been refreshed locally.`,
      'info'
    );
    setIsHeaderDropdownOpen(false);
  };

  // Action: Submit Profile report (Fake moderation)
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeChat === null) return;
    const targetChat = chatsList.find(c => c.id === activeChat);

    setSubmittingReport(true);
    setTimeout(() => {
      setSubmittingReport(false);
      setShowReportModal(false);
      addToast(
        'Inquest Lodged 🛡️',
        `Violation report against ${targetChat?.name} submitted to platform security auditors.`,
        'success'
      );
    }, 1200);
  };

  const currentChatObj = chatsList.find(c => c.id === activeChat);
  const currentMessages = activeChat ? (messagesDB[activeChat] || []) : [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-50 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight mb-6 uppercase">Talent Messages</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search talent..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {getSortedChats().map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors relative ${activeChat === chat.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-blue-105 text-blue-700 font-black font-sans text-sm flex items-center justify-center border border-blue-100 shadow-sm">
                    {chat.avatar}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 text-left overflow-hidden pr-3">
                  <div className="flex justify-between items-start mb-0.5 gap-1">
                    <p className="font-sans font-black text-gray-900 text-sm truncate flex items-center gap-1">
                      {chat.name}
                      {chat.pinned && <Pin size={10} className="text-blue-600 rotate-45" />}
                      {chat.muted && <VolumeX size={10} className="text-gray-405" />}
                    </p>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">{chat.role}</p>
                  <p className="text-xs text-gray-500 truncate font-sans font-medium">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="absolute right-4 bottom-4 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-200 animate-bounce">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50/20">
          {activeChat && currentChatObj ? (
            <>
              {/* Header */}
              <div className="h-20 px-8 bg-white border-b border-gray-50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-105 text-blue-700 font-sans font-black text-xs flex items-center justify-center border border-blue-200">
                    {currentChatObj.avatar}
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-gray-900 leading-none mb-1 text-sm flex items-center gap-1.5">
                      {currentChatObj.name}
                      {currentChatObj.pinned && <Pin size={12} className="text-blue-600" />}
                      {currentChatObj.muted && <VolumeX size={12} className="text-gray-400" />}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${currentChatObj.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {currentChatObj.online ? 'Active Now' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => addToast('Hiring Call Node...', "Initiating LINEKORA corporate vocal bridge setup...", 'info')}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Phone size={18} />
                  </button>
                  <button 
                    onClick={() => addToast('Joining Video Portal...', "Starting corporate high-definition peer stream...", 'info')}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Video size={18} />
                  </button>
                  <div className="w-px h-6 bg-gray-100 mx-2" />
                  
                  {/* THREE DOTS MENU POPPING OVER TALENT HEADER */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                      className={`p-2.5 rounded-xl transition-all ${isHeaderDropdownOpen ? 'bg-gray-955 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {isHeaderDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsHeaderDropdownOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-gray-150 shadow-2xl z-40 p-2 overflow-hidden text-left"
                          >
                            <button 
                              onClick={handleTogglePin}
                              className="w-full text-left px-4 py-3 text-xs font-black text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                            >
                              <Pin size={14} className="text-blue-500" />
                              <span>{currentChatObj.pinned ? 'Unpin Chat' : 'Pin Convers.'}</span>
                            </button>

                            <button 
                              onClick={handleToggleMute}
                              className="w-full text-left px-4 py-3 text-xs font-black text-gray-700 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                            >
                              <VolumeX size={14} className="text-indigo-500" />
                              <span>{currentChatObj.muted ? 'Unmute Alerts' : 'Mute Alerts'}</span>
                            </button>

                            <button 
                              onClick={handleClearHistory}
                              className="w-full text-left px-4 py-3 text-xs font-black text-gray-700 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                            >
                              <Trash size={14} className="text-red-400" />
                              <span>Clear History</span>
                            </button>

                            <div className="border-t border-gray-100 my-1.5" />

                            <button 
                              onClick={() => {
                                setShowReportModal(true);
                                setIsHeaderDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-black text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2.5 uppercase tracking-wider"
                            >
                              <Flag size={14} className="text-red-500" />
                              <span>Report Profile</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex justify-center">
                  <div className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm font-sans">
                    Hiring Stream Coordinates Secure
                  </div>
                </div>

                {currentMessages.length > 0 ? (
                  currentMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`
                          p-4 rounded-[1.65rem] font-sans text-sm font-medium leading-relaxed shadow-sm
                          ${msg.sent 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}
                        `}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-2 px-1 ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] font-black text-gray-400 uppercase">{msg.time}</span>
                          {msg.sent && <CheckCheck size={12} className="text-blue-650" />}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">No active transcripts</p>
                    <p className="text-[10px] text-gray-400 italic mt-1 font-sans">Begin the interview dialogue sequence below.</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 bg-white border-t border-gray-50 flex items-center gap-4">
                <button 
                  onClick={() => addToast('Corporate Node Extra', "Contract attachments and billing forms in chat is incoming in v2.4.", 'info')}
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                >
                  <Plus size={24} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Send a message to talent..." 
                    className="w-full pl-6 pr-14 py-4 rounded-[2.5rem] bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all border"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-105 hover:bg-blue-700 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 bg-gray-105 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">Hire Verified Talent</h3>
              <p className="text-gray-500 font-sans text-sm mt-1 max-w-xs italic">
                Communicate directly with applicants and manage your hiring pipeline.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED TALENT PROFILE REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && currentChatObj && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm"
              onClick={() => setShowReportModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 md:p-10 shadow-2xl relative border border-gray-100 z-10"
            >
              <button 
                onClick={() => setShowReportModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-55 text-gray-400 bg-gray-50 flex items-center justify-center border border-gray-150"
              >
                <X size={20} />
              </button>

              <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-655 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>

              <h3 className="text-xl font-black text-gray-955 font-sans uppercase">Report "{currentChatObj.name}"</h3>
              <p className="text-xs text-gray-400 font-sans italic mt-1 mb-8">Incident files are recorded and filed to LINEKORA Security Center.</p>

              <form onSubmit={handleSubmitReport} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Issue / Flag Reason</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-red-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-red-10% cursor-pointer"
                  >
                    <option value="scam">Fake details or proxy profile scamming</option>
                    <option value="spam">Excessive or duplicate hiring solicitation</option>
                    <option value="abuse">Unprofessional conduct or abuse</option>
                    <option value="offload">Trying to collect cash outside escrow locks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Context or Details</label>
                  <textarea 
                    value={reportComments}
                    onChange={(e) => setReportComments(e.target.value)}
                    placeholder="Explain what happened. Providing chat logs details is highly recommended..."
                    className="w-full h-24 px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-red-600 outline-none font-sans font-bold text-sm text-gray-950 transition-all focus:ring-4 focus:ring-red-10% resize-none"
                  />
                </div>

                <div className="pt-4 grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowReportModal(false)}
                    className="py-3.5 bg-gray-50 hover:bg-gray-105 border border-gray-150 text-gray-650 rounded-xl font-sans font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingReport}
                    className="py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingReport ? (
                      <span>Submitting File...</span>
                    ) : (
                      <>
                        <Flag size={14} />
                        <span>Submit Inquest</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TOAST DRAWER */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full bg-white rounded-3xl border border-gray-150 p-5 shadow-2xl flex items-start gap-4 relative overflow-hidden"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-2 shrink-0 ${
                t.type === 'error' ? 'bg-red-550' : t.type === 'info' ? 'bg-indigo-550' : 'bg-green-500'
              }`} />
              
              <div className="flex-1 pl-1">
                <p className="font-sans font-black uppercase tracking-[0.1em] text-[10px] text-gray-400 mb-0.5">{t.title}</p>
                <p className="font-sans text-[11.5px] font-bold text-gray-850 leading-normal">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors p-1 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

