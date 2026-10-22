import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Home,
  Loader2,
  MapPin,
  Palette,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
} from 'lucide-react';
import { getWorkers, type WorkerDirectoryEntry } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import PublicProfileModal, { type PublicProfileUser } from './PublicProfileModal';

interface CategoryConfig {
  key: string;
  icon: typeof Building2;
  keywords: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'category_construction',
    icon: Building2,
    keywords: ['construction', 'builder', 'mason', 'macon', 'concrete', 'cement', 'steel', 'site', 'ubwubatsi', 'chantier', 'fundi'],
  },
  {
    key: 'category_domestic_help',
    icon: Home,
    keywords: ['clean', 'menage', 'housekeep', 'house', 'nanny', 'babysit', 'childcare', 'laundry', 'garden', 'jardin', 'domestic', 'umukozi', 'ubufasha'],
  },
  {
    key: 'category_mechanical',
    icon: Wrench,
    keywords: ['mechanic', 'mecanic', 'mechanical', 'auto', 'car', 'vehicle', 'engine', 'repair', 'maintenance', 'welder', 'welding', 'soud', 'technician', 'technicien', 'electric', 'plumb'],
  },
  {
    key: 'category_security',
    icon: ShieldCheck,
    keywords: ['security', 'guard', 'gardien', 'surveillance', 'safety', 'umutekano'],
  },
  {
    key: 'category_logistics',
    icon: Truck,
    keywords: ['driver', 'driving', 'chauffeur', 'delivery', 'livraison', 'logistics', 'transport', 'warehouse', 'mover', 'moving', 'bike', 'moto', 'truck'],
  },
  {
    key: 'category_creative',
    icon: Palette,
    keywords: ['design', 'graphic', 'creative', 'artist', 'art', 'music', 'photo', 'video', 'content', 'writer', 'social media', 'marketing', 'tailor', 'coutur', 'sewing'],
  },
  {
    key: 'category_it_tech',
    icon: Cpu,
    keywords: ['software', 'developer', 'web', 'programming', 'computer', 'tech', 'data', 'network', 'ict', 'ikoranabuhanga'],
  },
  {
    key: 'category_hospitality',
    icon: UtensilsCrossed,
    keywords: ['hospitality', 'hotel', 'restaurant', 'waiter', 'waitress', 'barista', 'receptionist', 'tourism', 'cook', 'chef', 'cuisin'],
  },
];

const ROLE_RULES: { keywords: string[]; title: string }[] = [
  { keywords: ['plumb'], title: 'Plumber' },
  { keywords: ['electric'], title: 'Electrician' },
  { keywords: ['driver', 'driving', 'chauffeur', 'delivery'], title: 'Driver' },
  { keywords: ['mechanic', 'mecanic', 'auto'], title: 'Mechanic' },
  { keywords: ['technician', 'technicien', 'maintenance'], title: 'Technician' },
  { keywords: ['clean', 'menage', 'housekeep'], title: 'Cleaner' },
  { keywords: ['garden', 'jardin'], title: 'Gardener' },
  { keywords: ['nanny', 'babysit', 'childcare'], title: 'Nanny' },
  { keywords: ['cook', 'chef', 'cuisin'], title: 'Cook' },
  { keywords: ['wait', 'barista', 'serv'], title: 'Waiter / Waitress' },
  { keywords: ['security', 'guard', 'gardien'], title: 'Security Guard' },
  { keywords: ['software', 'developer', 'web', 'program'], title: 'Software Developer' },
  { keywords: ['design', 'graphic'], title: 'Designer' },
  { keywords: ['carpenter', 'menuiser', 'wood'], title: 'Carpenter' },
  { keywords: ['mason', 'macon', 'builder', 'construction'], title: 'Mason / Builder' },
  { keywords: ['painter', 'paint', 'peintre'], title: 'Painter' },
  { keywords: ['welder', 'weld', 'soud'], title: 'Welder' },
  { keywords: ['tailor', 'sewing', 'coutur'], title: 'Tailor' },
  { keywords: ['account', 'finance'], title: 'Accountant' },
];

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  avatarUrl?: string;
  skills: string[];
  rating: number;
  jobs: number;
  verified: boolean;
  trustScore: number;
  categories: string[];
  bio?: string;
}

const parseList = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
  } catch {
    // Legacy comma-separated values
  }
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeText = (value?: string | null): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const deriveTitle = (skills: string[], experience?: string | null, bio?: string | null, fallback?: string): string => {
  const sources = [
    normalizeText(skills.join(' ')),
    normalizeText(experience),
    normalizeText(bio),
  ];

  for (const source of sources) {
    if (!source) continue;
    const rule = ROLE_RULES.find((entry) => entry.keywords.some((keyword) => source.includes(keyword)));
    if (rule) return rule.title;
  }

  const firstSkill = skills.find((skill) => skill.trim().length > 1);
  if (firstSkill) return firstSkill.trim();
  return fallback || '';
};

const resolveCategories = (candidate: Candidate): string[] => {
  const corpus = normalizeText([candidate.bio, candidate.skills.join(' ')].join(' '));
  return CATEGORIES.filter((category) =>
    category.keywords.some((keyword) => corpus.includes(keyword))
  ).map((category) => category.key);
};

