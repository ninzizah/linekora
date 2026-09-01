import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Linekora API is running 🚀' });
});

// ─── STATS ──────────────────────────────────────────────────────────────────

app.get('/api/stats', async (_req, res) => {
  try {
    const [totalUsers, verifiedWorkers, verifiedCompanies, pendingVerifications, activeJobs, completedHires] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'WORKER', verificationStatus: 'verified' } }),
      prisma.user.count({ where: { role: 'COMPANY', verificationStatus: 'verified' } }),
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      prisma.job.count({ where: { OR: [{ status: 'open' }, { status: 'accepted' }, { status: 'completion_requested' }] } }),
      prisma.job.count({ where: { status: 'completed' } }),
    ]);
    res.json({
      totalUsers,
      verifiedWorkers,
      verifiedCompanies,
      pendingVerifications,
      activeJobs,
      completedHires,
    });
  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

// ─── USERS ──────────────────────────────────────────────────────────────────

app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message || String(error) });
  }
});

app.get('/api/users/:firebaseUid', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.params.firebaseUid },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = { ...req.body };
    const user = await prisma.user.upsert({
      where: { firebaseUid: req.body.firebaseUid },
      update: data,
      create: data,
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id }, { firebaseUid: id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: req.body,
    });
    res.json(user);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id }, { firebaseUid: id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = existing.id;

    // Applications on jobs this user posted
    const jobs = await prisma.job.findMany({ where: { employerId: userId } });
    if (jobs.length > 0) {
      await prisma.application.deleteMany({ where: { jobId: { in: jobs.map(j => j.id) } } });
    }
    // Jobs this user posted
    await prisma.job.deleteMany({ where: { employerId: userId } });

    // Applications where this user is the worker
    await prisma.application.deleteMany({ where: { workerId: userId } });

    // Messages sent/received
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });

    // Notifications
    await prisma.notification.deleteMany({ where: { userId } });

    // Reviews given/received
    await prisma.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { targetId: userId }] } });

    // Finally the user record
    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// ─── VERIFICATION DOCUMENTS ────────────────────────────────────────────────────

// Save verification documents for a user (called by verification pages)
app.post('/api/verification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { firebaseUid: userId }] },
    });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        verificationData: JSON.stringify(req.body),
        verificationStatus: 'pending',
      },
    });

    // Notify admins a new verification request has arrived for review
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map(a =>
        (prisma as any).notification.create({
          data: {
            userId: a.id,
            title: 'New verification request received',
            body: `${existing.displayName} (${existing.role}) submitted their verification documents — action required.`,
            type: 'urgent',
            link: '/admin',
          },
        })
      )
    );

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Failed to save verification docs:', error);
    res.status(500).json({ error: error.message || 'Failed to save verification documents' });
  }
});

// Get verification documents for a user (called by admin dashboard)
app.get('/api/verification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { firebaseUid: userId }] },
      select: {
        id: true,
        firebaseUid: true,
        displayName: true,
        email: true,
        role: true,
        verificationStatus: true,
        verificationData: true,
        trustScore: true,
        tier: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const verificationData = user.verificationData ? JSON.parse(user.verificationData) : null;
    res.json({ ...user, verificationData });
  } catch (error: any) {
    console.error('Failed to fetch verification docs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch verification documents' });
  }
});

// Get all pending verifications (called by admin dashboard)
app.get('/api/verification', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { verificationStatus: 'pending' },
      select: {
        id: true,
        firebaseUid: true,
        displayName: true,
        email: true,
        role: true,
        verificationStatus: true,
        verificationData: true,
        trustScore: true,
        tier: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const result = users.map(u => ({
      ...u,
      verificationData: u.verificationData ? JSON.parse(u.verificationData) : null,
    }));
    res.json(result);
  } catch (error: any) {
    console.error('Failed to fetch pending verifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch pending verifications' });
  }
});

