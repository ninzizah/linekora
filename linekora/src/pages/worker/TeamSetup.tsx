import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Users, UserPlus, UserCheck, ChevronRight,
  ArrowLeft, Loader2, X, CheckCircle2, Copy, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { createTeam, joinTeam, getTeamByUser } from '../../lib/api';

type Choice = 'individual' | 'join' | 'create' | null;

export default function WorkerTeamSetup() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<Choice>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);

  // Create team form
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPhone, setTeamPhone] = useState('');
  const [teamSkill, setTeamSkill] = useState('');
  const [teamLocation, setTeamLocation] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Join team form
  const [teamCode, setTeamCode] = useState('');

  const [createdTeamCode, setCreatedTeamCode] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    getTeamByUser(profile.id).then(m => {
      if (m?.team) setHasTeam(true);
    }).catch(() => {});
  }, [profile?.id]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !teamName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const team = await createTeam({
        name: teamName.trim(),
        userId: profile.id,
        email: teamEmail || undefined,
        phone: teamPhone || undefined,
        mainSkill: teamSkill || undefined,
        location: teamLocation || undefined,
        description: teamDesc || undefined,
      });
      setCreatedTeamCode(team.teamCode);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !teamCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinTeam({ userId: profile.id, teamCode: teamCode.trim().toUpperCase() });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  if (hasTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 text-center">
          <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight mb-2">Already in a Team</h2>
          <p className="text-white/50 text-sm font-sans mb-8">You are already a member of a team.</p>
          <button
            onClick={() => navigate('/dashboard/worker/team')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
          >
            Go to Team Dashboard <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (createdTeamCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 text-center space-y-6">
          <div className="h-16 w-16 bg-green-500/20 text-green-400 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight mb-2">Team Created!</h2>
            <p className="text-white/50 text-sm font-sans">Share this code with your team members:</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-center gap-3">
            <span className="text-white font-mono text-lg font-black tracking-wider">{createdTeamCode}</span>
            <button
              onClick={() => navigator.clipboard.writeText(createdTeamCode)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Copy size={16} className="text-white" />
            </button>
          </div>
          <button
            onClick={() => navigate('/dashboard/worker/team')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
          >
            Go to Team Dashboard <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4 mb-10 mt-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/50">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <span className="font-sans text-2xl font-black tracking-tight text-white">LINEKORA</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12"
      >
        <AnimatePresence mode="wait">
          {!choice && (
            <motion.div key="choose" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="font-sans text-3xl font-extrabold text-white text-center mb-2">{t('how_want_to_work')}</h2>
              <p className="text-center text-white/50 font-sans text-sm mb-10">{t('choose_work_style')}</p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => { setChoice('individual'); navigate('/dashboard'); }}
                  className="flex items-center gap-5 p-6 rounded-2xl border border-white/10 hover:border-green-500 hover:bg-green-500/10 transition-all text-left group"
                >
                  <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-green-600 group-hover:text-white transition-all shrink-0">
                    <UserCheck size={26} />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-white">{t('work_as_individual')}</h3>
                    <p className="font-sans text-sm text-white/40">{t('work_as_individual_desc')}</p>
                  </div>
                  <ChevronRight className="ml-auto text-white/20 group-hover:text-green-400 shrink-0" />
                </button>

                <button
                  onClick={() => setChoice('create')}
                  className="flex items-center gap-5 p-6 rounded-2xl border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group"
                >
                  <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <Users size={26} />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-white">{t('create_worker_team')}</h3>
                    <p className="font-sans text-sm text-white/40">{t('create_worker_team_desc')}</p>
                  </div>
                  <ChevronRight className="ml-auto text-white/20 group-hover:text-blue-400 shrink-0" />
                </button>

                <button
                  onClick={() => setChoice('join')}
                  className="flex items-center gap-5 p-6 rounded-2xl border border-white/10 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
                >
                  <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
                    <UserPlus size={26} />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-white">{t('join_worker_team')}</h3>
                    <p className="font-sans text-sm text-white/40">{t('join_worker_team_desc')}</p>
                  </div>
                  <ChevronRight className="ml-auto text-white/20 group-hover:text-purple-400 shrink-0" />
                </button>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 mt-6 text-white/40 font-sans font-bold text-sm hover:text-white/70 transition-colors"
              >
                {t('skip_for_now')} →
              </button>
            </motion.div>
          )}

          {choice === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setChoice(null)} className="flex items-center gap-2 text-white/40 hover:text-white/70 font-sans font-bold text-xs mb-6 transition-colors">
                <ArrowLeft size={14} /> {t('go_back')}
              </button>
              <h2 className="font-sans text-2xl font-extrabold text-white text-center mb-2">{t('create_your_team')}</h2>
              <p className="text-center text-white/50 font-sans text-sm mb-8">{t('team_details_desc')}</p>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">{t('team_name')}</label>
                  <input type="text" required placeholder="Kigali Construction Team" value={teamName} onChange={e => setTeamName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">{t('team_email_optional')}</label>
                    <input type="email" placeholder="team@linekora.com" value={teamEmail} onChange={e => setTeamEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">{t('team_phone_optional')}</label>
                    <input type="tel" placeholder="+250..." value={teamPhone} onChange={e => setTeamPhone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">{t('main_skill')}</label>
                    <input type="text" placeholder="Construction, Plumbing, etc." value={teamSkill} onChange={e => setTeamSkill(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">{t('location_district')}</label>
                    <input type="text" placeholder="Gasabo, Kigali" value={teamLocation} onChange={e => setTeamLocation(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">{t('team_description_optional')}</label>
                  <textarea rows={3} placeholder="Tell employers about your team..." value={teamDesc} onChange={e => setTeamDesc(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-sans text-white placeholder-white/20 transition-all resize-none" />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center">{error}</div>
                )}

                <button disabled={loading} type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>{t('create_team')} <ChevronRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {choice === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setChoice(null)} className="flex items-center gap-2 text-white/40 hover:text-white/70 font-sans font-bold text-xs mb-6 transition-colors">
                <ArrowLeft size={14} /> {t('go_back')}
              </button>
              <h2 className="font-sans text-2xl font-extrabold text-white text-center mb-2">{t('join_existing_team')}</h2>
              <p className="text-center text-white/50 font-sans text-sm mb-8">{t('enter_team_code_desc')}</p>

              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">{t('team_code')}</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input type="text" required placeholder="TEAM-XXXXXX" value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 outline-none font-sans font-mono text-white text-lg tracking-wider placeholder-white/20 transition-all uppercase" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-sans font-bold border border-red-500/20 text-center">{error}</div>
                )}

                <button disabled={loading || !teamCode.trim()} type="submit"
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-sans font-bold transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <>{t('join_team')} <ChevronRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
