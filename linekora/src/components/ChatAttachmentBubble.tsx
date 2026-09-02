import { FileText, X } from 'lucide-react';
import { ChatAttachment } from '../lib/api';
import { isImageAttachment, isPdfAttachment } from '../lib/attachments';
import { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

interface Props {
  attachments: ChatAttachment[];
  sent: boolean;
}

// Renders attachment(s) inside a chat message bubble.
export default function ChatAttachmentBubble({ attachments, sent }: Props) {
  const { t } = useLanguage();
  const [openImage, setOpenImage] = useState<ChatAttachment | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att, i) => {
          if (isImageAttachment(att.type)) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenImage(att)}
                className="relative group overflow-hidden rounded-xl border border-black/10 shadow-sm cursor-zoom-in shrink-0"
              >
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-28 w-28 object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-black/50 text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {att.name}
                </span>
              </button>
            );
          }

          const isPdf = isPdfAttachment(att.type);
          return (
            <a
              key={i}
              href={att.dataUrl}
              download={att.name}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border max-w-[14rem] no-underline
                ${sent ? 'bg-white/15 border-white/25 text-white' : 'bg-white border-gray-200 text-gray-700'}
                hover:opacity-80 transition-opacity shrink-0`}
            >
              <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${sent ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <FileText size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black truncate max-w-[8rem]">{att.name}</span>
                <span className={`block text-[9px] font-black uppercase tracking-widest ${sent ? 'text-white/60' : 'text-gray-400'}`}>
                  {isPdf ? 'PDF' : t('document')}
                </span>
              </span>
            </a>
          );
        })}
      </div>

      {openImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setOpenImage(null)}
        >
          <button
            onClick={() => setOpenImage(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label={t('close')}
          >
            <X size={22} />
          </button>
          <img
            src={openImage.dataUrl}
            alt={openImage.name}
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain"
          />
        </div>
      )}
    </>
  );
}
