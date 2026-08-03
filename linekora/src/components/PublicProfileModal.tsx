import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, MapPin, Star, Phone, Mail, Award, CheckCircle2, Briefcase, Zap, FileText
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export interface PublicProfileUser {
  id?: string | number;
  name?: string;
  displayName?: string;
  role?: string;
  location?: string;
  trustScore?: number;
  verificationStatus?: string;
  verified?: boolean;
  tier?: string;
  bio?: string;
  phone?: string;
  email?: string;
  skills?: string[];
  rating?: number;
  completedJobsCount?: number;
  avatarUrl?: string;
}

interface PublicProfileModalProps {
  user: PublicProfileUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PublicProfileModal({ user, isOpen, onClose }: PublicProfileModalProps) {
  const { t } = useLanguage();
  if (!isOpen || !user) return null;

  const displayName = user.displayName || user.name || t('user_profile');
  const roleName = user.role || t('member');
  const isVerified = user.verificationStatus === 'verified' || user.verified;
  const trustScore = user.trustScore || 0;
  const location = user.location || '';
  const bio = user.bio || t('no_bio_provided');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto font-sans"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 flex items-center justify-center border border-gray-100"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <div className="h-24 w-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200 border-4 border-white overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-xl border-2 border-white shadow-md" title={t('verified_profile')}>
                  <ShieldCheck size={16} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{displayName}</h3>
              {isVerified && (
                <span className="bg-green-50 text-green-600 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                  <CheckCircle2 size={10} /> {t('status_verified')}
                </span>
              )}
            </div>

            <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
              {roleName} • {user.tier || t('standard_tier')}
            </p>

            <p className="text-xs text-gray-500 flex items-center gap-1 font-bold">
              <MapPin size={14} className="text-red-400" />
              {location}
            </p>
          </div>

          {/* Trust Score & Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="p-4 bg-yellow-50/60 border border-yellow-100 rounded-2xl text-center">
              <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest block mb-1">{t('trust_score')}</span>
              <span className="text-xl font-black text-yellow-900 flex items-center justify-center gap-1">
                <Star size={16} className="fill-yellow-500 text-yellow-500" />
                {trustScore}
              </span>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-center">
              <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest block mb-1">{t('rating_label')}</span>
              <span className="text-xl font-black text-blue-900">
                {user.rating ? `${user.rating} / 5.0` : t('not_applicable')}
              </span>
            </div>

            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
              <span className="text-[9px] font-black text-purple-700 uppercase tracking-widest block mb-1">{t('completed_label')}</span>
              <span className="text-xl font-black text-purple-900">
                {t('gigs_count', { count: user.completedJobsCount || 0 })}
              </span>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-6 mb-8">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Award size={12} className="text-blue-500" />
                {t('about_member')}
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                "{bio}"
              </p>
            </div>

            {user.phone && (
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Phone size={12} className="text-blue-500" />
                  {t('direct_contact_line')}
                </h4>
                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs font-black text-blue-900 font-mono flex items-center justify-between">
                  <span>{user.phone}</span>
                  <a 
                    href={`tel:${user.phone}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] uppercase tracking-wider hover:bg-blue-700 transition-colors font-sans"
                  >
                    {t('call_direct')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Close / Action button */}
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-sans font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-gray-200"
          >
            {t('close_public_profile')}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
