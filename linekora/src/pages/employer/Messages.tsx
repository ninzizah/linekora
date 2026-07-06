import React, { useState } from 'react';
import { 
  MessageSquare, Search, Send, Plus, 
  MoreVertical, Shield, Users, CheckCheck
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function EmployerMessages() {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [message, setMessage] = useState('');

  const chats = [
    { 
      id: 1, 
      name: 'Alex Karekezi', 
      role: 'Worker (Gardener)', 
      lastMsg: "I'll be there by 8:30 AM tomorrow.", 
      time: '1h ago', 
      unread: 0, 
      online: true,
      avatar: 'AK'
    },
    { 
      id: 2, 
      name: 'Professional Cleaners', 
      role: 'Cleaning Company', 
      lastMsg: "Thank you for booking our service.", 
      time: '3h ago', 
      unread: 1, 
      online: false,
      avatar: 'PC'
    }
  ];

  const messages = [
    { id: 1, text: "Hi Alex, can you come help with the garden tomorrow?", sent: true, time: '2:00 PM' },
    { id: 2, text: "Yes sure! What time works for you?", sent: false, time: '2:15 PM' },
    { id: 3, text: "Around 9:00 AM would be perfect.", sent: true, time: '2:20 PM' },
    { id: 4, text: "I'll be there by 8:30 AM tomorrow.", sent: false, time: '2:45 PM' },
  ];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-50 flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-black text-gray-900 font-sans tracking-tight mb-6 uppercase">My Chats</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search workers..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors relative ${activeChat === chat.id ? 'bg-blue-50/50' : ''}`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black font-sans text-sm">
                    {chat.avatar}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="font-sans font-black text-gray-900 text-sm truncate">{chat.name}</p>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{chat.time}</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">{chat.role}</p>
                  <p className="text-xs text-gray-500 truncate font-sans font-medium">{chat.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="h-20 px-8 bg-white border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black font-sans text-xs">
                    {chats.find(c => c.id === activeChat)?.avatar}
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-gray-900 leading-none mb-1">
                      {chats.find(c => c.id === activeChat)?.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
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
              <div className="p-6 bg-white border-t border-gray-50 flex items-center gap-4">
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                  <Plus size={24} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message to the worker..." 
                    className="w-full pl-6 pr-12 py-4 rounded-[2rem] bg-gray-50 border-transparent focus:bg-white focus:border-blue-600 outline-none font-sans text-sm font-bold transition-all"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
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
              <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">Your Private Conversations</h3>
              <p className="text-gray-500 font-sans text-sm mt-1 max-w-xs italic">
                Chat with workers and manage your bookings securely.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
