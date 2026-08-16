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
  status: string;
  createdAt: string;
  job?: Job;
  worker?: Pick<UserProfile, 'id' | 'displayName' | 'trustScore' | 'verificationStatus' | 'phone'>;
}

export const getApplications = (params: { workerId?: string; jobId?: number; employerId?: string }) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString();
  return request<Application[]>(`/applications${qs ? `?${qs}` : ''}`);
};

export const createApplication = (data: { jobId: number; workerId: string }) =>
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
  read: boolean;
  createdAt: string;
}

export const getNotifications = (userId: string) =>
  request<Notification[]>(`/notifications?userId=${userId}`);

export const createNotification = (data: { userId: string; title: string; body: string; type?: string }) =>
  request<Notification>('/notifications', { method: 'POST', body: JSON.stringify(data) });

export const markNotificationRead = (id: number) =>
  request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = (userId: string) =>
  request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH', body: JSON.stringify({ userId }) });

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

export const getMessages = (userId: string) =>
  request<Message[]>(`/messages?userId=${userId}`);

export const sendMessage = (data: { content: string; senderId: string; receiverId: string }) =>
  request<Message>('/messages', { method: 'POST', body: JSON.stringify(data) });

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
