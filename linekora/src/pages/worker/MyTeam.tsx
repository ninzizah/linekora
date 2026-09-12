import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, UserPlus, UserMinus, Loader2, ArrowLeft,
  Shield, Mail, Phone, Calendar, Star, X,
  CheckCircle2, AlertCircle, Send, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getTeamByUser, getTeam, inviteMember, removeMember,
  getTeamInvitations, TeamMembership, TeamInvitation
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

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'super_leader': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'senior_leader': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'assistant_leader': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'super_leader': return Crown;
    case 'senior_leader': return Shield;
    case 'assistant_leader': return Shield;
    default: return Users;
  }
}

export default function MyTeam() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>('member');
  const [teamName, setTeamName] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<TeamMembership | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const isLeader = myRole === 'super_leader' || myRole === 'senior_leader' || myRole === 'assistant_leader';

  const loadTeam = async () => {
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

      const fullTeam = await getTeam(membership.teamId);
      setMembers(fullTeam.memberships || []);

      try {
        const invs = await getTeamInvitations(membership.teamId);
        setInvitations(invs.filter((inv) => inv.status === 'pending'));
      } catch {
        setInvitations([]);
      }
    } catch {
      setError(t('failed_to_load_team'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [profile?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !teamId || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      await inviteMember({
        teamId,
        email: inviteEmail.trim(),
        phone: invitePhone || undefined,
        role: inviteRole,
        invitedBy: profile.id,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePhone('');
      setInviteRole('member');
      loadTeam();
    } catch (err: any) {
      setInviteError(err.message || t('failed_to_invite'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!teamId || !removeTarget) return;
    setRemoveLoading(true);
    try {
      await removeMember(teamId, removeTarget.userId);
      setRemoveTarget(null);
      loadTeam();
    } catch (err: any) {
      setError(err.message || t('failed_to_remove_member'));
    } finally {
      setRemoveLoading(false);
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
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-sans mb-2">
              {t('not_in_team')}
            </h3>
            <Link
              to="/dashboard/worker/team-setup"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4"
            >
              <UserPlus size={16} />
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
              {teamName}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {members.length} {t('members')}
            </p>
          </div>
          {isLeader && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              <UserPlus size={16} />
              {t('invite_member')}
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm font-sans font-bold text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="space-y-4 mb-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">{t('team_members')}</p>
          {members.map((member, i) => {
            const RoleIcon = getRoleIcon(member.role);
            const isCurrentUser = member.userId === profile?.id;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    member.role === 'super_leader' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    member.role === 'senior_leader' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    member.role === 'assistant_leader' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                    'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}>
                    <RoleIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans font-black text-gray-900 text-base">
                        {member.user?.displayName || t('unknown_member')}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                          {t('you')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getRoleBadgeColor(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 font-sans">
                        <Calendar size={10} />
                        {getRelativeTime(member.joinedAt) || t('recently')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold font-sans text-gray-700">{member.user?.trustScore || 50}</span>
                  </div>
                  {isLeader && !isCurrentUser && (
                    <button
                      onClick={() => setRemoveTarget(member)}
                      className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-4">{t('pending_invitations')}</p>
            <div className="space-y-3">
              {invitations.map((inv, i) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="font-sans font-bold text-gray-900 text-sm">{inv.email}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getRoleBadgeColor(inv.role)}`}>
                        {inv.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-widest">{t('pending')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowInviteModal(false); setInviteError(null); }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
              >
                <button
                  onClick={() => { setShowInviteModal(false); setInviteError(null); }}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50"
                >
                  <X size={20} />
                </button>
                <h2 className="text-4xl font-black text-gray-900 font-sans tracking-tight uppercase mb-2">{t('invite_member')}</h2>
                <p className="text-gray-500 font-sans text-sm mb-8">{t('invite_member_desc')}</p>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans block mb-2">{t('email_address')}</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="worker@example.com"
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans block mb-2">{t('phone_optional')}</label>
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      placeholder="+250..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans block mb-2">{t('role')}</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 font-sans font-bold text-sm outline-none focus:border-blue-600 transition-all"
                    >
                      <option value="member">{t('member')}</option>
                      <option value="assistant_leader">{t('assistant_leader')}</option>
                      <option value="senior_leader">{t('senior_leader')}</option>
                    </select>
                  </div>
                  {inviteError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-sans font-bold text-red-600 text-center">{inviteError}</div>
                  )}
                  <button
                    disabled={inviteLoading}
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
                  >
                    {inviteLoading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> {t('send_invitation')}</>}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {removeTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { if (!removeLoading) setRemoveTarget(null); }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 z-10 text-center"
              >
                <div className="h-16 w-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 border border-red-100 mx-auto mb-6">
                  <UserMinus size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight mb-2">{t('remove_member')}</h3>
                <p className="text-sm text-gray-500 font-sans mb-2">
                  {t('confirm_remove_member', { name: removeTarget.user?.displayName || t('this_member') })}
                </p>
                <p className="text-xs text-gray-400 font-sans italic mb-8">{t('remove_member_warning')}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRemoveTarget(null)}
                    disabled={removeLoading}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={removeLoading}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-200 disabled:opacity-60"
                  >
                    {removeLoading ? <Loader2 size={16} className="animate-spin" /> : t('remove')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
