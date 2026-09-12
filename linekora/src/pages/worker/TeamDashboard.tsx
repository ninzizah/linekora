import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, UserPlus, Copy, CheckCircle2, Loader2, Shield,
  Megaphone, Briefcase, Settings, ChevronRight, Star,
  AlertCircle, Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getTeamByUser, getTeam, getTeamStats, TeamMembership } from '../../lib/api';

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'super_leader': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'senior_leader': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'assistant_leader': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

function getRoleLabel(role: string, t: (key: string) => string) {
  switch (role) {
    case 'super_leader': return t('super_leader');
    case 'senior_leader': return t('senior_leader');
    case 'assistant_leader': return t('assistant_leader');
    default: return t('member');
  }
}

export default function TeamDashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [membership, setMembership] = useState<TeamMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [leaderName, setLeaderName] = useState('');

  const isLeader = membership && (
    membership.role === 'super_leader' ||
    membership.role === 'senior_leader' ||
    membership.role === 'assistant_leader'
  );

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    getTeamByUser(profile.id)
      .then(async (m) => {
        if (!m || !m.team) {
          setMembership(null);
          setLoading(false);
          return;
        }
        setMembership(m);
        try {
          const [fullTeam, stats] = await Promise.all([
            getTeam(m.teamId),
            getTeamStats(m.teamId),
          ]);
          const members = fullTeam.memberships || [];
          setMemberCount(stats.memberCount || members.length);
          setActiveJobs(stats.activeJobs || 0);
          setAnnouncementCount(stats.announcementCount || 0);
          const leader = members.find(
            (mem) => mem.role === 'super_leader' || mem.role === 'senior_leader'
          );
          setLeaderName(leader?.user?.displayName || t('unknown'));
        } catch {
          setMemberCount(1);
          setLeaderName(m.user?.displayName || t('unknown'));
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('failed_to_load_team'));
        setLoading(false);
      });
  }, [profile?.id]);

  const handleCopyCode = () => {
    if (membership?.team?.teamCode) {
      navigator.clipboard.writeText(membership.team.teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <AlertCircle size={48} className="mx-auto text-red-300 mb-4" />
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight font-sans">{t('error')}</h3>
            <p className="text-sm text-gray-400 mt-2 font-sans">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-sans font-bold text-sm hover:bg-blue-700 transition-all"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!membership || !membership.team) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-sans mb-2">
              {t('not_in_team')}
            </h3>
            <p className="text-sm text-gray-400 font-sans mb-8 max-w-sm mx-auto">
              {t('not_in_team_desc')}
            </p>
            <Link
              to="/dashboard/worker/team-setup"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-sans font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <UserPlus size={16} />
              {t('join_or_create_team')}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const team = membership.team;

  const stats = [
    {
      icon: Users,
      label: t('members'),
      value: memberCount,
      color: 'bg-blue-600',
    },
    {
      icon: Briefcase,
      label: t('active_jobs'),
      value: activeJobs,
      color: 'bg-green-600',
    },
    {
      icon: Megaphone,
      label: t('announcements'),
      value: announcementCount,
      color: 'bg-purple-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 font-sans tracking-tight uppercase">
              {team.name}
            </h1>
            <p className="text-gray-500 font-sans font-medium mt-1 italic">
              {t('team_dashboard')}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                {t('team_info')}
              </span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('team_name')}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1 font-sans">{team.name}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('team_code')}</span>
              <span className="font-mono text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">{team.teamCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </motion.div>

          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-sans">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Crown size={20} className="text-amber-500" />
            <h2 className="text-xl font-black text-gray-900 font-sans uppercase tracking-tight">{t('team_leader')}</h2>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
              <Crown size={20} />
            </div>
            <div>
              <p className="font-sans font-black text-gray-900">{leaderName}</p>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getRoleBadgeColor(membership.role)}`}>
                {getRoleLabel(membership.role, t)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-gray-400">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold font-sans">{profile?.trustScore || 50}</span>
            </div>
          </div>
        </motion.div>

        {isLeader && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans mb-4">{t('quick_actions')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/dashboard/worker/my-team"
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 hover:border-blue-600 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <UserPlus size={20} />
                  </div>
                  <span className="font-sans font-black text-gray-900 uppercase tracking-tight text-sm">{t('manage_members')}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600" />
              </Link>

              <Link
                to="/dashboard/worker/team-announcements"
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 hover:border-purple-600 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Megaphone size={20} />
                  </div>
                  <span className="font-sans font-black text-gray-900 uppercase tracking-tight text-sm">{t('post_announcement')}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-600" />
              </Link>

              <Link
                to="/dashboard/worker/browse"
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 hover:border-green-600 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <Briefcase size={20} />
                  </div>
                  <span className="font-sans font-black text-gray-900 uppercase tracking-tight text-sm">{t('browse_jobs')}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-600" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
