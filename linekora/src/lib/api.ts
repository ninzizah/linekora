/**
 * Linekora API Service
 * Central place for all HTTP calls to our Express/PostgreSQL backend.
 */

const getApiBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // If we are testing on a mobile phone / local network device, use the current page's hostname
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return envUrl || 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  verifiedWorkers: number;
  verifiedCompanies: number;
  pendingVerifications: number;
  activeJobs: number;
  completedHires: number;
}

export const getStats = () => request<PlatformStats>('/stats');

// ─── USERS ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: 'WORKER' | 'COMPANY' | 'EMPLOYER' | 'ADMIN';
  phone?: string;
  location?: string;
  trustScore: number;
  tier: string;
  verificationStatus: string;
  verificationData?: string | null;
  avatarUrl?: string;
  createdAt: string;
}

export const getUser = (firebaseUid: string) =>
  request<UserProfile>(`/users/${firebaseUid}`);

export const upsertUser = (data: Partial<UserProfile>) =>
  request<UserProfile>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateUser = (id: string, data: Partial<UserProfile>) =>
  request<UserProfile>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteUserRecord = (id: string) =>
  request<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE',
  });

export const getUsers = () => request<UserProfile[]>('/users');

// ─── JOBS ─────────────────────────────────────────────────────────────────────

export interface Job {
  id: number;
  title: string;
  description: string;
  salary: string;
  location: string;
  category?: string;
  urgent: boolean;
  status: string;
  employerId: string;
  deadline?: string;
  phone?: string;
  jobType?: string;
  requirements?: string;
  photos?: string;
  workerType?: string;
  employer?: Pick<UserProfile, 'id' | 'displayName' | 'email' | 'phone'>;
  createdAt: string;
}

export const getJobs = (params?: { urgent?: boolean; category?: string; status?: string; employerId?: string; includeExpired?: boolean }) => {
  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  return request<Job[]>(`/jobs${qs ? `?${qs}` : ''}`);
};

export const createJob = (data: Omit<Job, 'id' | 'createdAt' | 'employer'>) =>
  request<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) });

export const updateJob = (id: number, data: Partial<Job>) =>
  request<Job>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteJob = (id: number) =>
  request<{ success: boolean }>(`/jobs/${id}`, { method: 'DELETE' });

