import React, { useState } from 'react';
import { 
  MessageSquare, Search, Send, Plus, 
  MoreVertical, Shield, Users, CheckCheck, ArrowLeft
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { useLiveChat } from '../../lib/useLiveChat';

export default function EmployerMessages() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const uid = profile?.id || undefined;
  const [message, setMessage] = useState('');

  const {
    chatsList,
    threads,
    activeChat,
    setActiveChat,
    send,
    openChat,
  } = useLiveChat(uid);

  const handleSendMessage = () => {
    if (!message.trim() || activeChat === null) return;
    send(activeChat, message.trim());
    setMessage('');
  };

  const currentChatObj = chatsList.find(c => c.id === activeChat);
  const currentMessages = activeChat ? (threads[activeChat] || []) : [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-13rem)] md:h-[calc(100vh-12rem)] supports-[height:100dvh]:h-[calc(100dvh-12rem)] flex bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-gray-50 flex-col shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight mb-6 uppercase">{t('my_chats')}</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('search_workers')} 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsList.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className={`w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors relative ${activeChat === chat.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black font-sans text-sm">
                    {chat.avatar}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 text-left overflow-hidden pr-3">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="font-sans font-black text-gray-900 text-sm truncate">{chat.name}</p>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{chat.time}</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">{chat.role}</p>
                  <p className="text-xs text-gray-500 truncate font-sans font-medium">{chat.lastMsg}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="absolute right-4 bottom-4 h-5 w-5 bg-blue-650 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-gray-50/30 ${activeChat ? 'flex' : 'hidden md:flex'}`}>
          {activeChat && currentChatObj ? (
            <>
              {/* Header */}
              <div className="h-20 px-4 md:px-8 bg-white border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    aria-label={t('back')}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black font-sans text-xs">
                    {currentChatObj.avatar}
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-gray-900 leading-none mb-1">
                      {currentChatObj.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${currentChatObj.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {currentChatObj.online ? t('online') : t('offline')}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {currentMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] md:max-w-[70%]">
                      <div className={`
                        p-4 rounded-3xl font-sans text-sm font-medium leading-relaxed shadow-sm
                        ${msg.sent 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}
                      `}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-2 px-1 ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{msg.time}</span>
                        {msg.sent && <CheckCheck size={12} className="text-blue-600" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 md:p-6 bg-white border-t border-gray-50 flex items-center gap-2 md:gap-4">
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                  <Plus size={24} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('type_a_message')} 
                    className="w-full pl-6 pr-12 py-4 rounded-[2rem] bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all border"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-20 w-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-300 mb-6">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">{t('private_conversations')}</h3>
              <p className="text-gray-500 font-sans text-sm mt-1 max-w-xs italic">
                {t('chat_with_workers')}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
