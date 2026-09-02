import { useCallback, useEffect, useRef, useState } from 'react';
import { getConversations, getMessages, sendMessage, markMessagesRead, updateConversationPref, Conversation, Message, ChatAttachment } from './api';

export interface LiveChatItem {
  id: string;
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

export interface LiveChatMessage {
  id: number;
  text: string;
  sent: boolean;
  time: string;
  rawTime: string;
  attachments?: ChatAttachment[];
}

function initials(name: string): string {
  return name.split(' ').map((n: string) => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  } catch {
      return '';
  }
}

function parseAttachments(value: unknown): ChatAttachment[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as ChatAttachment[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as ChatAttachment[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Full, real-time messaging hook backed by the Linekora API.
// Polls the conversation list + active thread so messages appear live across
// devices without needing a WebSocket.
export function useLiveChat(userId: string | undefined) {
  const [chatsList, setChatsList] = useState<LiveChatItem[]>([]);
  const [threads, setThreads] = useState<Record<string, LiveChatMessage[]>>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [onlinePeers, setOnlinePeers] = useState<Record<string, boolean>>({});

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build LiveChatItem list from conversations (with unread counts)
  const applyConversations = useCallback((convs: Conversation[]) => {
    const items: LiveChatItem[] = convs.map((c) => ({
      id: c.peer.id,
      name: c.peer.displayName,
      role: c.peer.role || 'User',
      lastMsg: c.lastMessage,
      time: formatTime(c.lastMessageAt),
      unread: c.unread,
      online: true,
      avatar: initials(c.peer.displayName),
      pinned: c.pinned,
      muted: c.muted,
    }));
    setChatsList(items);
  }, []);

  // Fetch the full message thread for a peer
  const loadThread = useCallback(async (peerId: string) => {
    if (!userId) return;
    try {
      const msgs = await getMessages(userId, peerId);
      const formatted: LiveChatMessage[] = [...msgs].reverse().map((m: Message) => ({
        id: m.id,
        text: m.content || '',
        sent: m.senderId === userId,
        time: formatTime(m.createdAt),
        rawTime: m.createdAt,
        attachments: parseAttachments(m.attachments),
      }));
      setThreads(prev => ({ ...prev, [peerId]: formatted }));
    } catch (err) {
      console.error('Failed to load thread', err);
    }
  }, [userId]);

  // Refresh conversation list (called periodically + after sends)
  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const convs = await getConversations(userId);
      applyConversations(convs);
      // If we have an active chat, refresh its thread too so live messages stream in
      if (activeChat) {
        loadThread(activeChat);
      }
    } catch (err) {
      console.error('Failed to refresh conversations', err);
    }
  }, [userId, activeChat, applyConversations, loadThread]);

  // Start polling when a user is present
  useEffect(() => {
    if (!userId) return;
    refreshConversations();
    pollRef.current = setInterval(refreshConversations, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId, refreshConversations]);

  // Open a chat: load thread, clear unread, mark DB read
  const openChat = useCallback(async (peerId: string) => {
    setActiveChat(peerId);
    await loadThread(peerId);
    setChatsList(prev => prev.map(c => c.id === peerId ? { ...c, unread: 0 } : c));
    if (userId) {
      try { await markMessagesRead(userId, peerId); } catch (e) {}
    }
  }, [userId, loadThread]);

  // Set a chat as read (without opening/switching)
  const markRead = useCallback(async (peerId: string) => {
    setChatsList(prev => prev.map(c => c.id === peerId ? { ...c, unread: 0 } : c));
    if (userId) {
      try { await markMessagesRead(userId, peerId); } catch (e) {}
    }
  }, [userId]);

  // Toggle pin for a conversation and persist to the backend
  const togglePin = useCallback(async (peerId: string) => {
    if (!userId) return;
    let next = false;
    setChatsList(prev => prev.map(c => {
      if (c.id === peerId) {
        next = !c.pinned;
        return { ...c, pinned: next };
      }
      return c;
    }));
    try {
      await updateConversationPref({ userId, peerId, pinned: next });
    } catch (err) {
      console.error('Failed to persist pin', err);
    }
  }, [userId]);

  // Toggle mute for a conversation and persist to the backend
  const toggleMute = useCallback(async (peerId: string) => {
    if (!userId) return;
    let next = false;
    setChatsList(prev => prev.map(c => {
      if (c.id === peerId) {
        next = !c.muted;
        return { ...c, muted: next };
      }
      return c;
    }));
    try {
      await updateConversationPref({ userId, peerId, muted: next });
    } catch (err) {
      console.error('Failed to persist mute', err);
    }
  }, [userId]);

  // Send a message; update state optimistically then re-pull thread
  const send = useCallback(async (peerId: string, text: string, attachments?: ChatAttachment[]) => {
    if (!userId) return;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    setSending(true);
    const optimistic: LiveChatMessage = {
      id: Date.now(),
      text: text.trim(),
      sent: true,
      time: formatTime(new Date().toISOString()),
      rawTime: new Date().toISOString(),
      attachments,
    };
    setThreads(prev => ({ ...prev, [peerId]: [...(prev[peerId] || []), optimistic] }));
    setChatsList(prev => prev.map(c => c.id === peerId ? { ...c, lastMsg: text.trim() || '📎 Attachment', time: 'now' } : c));
    try {
      await sendMessage({
        content: text.trim(),
        senderId: userId,
        receiverId: peerId,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
    setSending(false);
    await loadThread(peerId);
  }, [userId, loadThread]);

  // Convenience: send to the active chat
  const sendToActive = useCallback(async (text: string) => {
    if (!activeChat) return;
    await send(activeChat, text);
  }, [activeChat, send]);

  const setOnline = useCallback((peerId: string, online: boolean) => {
    setOnlinePeers(prev => ({ ...prev, [peerId]: online }));
    setChatsList(prev => prev.map(c => c.id === peerId ? { ...c, online } : c));
  }, []);

  return {
    chatsList,
    setChatsList,
    threads,
    setThreads,
    activeChat,
    setActiveChat,
    sending,
    onlinePeers,
    openChat,
    markRead,
    togglePin,
    toggleMute,
    send,
    sendToActive,
    refreshConversations,
    setOnline,
  };
}