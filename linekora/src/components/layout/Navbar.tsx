import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';

import { useLanguage, Language } from '../../lib/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-gray-900">
                LINEKORA
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            <Link to="/about" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">{t('about')}</Link>
            <Link to="/pricing" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">{t('pricing')}</Link>
            <Link to="/contact" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">{t('contact')}</Link>
            <Link to="/scams" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">{t('safety')}</Link>

            {profile?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-1.5 rounded-full bg-red-950/10 border border-red-900/30 px-3.5 py-1.5 font-sans text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                {t('admin_portal')}
              </Link>
            )}

            {/* Language Switcher */}
            <select
              value={language}
              onChange={handleLangChange}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="rw">Kinyarwanda (RW)</option>
              <option value="fr">Français (FR)</option>
              <option value="sw">Kiswahili (SW)</option>
            </select>
            
            {user ? (
              <Link to="/dashboard" className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-sans text-sm font-medium text-gray-900 hover:bg-gray-50">
                <User size={16} />
                {t('dashboard')}
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-sans text-sm font-medium text-gray-600 hover:text-blue-600">{t('login')}</Link>
                <Link to="/register" className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200">
                  {t('join')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b border-gray-100 bg-white p-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/about" className="font-sans text-base font-medium text-gray-600">{t('about')}</Link>
            <Link to="/pricing" className="font-sans text-base font-medium text-gray-600">{t('pricing')}</Link>
            <Link to="/contact" className="font-sans text-base font-medium text-gray-600">{t('contact')}</Link>
            <Link to="/scams" className="font-sans text-base font-medium text-gray-600">{t('safety')}</Link>

            {/* Language Switcher Mobile */}
            <select
              value={language}
              onChange={handleLangChange}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans cursor-pointer w-full"
            >
              <option value="en">English (EN)</option>
              <option value="rw">Kinyarwanda (RW)</option>
              <option value="fr">Français (FR)</option>
              <option value="sw">Kiswahili (SW)</option>
            </select>

            <div className="h-px bg-gray-100" />
            {profile?.role === 'ADMIN' && (
              <Link to="/admin" className="font-sans text-base font-bold text-red-600 flex items-center gap-2">
                {t('admin_portal')}
              </Link>
            )}
            {user ? (
              <Link to="/dashboard" className="font-sans text-base font-medium text-blue-600">{t('dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" className="font-sans text-base font-medium text-gray-600">{t('login')}</Link>
                <Link to="/register" className="rounded-full bg-blue-600 px-6 py-3 text-center font-sans text-base font-bold text-white shadow-lg shadow-blue-200">
                  {t('join')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