// ─── JOBS ────────────────────────────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    const { urgent, category, status, employerId, includeExpired } = req.query;
    const where: any = {};
    if (urgent !== undefined) where.urgent = urgent === 'true';
    if (category) where.category = category;
    if (status) where.status = status;
    if (employerId) where.employerId = String(employerId);

    // Filter out expired jobs (deadline has passed) unless the manager view asks for them
    if (includeExpired !== 'true') {
      where.OR = [
        { deadline: null },
        { deadline: { gte: new Date() } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { employer: { select: { id: true, displayName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.deadline && typeof data.deadline === 'string') {
      data.deadline = new Date(data.deadline).toISOString();
    }
    const job = await prisma.job.create({ data });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create job' });
  }
});

app.patch('/api/jobs/:id', async (req, res) => {
  try {
    const job = await prisma.job.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    // Remove related applications first to satisfy the foreign key constraint
    await prisma.application.deleteMany({ where: { jobId } });
    await prisma.job.delete({ where: { id: jobId } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Apply to a job (worker claiming)
app.post('/api/jobs/:id/apply', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ error: 'workerId is required' });

    // Check if already applied
    const existing = await prisma.application.findFirst({
      where: { jobId, workerId },
    });
    if (existing) {
      return res.status(409).json({ error: 'Already applied to this job' });
    }

    const application = await prisma.application.create({
      data: { jobId, workerId, status: 'pending' },
    });

    // Also update job status to accepted
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'accepted' },
    });

    res.json(application);
  } catch (error: any) {
    if (error.message?.includes('Already applied')) {
      return res.status(409).json({ error: 'Already applied to this job' });
    }
    res.status(500).json({ error: error.message || 'Failed to apply' });
  }
});

// ─── APPLICATIONS ────────────────────────────────────────────────────────────

app.get('/api/applications', async (req, res) => {
  try {
    const { workerId, jobId, employerId } = req.query;
    const where: any = {};
    if (workerId) where.workerId = workerId;
    if (jobId) where.jobId = parseInt(jobId as string);
    if (employerId) where.job = { employerId: employerId as string };

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { include: { employer: { select: { displayName: true, email: true } } } },
        worker: { select: { id: true, displayName: true, trustScore: true, verificationStatus: true, phone: true, avatarUrl: true } },
        team: { select: { id: true, name: true, teamCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const { jobId, workerId, teamId, applyType } = req.body;
    if (!jobId || !workerId) {
      return res.status(400).json({ error: 'jobId and workerId are required' });
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_workerId: { jobId, workerId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Already applied to this job' });
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId,
        teamId: teamId || null,
        applyType: applyType || 'individual',
      },
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        worker: { select: { id: true, displayName: true } },
        team: teamId ? { select: { id: true, name: true } } : false,
      },
    });
    res.json(application);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Already applied to this job' });
    }
    res.status(500).json({ error: error.message || 'Failed to create application' });
  }
});

app.patch('/api/applications/:id', async (req, res) => {
  try {
    const application = await prisma.application.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        worker: { select: { id: true, displayName: true } },
      },
    });
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    await prisma.application.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const notifications = await (prisma as any).notification.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, title, body, type, link, linkTarget } = req.body;
    const resolvedLink = link || (await resolveLinkForUser(userId, linkTarget));
    const notification = await (prisma as any).notification.create({
      data: { userId, title, body, type: type || 'info', link: resolvedLink },
    });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create notification' });
  }
});

// Resolve a semantic link target to an actual route based on the recipient's role.
// Maps something like "applications" | "messages" | "verification" | "contracts" | "reviews" | "dashboard" | "admin"
async function resolveLinkForUser(userId: string, target?: string): Promise<string | null> {
  if (!target) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const role = user?.role || 'WORKER';
  const base =
    role === 'COMPANY' ? '/dashboard/company' :
    role === 'EMPLOYER' ? '/dashboard/employer' :
    role === 'ADMIN' ? '/admin' :
    '/dashboard/worker';
  switch (target) {
    case 'dashboard': return base === '/admin' ? '/admin' : `${base}`;
    case 'browse': return role === 'WORKER' ? '/dashboard/worker/browse' : role === 'COMPANY' ? '/dashboard/company/browse' : '/dashboard/employer/browse';
    case 'applications': return role === 'WORKER' ? '/dashboard/worker/applications' : role === 'COMPANY' ? '/dashboard/company/applicants' : base;
    case 'jobs': return role === 'WORKER' ? '/dashboard/worker/browse' : role === 'COMPANY' ? '/dashboard/company/jobs' : base;
    case 'contracts': return role === 'WORKER' ? '/dashboard/worker/applications' : base;
    case 'messages': return base === '/admin' ? '/admin' : `${base}/messages`;
    case 'verification': return base === '/admin' ? '/admin' : `${base}/verify`;
    case 'reviews': return role === 'WORKER' ? '/dashboard/worker/reviews' : role === 'COMPANY' ? `${base}` : base;
    case 'wallet': return base === '/admin' ? '/admin' : `${base}/wallet`;
    case 'admin': return '/admin';
    default: return null;
  }
}