function CandidateAvatar({ candidate }: { candidate: Candidate }) {
  const [failed, setFailed] = useState(false);
  const initials = candidate.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative h-14 w-14 rounded-2xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center text-blue-600 font-black text-lg shrink-0">
      {candidate.avatarUrl && !failed ? (
        <img
          src={candidate.avatarUrl}
          alt={candidate.name}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
      {candidate.verified && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-md p-0.5 border-2 border-white">
          <CheckCircle2 size={9} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

interface CandidateShowcaseProps {
  className?: string;
  limit?: number;
}

export default function CandidateShowcase({ className = '', limit = 8 }: CandidateShowcaseProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingProfile, setViewingProfile] = useState<PublicProfileUser | null>(null);

  const browsePath = profile?.role === 'EMPLOYER' ? '/dashboard/employer/browse' : '/dashboard/company/browse';

  useEffect(() => {
    let cancelled = false;

    const loadCandidates = async () => {
      setLoading(true);
      try {
        const workers = await getWorkers();
        if (cancelled) return;

        const mapped = workers
          .filter((worker): worker is WorkerDirectoryEntry => worker.role === 'WORKER')
          .map((worker) => {
            const skills = parseList(worker.skills);
            const fallbackTitle = t('professional_worker');
            const candidate: Candidate = {
              id: String(worker.id || ''),
              name: worker.displayName?.trim() || t('professional_worker'),
              title: deriveTitle(skills, worker.experience, worker.bio, fallbackTitle),
              location: worker.location?.trim() || '—',
              avatarUrl: worker.avatarUrl,
              skills,
              rating: worker.avgRating ?? 0,
              jobs: worker.completedJobsCount ?? 0,
              verified: worker.verificationStatus === 'verified',
              trustScore: worker.trustScore ?? 0,
              categories: [],
              bio: worker.bio || undefined,
            };
            candidate.categories = resolveCategories(candidate);
            return candidate;
          })
          .filter((candidate) => candidate.id)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
            return b.jobs - a.jobs;
          });

        setCandidates(mapped);
      } catch (err) {
        console.error('Failed to load candidates for dashboard', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesCategory = selectedCategory === 'all' || candidate.categories.includes(selectedCategory);
      if (!matchesCategory) return false;

      if (!query) return true;
      return (
        candidate.name.toLowerCase().includes(query) ||
        candidate.title.toLowerCase().includes(query) ||
        candidate.location.toLowerCase().includes(query) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(query))
      );
    });
  }, [candidates, search, selectedCategory]);

  const visible = filtered.slice(0, limit);
  const categoryCount = (key: string) =>
    key === 'all'
      ? candidates.length
      : candidates.filter((candidate) => candidate.categories.includes(key)).length;

  return (
    <section className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 font-sans uppercase tracking-tight flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            {t('candidates_title')}
          </h2>
          <p className="text-xs text-gray-500 font-sans font-medium mt-1.5">{t('candidates_subtitle')}</p>
        </div>
        <Link
          to={browsePath}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 shrink-0"
        >
          {t('candidates_view_all')}
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('candidates_search_placeholder')}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-blue-600 outline-none font-sans font-semibold text-xs transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
        {[{ key: 'all', label: t('all_categories'), icon: Users }, ...CATEGORIES.map((category) => ({
          key: category.key,
          label: t(category.key),
          icon: category.icon,
        }))].map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.key;
          const count = categoryCount(category.key);
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <Icon size={13} />
              {category.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-white/20' : 'bg-white text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 size={28} className="animate-spin text-blue-600 mb-3" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('candidates_loading')}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-3">
            <Users size={26} />
          </div>
          <p className="text-sm font-black text-gray-800 font-sans uppercase tracking-wide">{t('candidates_empty')}</p>
          <Link
            to={browsePath}
            className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {t('candidates_browse_more')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {visible.map((candidate, index) => (
            <motion.button
              key={candidate.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() =>
                setViewingProfile({
                  id: candidate.id,
                  name: candidate.name,
                  displayName: candidate.name,
                  role: candidate.title,
                  location: candidate.location,
                  trustScore: candidate.trustScore,
                  verificationStatus: candidate.verified ? 'verified' : 'unverified',
                  rating: candidate.rating,
                  completedJobsCount: candidate.jobs,
                  avatarUrl: candidate.avatarUrl,
                  bio: candidate.bio,
                  skills: candidate.skills,
                })
              }
              className="text-left bg-gray-50/60 hover:bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <CandidateAvatar candidate={candidate} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-gray-900 font-sans truncate flex items-center gap-1.5">
                    {candidate.name}
                  </h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider truncate mt-0.5">
                    {candidate.title}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 font-sans flex items-center gap-1 mt-1 truncate">
                    <MapPin size={10} className="shrink-0" />
                    {candidate.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3 min-h-[24px]">
                {candidate.skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-white rounded-md text-[9px] font-bold text-gray-500 border border-gray-100">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 3 && (
                  <span className="px-2 py-0.5 bg-white rounded-md text-[9px] font-bold text-gray-400 border border-gray-100">
                    +{candidate.skills.length - 3}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-yellow-500 text-[10px] font-black">
                    <Star size={10} fill="currentColor" />
                    {candidate.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-0.5 text-gray-400 text-[9px] font-black uppercase tracking-wider">
                    <Zap size={10} />
                    {candidate.trustScore}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-0.5">
                  {t('view_profile')}
                  <ChevronRight size={11} />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <PublicProfileModal
        user={viewingProfile}
        isOpen={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
      />
    </section>
  );
}
