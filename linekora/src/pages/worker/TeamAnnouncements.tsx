import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Megaphone, ArrowLeft, Loader2, X, Send,
  AlertCircle, FileText, User, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getTeamByUser, getTeamAnnouncements, createAnnouncement,
  TeamAnnouncement
} from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

function getRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ''; }
}

export default function TeamAnnouncements() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [teamId, setTeamId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>('member');
  const [teamName, setTeamName] = useState('');
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const isLeader = myRole === 'super_leader' || myRole === 'senior_leader' || myRole === 'assistant_leader';

  const loadAnnouncements = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const membership = await getTeamByUser(profile.id);
      if (!membership || !membership.team) {
        setTeamId(null);
        setLoading(false);
        return;
      }
      setTeamId(membership.teamId);
      setMyRole(membership.role);
      setTeamName(membership.team.name);

      const data = await getTeamAnnouncements(membership.teamId);
      setAnnouncements(data);
    } catch {
      setError(t('failed_to_load_announcements'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [profile?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !teamId || !formTitle.trim() || !formBody.trim()) return;
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);
    try {
      await createAnnouncement({
        teamId,
        title: formTitle.trim(),
        body: formBody.trim(),
        authorId: profile.id,
      });
      setFormTitle('');
      setFormBody('');
      setFormSuccess(true);
      setShowForm(false);
      loadAnnouncements();
      setTimeout(() => setFormSuccess(false), 4000);
    } catch (err: any) {
      setFormError(err.message || t('failed_to_create_announcement'));
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">{t('loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!teamId) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-sans mb-2">
              {t('not_in_team')}
            </h3>
            <p className="text-sm text-gray-400 font-sans mb-6">{t('need_team_for_announcements')}</p>
            <Link
              to="/dashboard/worker/team-setup"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              {t('join_or_create_team')}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button
              onClick={() => navigate('/dashboard/worker/team')}
              className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest font-sans mb-3 transition-colors"
            >
              <ArrowLeft size={14} />
              {t('back_to_team')}
            </button>
            <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight uppercase">
              {t('announcements')}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {teamName} — {announcements.length} {t('total')}
            </p>
          </div>
          {isLeader && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all"
            >
              <Megaphone size={16} />
              {t('new_announcement')}
            </button>
          )}
        </header>

        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
          >
            <span className="text-green-600 text-lg">✓</span>
            <p className="text-sm font-sans font-bold text-green-700">{t('announcement_posted')}</p>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm font-sans font-bold text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={16} />
            </button>
          </div>
        )}

        {announcements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight font-sans mb-2">
              {t('no_announcements_yet')}
            </h3>
            <p className="text-sm text-gray-400 font-sans">{t('announcements_will_appear_here')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                      <Megaphone size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight">{ann.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 font-sans">
                          <User size={10} />
                          {ann.authorId === profile?.id ? t('you') : ann.authorId}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 font-sans">
                          <Calendar size={10} />
                          {getRelativeTime(ann.createdAt) || t('recently')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-sans font-medium leading-relaxed pl-[52px]">
                  {ann.body}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { if (!formLoading) { setShowForm(false); setFormError(null); } }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
              >
                <button
                  onClick={() => { setShowForm(false); setFormError(null); }}
                  disabled={formLoading}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('new_announcement')}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('post_to_team')}</p>
                  </div>
                </div>
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans block mb-2">{t('title')}</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={t('announcement_title_placeholder')}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans block mb-2">{t('body')}</label>
                    <textarea
                      required
                      rows={5}
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder={t('announcement_body_placeholder')}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                    />
                  </div>
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-sans font-bold text-red-600 text-center">{formError}</div>
                  )}
                  <button
                    disabled={formLoading || !formTitle.trim() || !formBody.trim()}
                    type="submit"
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 disabled:opacity-60"
                  >
                    {formLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> {t('post_announcement')}</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
