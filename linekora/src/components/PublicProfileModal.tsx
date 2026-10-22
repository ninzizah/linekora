import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, MapPin, Star, Phone, Award, CheckCircle2, Briefcase,
  GraduationCap, FileText, ExternalLink, Zap
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getReviews, getPublicProfile, type Review, type PublicProfileDetails } from '../lib/api';
import { openDataUrlInNewTab } from '../lib/filePreview';
import { parsePortfolio, type PortfolioItem } from '../lib/portfolio';
import ImageLightbox from './ImageLightbox';

export interface ExperienceEntry { role: string; company: string; period?: string; desc?: string; }
export interface EducationEntry { degree: string; school: string; }

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
  experience?: string | ExperienceEntry[];
  education?: string | EducationEntry[];
  certificates?: string | string[];
  portfolio?: string | PortfolioItem[];
  cvFile?: string;
  cvFilename?: string;
  rating?: number;
  completedJobsCount?: number;
  avatarUrl?: string;
}

interface PublicProfileModalProps {
  user: PublicProfileUser | null;
  isOpen: boolean;
  onClose: () => void;
}

function parseExperience(raw: unknown): ExperienceEntry[] {
  if (Array.isArray(raw)) return raw as ExperienceEntry[];
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ExperienceEntry[];
  } catch { /* legacy plain-text storage */ }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [head, ...descParts] = line.split('|');
      const desc = descParts.join('|').trim();
      const match = head.match(/^(.+?)\s+@\s+(.+)$/);
      return {
        role: match ? match[1].trim() : head.trim(),
        company: match ? match[2].trim() : '',
        period: '',
        desc,
      };
    });
}

function parseEducation(raw: unknown): EducationEntry[] {
  if (Array.isArray(raw)) return raw as EducationEntry[];
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as EducationEntry[];
  } catch { /* legacy plain-text storage */ }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [degree, ...schoolParts] = line.split('@');
      return { degree: degree.trim(), school: schoolParts.join('@').trim() };
    });
}

function parseStrings(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch { /* legacy comma-separated storage */ }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
      {icon}
      {label}
    </h4>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <span className="text-gray-300 mb-2">{icon}</span>
      <p className="text-xs font-bold text-gray-400 font-sans">{text}</p>
    </div>
  );
}

