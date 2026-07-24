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
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Linekora API is running 🚀' });
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
    if (data.email === 'ndivelabs@gmail.com') {
      data.role = 'ADMIN';
    }
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

// ─── JOBS ────────────────────────────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    const { urgent, category, status } = req.query;
    const where: any = {};
    if (urgent !== undefined) where.urgent = urgent === 'true';
    if (category) where.category = category;
    if (status) where.status = status;

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
    const job = await prisma.job.create({ data: req.body });
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

// ─── APPLICATIONS ────────────────────────────────────────────────────────────

app.get('/api/applications', async (req, res) => {
  try {
    const { workerId, jobId } = req.query;
    const where: any = {};
    if (workerId) where.workerId = workerId;
    if (jobId) where.jobId = parseInt(jobId as string);

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { include: { employer: { select: { displayName: true, email: true } } } },
        worker: { select: { id: true, displayName: true, trustScore: true, verificationStatus: true } },
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
    const application = await prisma.application.create({ data: req.body });
    res.json(application);
  } catch (error: any) {
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
    const notification = await (prisma as any).notification.create({ data: req.body });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create notification' });
  }
});

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

// ─── MESSAGES ────────────────────────────────────────────────────────────────

app.get('/api/messages', async (req, res) => {
  try {
    const { userId } = req.query;
    const where: any = userId
      ? { OR: [{ senderId: userId }, { receiverId: userId }] }
      : {};

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, displayName: true } },
        receiver: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const message = await prisma.message.create({ data: req.body });
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
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

app.listen(port, () => {
  console.log(`✅  Linekora API running on http://localhost:${port}`);
});
