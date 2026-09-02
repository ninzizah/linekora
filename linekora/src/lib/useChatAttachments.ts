import { useRef, useState } from 'react';
import type React from 'react';
import { ChatAttachment } from './api';
import {
  MAX_ATTACHMENTS,
  processAttachmentFiles,
  readAsDataUrl,
} from './attachments';
import { useLanguage } from './LanguageContext';

// Manages chat attachment selection + validation. Returns handlers and state
// for the attachment picker UI and for including attachments on send.
export function useChatAttachments() {
  const { t } = useLanguage();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    setError(null);
    console.log('[attach] openPicker, input exists:', !!fileInputRef.current);
    fileInputRef.current?.click();
  };

  const onFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('[attach] onFilesChosen fired, files:', files ? files.length : null);
    e.target.value = '';
    if (!files || files.length === 0) return;

    const { candidates, errorCode, name } = processAttachmentFiles(files, attachments.length);
    if (errorCode === 'max_reached' || errorCode === 'too_many') {
      setError(t('attach_max_files', { count: MAX_ATTACHMENTS }));
      return;
    }
    if (errorCode === 'bad_type') {
      setError(t('attach_type_unsupported', { name: name || '' }));
      return;
    }
    if (errorCode === 'too_big') {
      setError(t('attach_size_limit', { name: name || '' }));
      return;
    }
    if (candidates.length === 0) return;
    setError(null);

    try {
      const withData: ChatAttachment[] = [];
      for (const c of candidates) {
        const dataUrl = await readAsDataUrl(c.file);
        withData.push({ name: c.name, type: c.type, dataUrl });
      }
      setAttachments(prev => [...prev, ...withData]);
      console.log('[attach] attachments state updated, now:', attachments.length + withData.length);
    } catch (err) {
      console.error('Attachment read failed', err);
      setError(name ? t('attach_size_limit', { name }) : t('attach_type_unsupported', { name: name || '' }));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const clearAttachments = () => {
    setAttachments([]);
    setError(null);
  };

  return {
    attachments,
    setAttachments,
    error: error,
    clearError: () => setError(null),
    openPicker,
    onFilesChosen,
    removeAttachment,
    clearAttachments,
    fileInputRef,
  };
}