export const applyToJob = (jobId: number, workerId: string) =>
  request<any>(`/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify({ workerId }) });

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────

export interface Application {
  id: number;
  jobId: number;
  workerId: string;
  teamId?: string | null;
  applyType: string;
  status: string;
  assignedMembers?: string | null;
  createdAt: string;
  job?: Job;
  worker?: Pick<UserProfile, 'id' | 'displayName' | 'trustScore' | 'verificationStatus' | 'phone'>;
  team?: { id: string; name: string; teamCode: string } | null;
}

export const getApplications = (params: { workerId?: string; jobId?: number; employerId?: string }) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  return request<Application[]>(`/applications${qs ? `?${qs}` : ''}`);
};

export const createApplication = (data: { jobId: number; workerId: string; teamId?: string; applyType?: string }) =>
  request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) });

export const updateApplication = (id: number, data: { status: string }) =>
  request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteApplication = (id: number) =>
  request<{ success: boolean }>(`/applications/${id}`, { method: 'DELETE' });

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export const getNotifications = (userId: string) =>
  request<Notification[]>(`/notifications?userId=${userId}`);

export const createNotification = (data: { userId: string; title: string; body: string; type?: string; link?: string; linkTarget?: string }) =>
  request<Notification>('/notifications', { method: 'POST', body: JSON.stringify(data) });

export const markNotificationRead = (id: number) =>
  request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = (userId: string) =>
  request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH', body: JSON.stringify({ userId }) });

export const deleteNotification = (id: number) =>
  request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' });

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  content: string;
  read: boolean;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender?: { id: string; displayName: string };
  receiver?: { id: string; displayName: string };
}

export interface Conversation {
  peer: { id: string; displayName: string; role: string; avatarUrl?: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export const getMessages = (userId: string, peerId?: string) => {
  const qs = new URLSearchParams({ userId });
  if (peerId) qs.set('peerId', peerId);
  return request<Message[]>(`/messages?${qs.toString()}`);
};

export const getConversations = (userId: string) =>
  request<Conversation[]>(`/conversations/${userId}`);

export const sendMessage = (data: { content: string; senderId: string; receiverId: string }) =>
  request<Message>('/messages', { method: 'POST', body: JSON.stringify(data) });

export const markMessagesRead = (userId: string, peerId: string) =>
  request<{ success: boolean }>('/messages/read', { method: 'PATCH', body: JSON.stringify({ userId, peerId }) });

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  reviewerId: string;
  targetId: string;
  createdAt: string;
  reviewer?: { displayName: string; verificationStatus: string };
}

export const getReviews = (targetId: string) =>
  request<Review[]>(`/reviews/${targetId}`);

export const createReview = (data: { rating: number; comment?: string; reviewerId: string; targetId: string }) =>
  request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) });

// ─── VERIFICATION ─────────────────────────────────────────────────────────────

export interface VerificationData {
  nationalId?: string;
  frontId?: string;
  backId?: string;
  selfie?: string;
  tinNumber?: string;
  certFile?: string;
  certFileName?: string;
  sector?: string;
  cell?: string;
  address?: string;
  website?: string;
  selectedTier?: string;
  date?: string;
}

export interface VerificationSubmission {
  id: string;
  firebaseUid: string;
  displayName: string;
  email: string;
  role: string;
  verificationStatus: string;
  verificationData: VerificationData | null;
  trustScore: number;
  tier: string;
  createdAt: string;
}

export const saveVerificationDocs = (userId: string, data: VerificationData) =>
  request<{ success: boolean; user: UserProfile }>('/verification/' + userId, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getVerificationDocs = (userId: string) =>
  request<VerificationSubmission>('/verification/' + userId);

export const getPendingVerifications = () =>
  request<VerificationSubmission[]>('/verification');

// ─── TEAMS ──────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  teamCode: string;
  name: string;
  email?: string;
  phone?: string;
  mainSkill?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  user?: Pick<UserProfile, 'id' | 'displayName' | 'avatarUrl' | 'trustScore' | 'verificationStatus'>;
  team?: Team;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  invitedBy: string;
  createdAt: string;
  team?: Team;
}

export interface TeamAnnouncement {
  id: string;
  teamId: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
}

export const createTeam = (data: { name: string; userId: string; email?: string; phone?: string; mainSkill?: string; location?: string; description?: string; logoUrl?: string }) =>
  request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) });

export const getTeam = (teamId: string) =>
  request<Team & { memberships: TeamMembership[] }>(`/teams/${teamId}`);

export const getTeamByUser = (userId: string) =>
  request<TeamMembership | null>(`/teams/user/${userId}`);

export const joinTeam = (data: { userId: string; teamCode: string; role?: string }) =>
  request<TeamMembership>('/teams/join', { method: 'POST', body: JSON.stringify(data) });

export const removeMember = (teamId: string, userId: string) =>
  request<{ success: boolean }>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });

export const inviteMember = (data: { teamId: string; email: string; phone?: string; role: string; invitedBy: string }) =>
  request<TeamInvitation>('/teams/invite', { method: 'POST', body: JSON.stringify(data) });

export const getTeamInvitations = (teamId: string) =>
  request<TeamInvitation[]>(`/teams/${teamId}/invitations`);

export const acceptInvitation = (invitationId: string) =>
  request<TeamMembership>(`/teams/invitations/${invitationId}/accept`, { method: 'PATCH' });

export const createAnnouncement = (data: { teamId: string; title: string; body: string; authorId: string }) =>
  request<TeamAnnouncement>('/teams/announcements', { method: 'POST', body: JSON.stringify(data) });

export const getTeamAnnouncements = (teamId: string) =>
  request<TeamAnnouncement[]>(`/teams/${teamId}/announcements`);

export const getTeamStats = (teamId: string) =>
  request<{ memberCount: number; activeJobs: number; announcementCount: number }>(`/teams/${teamId}/stats`);

export const assignMembers = (applicationId: number, assignedMembers: string[]) =>
  request<Application>(`/applications/${applicationId}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedMembers }) });
