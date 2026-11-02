import { useState } from 'react';
import { Facebook, Linkedin, Twitter, MessageCircle, Link2, Check } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  label?: string;
}

export default function SocialShare({ url, title, description, className = '', label }: SocialShareProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const text = description ? `${title}\n${description}` : title;
  const enc = encodeURIComponent;

  const links = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${enc(`${text} ${url}`)}`,
      Icon: MessageCircle,
      color: 'hover:text-green-600 hover:border-green-200 hover:bg-green-50',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      Icon: Facebook,
      color: 'hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
      Icon: Twitter,
      color: 'hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      Icon: Linkedin,
      color: 'hover:text-sky-700 hover:border-sky-200 hover:bg-sky-50',
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable on insecure origins; ignore silently.
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-1">
        {label || t('share')}
      </span>
      {links.map(({ name, href, Icon, color }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('share_on')} ${name}`}
          title={`${t('share_on')} ${name}`}
          className={`h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all ${color}`}
        >
          <Icon size={15} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label={t('copy_link')}
        title={copied ? t('link_copied') : t('copy_link')}
        className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
      >
        {copied ? <Check size={15} className="text-green-600" /> : <Link2 size={15} />}
      </button>
    </div>
  );
}
