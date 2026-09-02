import type React from 'react';
import { FileText, X } from 'lucide-react';
import { ChatAttachment } from '../lib/api';
import { useChatAttachments } from '../lib/useChatAttachments';
import { isImageAttachment } from '../lib/attachments';
import { useLanguage } from '../lib/LanguageContext';

// Preview strip (chips + validation error) rendered above the chat input row.
// Button to open the picker is provided via the children render-prop so it can be
// placed inline within the input row.
export default function ChatAttachmentPicker({
  hook,
  children,
}: {
  hook: ReturnType<typeof useChatAttachments>;
  children?: (handlers: {
    openPicker: () => void;
    onFilesChosen: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  }) => React.ReactNode;
}) {
  const { attachments, error, onFilesChosen, openPicker, removeAttachment, fileInputRef } = hook;
  const { t } = useLanguage();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={onFilesChosen}
      />

      {error && (
        <div className="text-[10px] font-black text-red-500 uppercase tracking-wider px-1">{error}</div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <span key={i}>
              {renderChip(att, () => removeAttachment(i), t)}
            </span>
          ))}
        </div>
      )}

      {children && children({ openPicker, onFilesChosen, fileInputRef })}
    </>
  );
}

function renderChip(att: ChatAttachment, onRemove: () => void, t: (k: string, p?: Record<string, string | number>) => string) {
  return (
    <div className="flex items-center gap-2 pl-2 pr-1 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
      {isImageAttachment(att.type) ? (
        <span className="h-6 w-6 rounded-md overflow-hidden shrink-0">
          <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
        </span>
      ) : (
        <span className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileText size={13} />
        </span>
      )}
      <span className="text-[10px] font-black text-gray-700 max-w-[5.5rem] truncate">{att.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
        aria-label={t('remove_attachment')}
      >
        <X size={13} />
      </button>
    </div>
  );
}