app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    await (prisma as any).notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await (prisma as any).notification.update({
      where: { id: parseInt(req.params.id) },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const existing = await (prisma as any).notification.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: 'Notification not found' });
    await (prisma as any).notification.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────

// Get all messages for a conversation (optionally filtered by peer) between two users
app.get('/api/messages', async (req, res) => {
  try {
    const { userId, peerId } = req.query;
    const where: any = userId
      ? { OR: [{ senderId: userId }, { receiverId: userId }] }
      : {};
    if (userId && peerId) {
      where.OR = [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get a user's conversations (each with the other party + last message + unread count)
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const peerMap = new Map<string, any>();
    for (const m of messages) {
      const peerId = m.senderId === userId ? m.receiverId : m.senderId;
      const peer = m.senderId === userId ? m.receiver : m.sender;
      if (!peer) continue;
      const unreadDelta = m.receiverId === userId && !m.read ? 1 : 0;
      const existing = peerMap.get(peerId);
      if (!existing) {
        peerMap.set(peerId, {
          peer: { id: peer.id, displayName: peer.displayName, role: peer.role, avatarUrl: peer.avatarUrl },
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
          unread: unreadDelta,
        });
      } else {
        existing.unread = (existing.unread || 0) + unreadDelta;
      }
    }

    const conversations = Array.from(peerMap.values());
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { content, senderId, receiverId } = req.body;
    if (!content || !senderId || !receiverId) {
      return res.status(400).json({ error: 'content, senderId, and receiverId are required' });
    }

    const message = await prisma.message.create({
      data: { content, senderId, receiverId },
      include: {
        sender: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
      },
    });

    const receiverLink = resolveLinkForUser(receiverId, 'messages');

    // Notify the receiver (in-app) that they have a new message
    await (prisma as any).notification.create({
      data: {
        userId: receiverId,
        title: `New message from ${message.sender?.displayName || 'User'}`,
        body: content.length > 90 ? content.slice(0, 90) + '…' : content,
        type: 'info',
        link: receiverLink,
      },
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Mark all messages in a conversation (between userId and peerId) as read
app.patch('/api/messages/read', async (req, res) => {
  try {
    const { userId, peerId } = req.body;
    if (!userId || !peerId) return res.status(400).json({ error: 'userId and peerId are required' });
    await prisma.message.updateMany({
      where: { senderId: peerId, receiverId: userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// ─── TEAMS ──────────────────────────────────────────────────────────────────

// Create a team (creator becomes super_leader)
app.post('/api/teams', async (req, res) => {
  try {
    const { name, userId, email, phone, mainSkill, location, description, logoUrl } = req.body;
    if (!name || !userId) return res.status(400).json({ error: 'name and userId are required' });

    const teamCode = 'TEAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const team = await prisma.team.create({
      data: {
        name,
        teamCode,
        email: email || null,
        phone: phone || null,
        mainSkill: mainSkill || null,
        location: location || null,
        description: description || null,
        logoUrl: logoUrl || null,
      },
    });

    // Creator becomes super_leader
    await prisma.teamMembership.create({
      data: {
        userId,
        teamId: team.id,
        role: 'super_leader',
      },
    });

    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create team' });
  }
});

// Get team by ID with memberships
app.get('/api/teams/:teamId', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.teamId },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true, trustScore: true, verificationStatus: true, phone: true, email: true } },
          },
        },
      },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team' });
  }
});

// Get team membership for a user
app.get('/api/teams/user/:userId', async (req, res) => {
  try {
    const membership = await prisma.teamMembership.findFirst({
      where: { userId: req.params.userId },
      include: {
        team: true,
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json(membership || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team membership' });
  }
});

// Join team by team code
app.post('/api/teams/join', async (req, res) => {
  try {
    const { userId, teamCode, role } = req.body;
    if (!userId || !teamCode) return res.status(400).json({ error: 'userId and teamCode are required' });

    const team = await prisma.team.findUnique({ where: { teamCode } });
    if (!team) return res.status(404).json({ error: 'Team not found. Check the team code.' });

    const existing = await prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId, teamId: team.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already a member of this team' });

    const membership = await prisma.teamMembership.create({
      data: {
        userId,
        teamId: team.id,
        role: role || 'member',
      },
      include: { team: true },
    });

    res.json(membership);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to join team' });
  }
});

// Remove member from team
app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    await prisma.teamMembership.delete({
      where: { userId_teamId: { userId, teamId } },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove member' });
  }
});

// Invite member to team
app.post('/api/teams/invite', async (req, res) => {
  try {
    const { teamId, email, phone, role, invitedBy } = req.body;
    if (!teamId || !email || !invitedBy) return res.status(400).json({ error: 'teamId, email, and invitedBy are required' });

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        phone: phone || null,
        role: role || 'member',
        invitedBy,
      },
      include: { team: true },
    });

    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create invitation' });
  }
});

// Get team invitations
app.get('/api/teams/:teamId/invitations', async (req, res) => {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId: req.params.teamId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch invitations' });
  }
});

// Accept invitation
app.patch('/api/teams/invitations/:id/accept', async (req, res) => {
  try {
    const invitation = await prisma.teamInvitation.update({
      where: { id: req.params.id },
      data: { status: 'accepted' },
    });

    // Find the user by email and create membership
    const user = await prisma.user.findFirst({ where: { email: invitation.email } });
    if (user) {
      const existing = await prisma.teamMembership.findUnique({
        where: { userId_teamId: { userId: user.id, teamId: invitation.teamId } },
      });
      if (!existing) {
        await prisma.teamMembership.create({
          data: {
            userId: user.id,
            teamId: invitation.teamId,
            role: invitation.role,
          },
        });
      }
    }

    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
});

// Create announcement
app.post('/api/teams/announcements', async (req, res) => {
  try {
    const { teamId, title, body, authorId } = req.body;
    if (!teamId || !title || !body || !authorId) return res.status(400).json({ error: 'teamId, title, body, and authorId are required' });

    const announcement = await prisma.teamAnnouncement.create({
      data: { teamId, title, body, authorId },
    });
    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create announcement' });
  }
});

// Get team announcements
app.get('/api/teams/:teamId/announcements', async (req, res) => {
  try {
    const announcements = await prisma.teamAnnouncement.findMany({
      where: { teamId: req.params.teamId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch announcements' });
  }
});

// Get team stats (member count, active jobs, announcements)
app.get('/api/teams/:teamId/stats', async (req, res) => {
  try {
    const { teamId } = req.params;
    const [memberCount, activeJobs, announcementCount] = await Promise.all([
      prisma.teamMembership.count({ where: { teamId } }),
      prisma.application.count({ where: { teamId, status: { not: 'rejected' } } }),
      prisma.teamAnnouncement.count({ where: { teamId } }),
    ]);
    res.json({ memberCount, activeJobs, announcementCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team stats' });
  }
});

// Assign members to a team application (leader action)
app.patch('/api/applications/:id/assign', async (req, res) => {
  try {
    const { assignedMembers } = req.body;
    const app_ = await prisma.application.update({
      where: { id: Number(req.params.id) },
      data: { assignedMembers: JSON.stringify(assignedMembers || []) },
    });
    res.json(app_);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to assign members' });
  }
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

app.get('/api/reviews/:targetId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { targetId: req.params.targetId },
      include: { reviewer: { select: { displayName: true, verificationStatus: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const review = await prisma.review.create({ data: req.body });
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create review' });
  }
});

// ─── START SERVER ────────────────────────────────────────────────────────────

// Vercel serverless: export the Express app as default
export default app;

// Local dev: start the server normally
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`✅  Linekora API running on http://localhost:${port}`);
  });
}