export default function PublicProfileModal({ user, isOpen, onClose }: PublicProfileModalProps) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [details, setDetails] = useState<PublicProfileDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let cancelled = false;
    setReviewsLoading(true);
    setDetailsLoading(true);
    getReviews(String(user.id))
      .then((data) => { if (!cancelled) setReviews(data); })
      .catch((err) => console.error('Failed to load reviews', err))
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    getPublicProfile(String(user.id))
      .then((data) => { if (!cancelled) setDetails(data); })
      .catch((err) => console.error('Failed to load public profile', err))
      .finally(() => { if (!cancelled) setDetailsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen) {
      setDetails(null);
      setReviews([]);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const displayName = details?.displayName || user.displayName || user.name || t('user_profile');
  const roleName = user.role || t('member');
  const verificationStatus = details?.verificationStatus || user.verificationStatus;
  const isVerified = verificationStatus === 'verified' || user.verified;
  const trustScore = details?.trustScore ?? user.trustScore ?? 0;
  const location = details?.location || user.location || '';
  const tier = details?.tier || user.tier || t('standard_tier');
  const bio = details?.bio || user.bio || '';
  const phone = details?.phone || user.phone;
  const avatarUrl = details?.avatarUrl || user.avatarUrl;
  const rating = details?.avgRating ?? user.rating;
  const completedJobsCount = details?.completedJobsCount ?? user.completedJobsCount ?? 0;
  const skills = parseStrings(details?.skills ?? user.skills);
  const experienceList = parseExperience(details?.experience ?? user.experience);
  const educationList = parseEducation(details?.education ?? user.education);
  const certificatesList = parseStrings(details?.certificates ?? user.certificates);
  const portfolioList = parsePortfolio(details?.portfolio ?? user.portfolio);
  const cvFile = details?.cvFile || user.cvFile;
  const cvName = details?.cvFilename || user.cvFilename || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
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
          className="relative w-full max-w-2xl bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto font-sans"
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
              <button
                type="button"
                onClick={() => avatarUrl && setShowAvatarViewer(true)}
                className={`h-24 w-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200 border-4 border-white overflow-hidden group ${avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                aria-label={avatarUrl ? t('view_photo') : displayName}
                title={avatarUrl ? t('view_photo') : undefined}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <span>{initial}</span>
                )}
              </button>
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
              {roleName} • {tier}
            </p>

            <p className="text-xs text-gray-500 flex items-center gap-1 font-bold">
              <MapPin size={14} className="text-red-400" />
              {location}
            </p>

            {detailsLoading && (
              <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                <span className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                {t('loading')}
              </div>
            )}
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
                {rating ? `${rating} / 5.0` : t('not_applicable')}
              </span>
            </div>

            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
              <span className="text-[9px] font-black text-purple-700 uppercase tracking-widest block mb-1">{t('completed_label')}</span>
              <span className="text-xl font-black text-purple-900">
                {t('gigs_count', { count: completedJobsCount })}
              </span>
            </div>
          </div>

          {/* Professional Bio */}
          <div className="mb-6">
            <SectionHeader icon={<Award size={12} className="text-blue-500" />} label={t('professional_bio')} />
            <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
              {bio || t('no_bio_provided')}
            </p>
          </div>

          {/* Main Skills */}
          <div className="mb-6">
            <SectionHeader icon={<Zap size={12} className="text-blue-500" />} label={t('main_skills')} />
            {skills.length === 0 ? (
              <EmptyState icon={<Zap size={22} />} text={t('no_skills')} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span key={i} className="px-3.5 py-1.5 bg-gray-50 text-gray-700 rounded-xl font-sans font-bold text-xs border border-gray-100 hover:border-blue-200 hover:bg-white transition-all">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience */}
          <div className="mb-6">
            <SectionHeader icon={<Briefcase size={12} className="text-blue-500" />} label={t('work_experience')} />
            {experienceList.length === 0 ? (
              <EmptyState icon={<Briefcase size={22} />} text={t('no_experience_added')} />
            ) : (
              <div className="space-y-4">
                {experienceList.map((exp, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-blue-50 last:border-0 pb-4 last:pb-0">
                    <div className="absolute left-[-7px] top-0 h-3.5 w-3.5 rounded-full bg-blue-600 border-[3px] border-white shadow-sm" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1">
                      <h3 className="font-sans font-black text-gray-900 text-sm">{exp.role}</h3>
                      {exp.period && (
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest self-start">
                          {exp.period}
                        </span>
                      )}
                    </div>
                    {exp.company && <p className="text-blue-600 font-bold font-sans text-xs mb-1">{exp.company}</p>}
                    {exp.desc && <p className="text-gray-500 font-sans text-xs font-medium">{exp.desc}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="mb-6">
            <SectionHeader icon={<GraduationCap size={12} className="text-blue-500" />} label={t('education')} />
            {educationList.length === 0 ? (
              <EmptyState icon={<GraduationCap size={22} />} text={t('no_education_added')} />
            ) : (
              <div className="space-y-3">
                {educationList.map((edu, i) => (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
                    <div className="h-9 w-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <GraduationCap size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 font-sans leading-snug break-words">{edu.degree}</p>
                      {edu.school && <p className="text-xs text-gray-500 font-sans font-medium break-words">{edu.school}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="mb-6">
            <SectionHeader icon={<CheckCircle2 size={12} className="text-blue-500" />} label={t('certifications')} />
            {certificatesList.length === 0 ? (
              <EmptyState icon={<Award size={22} />} text={t('no_certificates_added')} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {certificatesList.map((cert, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-sans font-bold text-xs border border-blue-100">
                    <Award size={12} /> {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Project Portfolio */}
          <div className="mb-6">
            <SectionHeader icon={<FileText size={12} className="text-blue-500" />} label={t('project_portfolio')} />
            {portfolioList.length === 0 ? (
              <EmptyState icon={<FileText size={22} />} text={t('no_portfolio_added')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {portfolioList.map((item) => (
                  <div key={item.id} className="group bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-600 overflow-hidden transition-all">
                    <div className="aspect-video bg-gray-200 relative flex items-center justify-center overflow-hidden">
                      {item.photos[0] ? (
                        <img
                          src={item.photos[0].dataUrl}
                          alt={item.title}
                          onClick={() => openDataUrlInNewTab(item.photos[0].dataUrl)}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      ) : (
                        <FileText size={26} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      )}
                      {item.photos.length > 0 && (
                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          {t('portfolio_photos_count', { count: item.photos.length })}
                        </span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <p className="font-sans font-black text-gray-900 text-xs mb-2.5 break-words">{item.title}</p>
                      {(item.photos.length > 1 || item.docs.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {item.photos.slice(1).map((photo, pi) => (
                            <img
                              key={`ph-${pi}`}
                              src={photo.dataUrl}
                              alt={item.title}
                              onClick={() => openDataUrlInNewTab(photo.dataUrl)}
                              className="h-9 w-9 rounded-lg object-cover border border-gray-200 hover:border-blue-600 transition-all cursor-pointer"
                            />
                          ))}
                          {item.docs.map((doc, di) => (
                            <button
                              key={`doc-${di}`}
                              onClick={() => openDataUrlInNewTab(doc.dataUrl)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              <FileText size={10} />
                              {t('view_document')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CV / Resume */}
          <div className="mb-6">
            <SectionHeader icon={<FileText size={12} className="text-blue-500" />} label={t('cv_resume')} />
            {cvFile ? (
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 font-sans truncate">{cvName || t('cv_resume')}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('cv_resume')}</p>
                  </div>
                </div>
                <button
                  onClick={() => openDataUrlInNewTab(cvFile)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <ExternalLink size={11} />
                  {t('view_cv')}
                </button>
              </div>
            ) : (
              <EmptyState icon={<FileText size={22} />} text={t('no_cv_uploaded')} />
            )}
          </div>

          {/* Direct Contact Line */}
          {phone && (
            <div className="mb-6">
              <SectionHeader icon={<Phone size={12} className="text-blue-500" />} label={t('direct_contact_line')} />
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs font-black text-blue-900 font-mono flex items-center justify-between">
                <span>{phone}</span>
                <a 
                  href={`tel:${phone}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] uppercase tracking-wider hover:bg-blue-700 transition-colors font-sans"
                >
                  {t('call_direct')}
                </a>
              </div>
            </div>
          )}

          {/* Ratings & Reviews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Star size={12} className="text-yellow-500" />
                {t('reviews_reputation')}
              </h4>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {reviews.length > 0
                  ? `${(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5.0`
                  : t('no_reviews_yet')}
              </span>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 font-sans">{t('no_reviews_yet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-sans font-black text-gray-900 text-xs uppercase tracking-tight">
                        {r.reviewer?.displayName || t('employer')}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            className={n <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 font-sans italic">"{r.comment}"</p>}
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
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

      <ImageLightbox
        src={avatarUrl}
        alt={displayName}
        isOpen={showAvatarViewer}
        onClose={() => setShowAvatarViewer(false)}
      />
    </>
  );
}
