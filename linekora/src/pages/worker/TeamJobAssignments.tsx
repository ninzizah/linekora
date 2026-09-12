import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase, Users, ArrowLeft, Loader2, X, CheckCircle2,
  AlertCircle, MapPin, DollarSign, Clock, UserPlus, Send,
  ChevronRight, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getTeamByUser, getTeam, getApplications, assignMembers, Application, TeamMembership
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

function getStatusColor(status: string) {
  switch (status) {
    case 'accepted': return 'bg-green-50 text-green-600 border-green-200';
    case 'rejected': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-yellow-50 text-yellow-600 border-yellow-200';
  }
}

export default function TeamJobAssignments() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [myRole, setMyRole] = useState('member');
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [teamApplications, setTeamApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [assignLoading, setAssignLoading] = useState(false);

  const isLeader = myRole === 'super_leader' || myRole === 'senior_leader' || myRole === 'assistant_leader';

  const loadData = async () => {
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

      const apps = await getApplications({ workerId: profile.id });
      const teamApps = apps.filter(a => a.applyType === 'team' && a.teamId === membership.teamId);
      setTeamApplications(teamApps);
    } catch {
      setError(t('failed_to_load_team'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [profile?.id]);

  const handleOpenAssign = (app: Application) => {
    setSelectedApp(app);
    try {
      const existing = app.assignedMembers ? JSON.parse(app.assignedMembers) : [];
      setSelectedMembers(new Set(existing));
    } catch {
      setSelectedMembers(new Set());
    }
    setAssignModal(true);
  };

  const toggleMember = (userId: string) => {
    const next = new Set(selectedMembers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedMembers(next);
  };

  const handleAssign = async () => {
    if (!selectedApp) return;
    setAssignLoading(true);
    try {
      await assignMembers(selectedApp.id, Array.from(selectedMembers));
      setAssignModal(false);
      setSelectedApp(null);
      loadData();
    } catch {
      setError(t('failed_to_assign_members'));
    } finally {
      setAssignLoading(false);
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
              {t('job_assignments')}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {teamName} — {teamApplications.length} {t('team_applications_count')}
            </p>
          </div>
          <Link
            to="/dashboard/worker/browse"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Briefcase size={16} />
            {t('browse_jobs')}
          </Link>
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

        {teamApplications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight font-sans mb-2">
              {t('no_team_applications')}
            </h3>
            <p className="text-sm text-gray-400 font-sans mb-6 max-w-md mx-auto">
              {t('no_team_applications_desc')}
            </p>
            <Link
              to="/dashboard/worker/browse"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Briefcase size={16} />
              {t('browse_jobs')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {teamApplications.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-5">
                    <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-gray-900 font-sans tracking-tight">
                          {app.job?.title || t('team_application')}
                        </h3>
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-blue-100">
                          <Users size={10} /> {t('team_application')}
                        </span>
                      </div>
                      <p className="text-gray-500 font-sans font-bold italic text-sm mt-1">
                        {app.job?.employer?.displayName || t('employer')}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {app.job?.location && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                            <MapPin size={10} /> {app.job.location}
                          </span>
                        )}
                        {app.job?.salary && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                            <DollarSign size={10} /> {app.job.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 font-sans uppercase tracking-widest">
                          <Clock size={10} /> {getRelativeTime(app.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(app.status)}`}>
                      {app.status === 'accepted' ? <CheckCircle2 size={12} /> : null}
                      {app.status}
                    </div>
                    {isLeader && (
                      <button
                        onClick={() => handleOpenAssign(app)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                      >
                        <UserPlus size={14} />
                        {t('assign_members')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Assign Members Modal */}
        <AnimatePresence>
          {assignModal && selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { if (!assignLoading) { setAssignModal(false); setSelectedApp(null); } }}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-100 z-10"
              >
                <button
                  onClick={() => { setAssignModal(false); setSelectedApp(null); }}
                  disabled={assignLoading}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight uppercase">{t('assign_members')}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {selectedApp.job?.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.userId)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        selectedMembers.has(member.userId)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        member.role === 'super_leader' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        member.role === 'senior_leader' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        member.role === 'assistant_leader' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                        'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}>
                        <span className="text-sm font-black">{(member.user?.displayName || 'M')[0]}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-sans font-bold text-sm text-gray-900">
                          {member.user?.displayName || t('unknown_member')}
                        </p>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getRoleBadgeColor(member.role)}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedMembers.has(member.userId) && (
                        <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  disabled={assignLoading || selectedMembers.size === 0}
                  onClick={handleAssign}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
                >
                  {assignLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><Send size={16} /> {t('assign_selected', { count: selectedMembers.size })}</>
                  )}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
