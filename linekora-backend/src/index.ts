import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SignJWT } from 'jose';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { requireAuth } from './middleware/auth';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const app = express();
const port = process.env.PORT || 5000;

// Secret used to sign standalone admin operator tokens (must match middleware/auth.ts).
const OPERATOR_SECRET = process.env.OPERATOR_SECRET || 'linekora_operator_SafeOps_2026!';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Linekora API is running 🚀' });
});

// ─── STATS (public — aggregate counts only, no PII) ─────────────────────────

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

// ─── OPERATOR UNLOCK (standalone admin shortcut) ──────────────────────────
// Grants a signed, expiring "operator" token when the operator credentials
// match. No LINEKORA / Firebase account required. Placed before requireAuth so
// the credentials alone are enough to obtain admin access.
app.post('/api/operator/unlock', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const passkey = String(req.body?.passkey || '').trim();
    const expectedUser = (process.env.ADMIN_USERNAME || 'Ndive Labs').trim();
    const expectedPass = (process.env.ADMIN_PASSKEY || 'Ndive-admin@12345').trim();
    if (username !== expectedUser || passkey !== expectedPass) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const token = await new SignJWT({ op: 'admin', grant: 'operator' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(new TextEncoder().encode(OPERATOR_SECRET));
    res.json({ success: true, token, role: 'OPERATOR', expiresIn: 12 * 3600 });
  } catch (error: any) {
    console.error('Failed to issue operator token:', error);
    res.status(500).json({ error: error.message || 'Failed to authorize admin' });
  }
});

// ─── AUTH ──────────────────────────────────────────────────────────────────
// Every route defined below this point requires a valid Firebase ID token.
app.use('/api', requireAuth);

// Attach the caller's DB record so handlers can authorise by role / ownership.
app.use('/api', async (req, _res, next) => {
  try {
    if (req.operator) {
      // Operator tokens carry no Firebase account. Fabricate an ADMIN identity
      // so every existing role/ownership guard treats the operator as admin.
      req.dbUser = {
        id: '__operator__',
        role: 'ADMIN',
        firebaseUid: '__operator__',
        displayName: 'Linekora Operator',
      };
      return next();
    }
    req.dbUser = await prisma.user.findUnique({
      where: { firebaseUid: req.user!.uid },
      select: { id: true, role: true, firebaseUid: true, displayName: true },
    });
  } catch {
    req.dbUser = null;
  }
  next();
});

const requireAdmin: express.RequestHandler = (req, res, next) => {
  if (req.dbUser?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }
  next();
};

// ─── ADMIN UNLOCK (operator passkey) ───────────────────────────────────────
// Grants ADMIN role to the authenticated Firebase account when the operator
// passkey matches. Recreates the legacy "admin portal shortcut" behaviour.
app.post('/api/admin/unlock', async (req, res) => {
  try {
    const username = String(req.body?.username || '');
    const passkey = String(req.body?.passkey || '');
    const expectedUser = process.env.ADMIN_USERNAME || 'Ndive Labs';
    const expectedPass = process.env.ADMIN_PASSKEY || 'Ndive-admin@12345';
    if (username !== expectedUser || passkey !== expectedPass) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const actor = await prisma.user.findUnique({ where: { firebaseUid: req.user!.uid } });
    if (!actor) {
      return res.status(404).json({ error: 'User record not found' });
    }
    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: { role: 'ADMIN' },
    });
    res.json({ success: true, id: updated.id, role: updated.role });
  } catch (error: any) {
    console.error('Failed to unlock admin:', error);
    res.status(500).json({ error: 'Failed to authorize admin' });
  }
});

// ─── USERS ──────────────────────────────────────────────────────────────────

app.get('/api/users', requireAdmin, async (_req, res) => {
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

// Public-facing worker directory — minimal fields, no email/phone/validation data.
app.get('/api/users/workers', async (_req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: {
        id: true,
        firebaseUid: true,
        displayName: true,
        role: true,
        location: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        experience: true,
        education: true,
        trustScore: true,
        verificationStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(workers);
  } catch (error: any) {
    console.error('Failed to fetch workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

app.get('/api/users/:firebaseUid', async (req, res) => {
  try {
    if (req.params.firebaseUid !== req.user?.uid) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s profile' });
    }
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
    if (req.body.firebaseUid !== req.user?.uid) {
      return res.status(403).json({ error: 'Forbidden: firebaseUid does not match authenticated user' });
    }
    const data = { ...req.body };
    const existing = await prisma.user.findUnique({
      where: { firebaseUid: req.body.firebaseUid },
    });
    if (existing) {
      // On an existing account, only update safe identity/profile fields.
      // Never overwrite trustScore / verificationStatus / tier / role via upsert.
      const safe: any = {};
      if (data.displayName !== undefined) safe.displayName = data.displayName;
      if (data.email !== undefined) safe.email = data.email;
      if (data.phone !== undefined) safe.phone = data.phone;
      if (data.location !== undefined) safe.location = data.location;
      if (data.avatarUrl !== undefined) safe.avatarUrl = data.avatarUrl;
      if (data.bio !== undefined) safe.bio = data.bio;
      if (data.skills !== undefined) safe.skills = data.skills;
      if (data.experience !== undefined) safe.experience = data.experience;
      if (data.education !== undefined) safe.education = data.education;
      if (data.registrationNumber !== undefined) safe.registrationNumber = data.registrationNumber;
      if (data.taxId !== undefined) safe.taxId = data.taxId;
      const user = await prisma.user.update({ where: { id: existing.id }, data: safe });
      return res.json(user);
    }
    // New account: allow role but never ADMIN (unless the caller is an admin).
    if (data.role !== undefined && !['WORKER', 'COMPANY', 'EMPLOYER'].includes(data.role)) {
      delete data.role;
    }
    const user = await prisma.user.create({ data });
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

    // Caller identity derived from the verified Firebase token.
    const actor = await prisma.user.findUnique({ where: { firebaseUid: req.user!.uid } });
    const isSelf = existing.firebaseUid === req.user?.uid;
    const isAdmin = actor?.role === 'ADMIN';

    const body = req.body;
    const safe: any = {};

    // Identity/profile fields — editable only for your own account.
    if (isSelf || isAdmin) {
      for (const f of ['displayName', 'phone', 'location', 'avatarUrl', 'bio', 'skills', 'experience', 'education', 'registrationNumber', 'taxId', 'certificates', 'portfolio', 'cvFile', 'cvFilename']) {
        if (body[f] !== undefined) safe[f] = body[f];
      }
    }

    // Verification & reputation fields.
    if (isSelf && body.verificationStatus !== undefined) {
      const status = String(body.verificationStatus);
      if (status === 'pending' || status === 'unverified') {
        safe.verificationStatus = status;
        if (body.tier !== undefined) safe.tier = body.tier;
        if (body.trustScore !== undefined) safe.trustScore = body.trustScore;
      }
    }
    if (isAdmin) {
      if (body.verificationStatus !== undefined) safe.verificationStatus = body.verificationStatus;
      if (body.tier !== undefined) safe.tier = body.tier;
      if (body.trustScore !== undefined) safe.trustScore = body.trustScore;
      if (body.verificationData !== undefined) safe.verificationData = body.verificationData;
    }

    // role / email / firebaseUid / id are NEVER editable via PATCH.

    if (Object.keys(safe).length === 0) {
      return res.status(400).json({ error: 'Nothing to update: no editable fields provided' });
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: safe,
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

    // Admins may delete anyone; users may only delete their own account.
    if (req.dbUser?.role !== 'ADMIN' && existing.id !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete another user' });
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

    // Users may only submit their own verification documents; admins act on any.
    if (req.dbUser?.role !== 'ADMIN' && existing.id !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot submit verification for another user' });
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

// Get verification documents for a user (admin review — contains sensitive ID docs)
app.get('/api/verification/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = String(userId);
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: uid }, { firebaseUid: uid }] },
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

// Get all pending verifications (admin dashboard)
app.get('/api/verification', requireAdmin, async (_req, res) => {
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
    const role = req.dbUser?.role;
    const uid = req.dbUser?.id;

    const where: any = {};

    // Companies/employers may only see their own jobs; workers & admins browse all.
    if (role === 'COMPANY' || role === 'EMPLOYER') {
      where.employerId = uid;
    } else if (employerId) {
      where.employerId = String(employerId);
    }

    if (urgent !== undefined) where.urgent = urgent === 'true';
    if (category) where.category = category;
    if (status) where.status = status;

    // Filter out expired jobs (deadline has passed) unless the manager view asks for them
    if (includeExpired !== 'true') {
      where.OR = [
        { deadline: null },
        { deadline: { gte: new Date() } },
      ];
    }

    // Only admins see the employer's contact details (worker marketplace keeps names only).
    const employerSelect: any = { id: true, displayName: true };
    if (role === 'ADMIN') {
      employerSelect.email = true;
      employerSelect.phone = true;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { employer: { select: employerSelect } },
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
    // A company may only create jobs for itself (admins may create for any).
    if (
      data.employerId &&
      req.dbUser?.role !== 'ADMIN' &&
      String(data.employerId) !== req.dbUser?.id
    ) {
      return res.status(403).json({ error: 'Forbidden: cannot post a job for another account' });
    }
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
    const jobId = parseInt(req.params.id);
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }
    // Company that posted the job, or an admin, may edit it.
    if (req.dbUser?.role !== 'ADMIN' && existing.employerId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: not the job owner' });
    }
    const job = await prisma.job.update({
      where: { id: jobId },
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
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }
    // Company that posted the job, or an admin, may delete it.
    if (req.dbUser?.role !== 'ADMIN' && existing.employerId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: not the job owner' });
    }

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

    // A worker may only apply on their own behalf (admins may act for any).
    if (req.dbUser?.role !== 'ADMIN' && String(workerId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot apply as another user' });
    }

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
    const role = req.dbUser?.role;
    const uid = req.dbUser?.id;

    const where: any = {};
    if (workerId) where.workerId = workerId;
    if (jobId) where.jobId = parseInt(jobId as string);
    if (employerId) where.job = { employerId: employerId as string };

    // Workers may only see their own applications; companies/employers see only their jobs' applications.
    if (role === 'WORKER') {
      where.workerId = uid;
    } else if (role === 'COMPANY' || role === 'EMPLOYER') {
      where.job = { employerId: uid };
    }
    // ADMIN sees everything (no extra filter)

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

    // A worker may only apply on their own behalf (admins may act for any).
    if (req.dbUser?.role !== 'ADMIN' && String(workerId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot apply as another user' });
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
    const application = await prisma.application.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { job: { include: { employer: true } }, worker: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Only the job owner, the applying worker, or an admin may update an application.
    const isJobOwner = application.job?.employerId === req.dbUser?.id;
    const isWorker = application.workerId === req.dbUser?.id;
    if (req.dbUser?.role !== 'ADMIN' && !isJobOwner && !isWorker) {
      return res.status(403).json({ error: 'Forbidden: cannot update this application' });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: req.body,
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        worker: { select: { id: true, displayName: true, phone: true } },
      },
    });

    // When an application is accepted, automatically open a DB-backed contract
    // for the escrow / milestone review workflow.
    if (req.body?.status === 'accepted') {
      try {
        const existingContract = await (prisma as any).contract.findUnique({
          where: { applicationId: application.id },
        });
        if (!existingContract) {
          await (prisma as any).contract.create({
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              jobTitle: application.job?.title || 'Contract Gig',
              company: application.job?.employer?.displayName || 'Employer',
              salary: application.job?.salary || 'RWF 20,000 / Task',
              location: application.job?.location || 'Kigali',
              status: 'accepted',
              workerId: application.workerId,
              employerId: application.job.employerId,
              employerName: application.job?.employer?.displayName || 'Employer',
              daysSinceRequest: 0,
              logo: 'PJ',
              phone: application.worker?.phone || null,
            },
          });
        }
      } catch (contractError) {
        console.error('Failed to auto-create contract on accept:', contractError);
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { job: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // The applying worker, the job owner, or an admin may delete it.
    const isJobOwner = application.job?.employerId === req.dbUser?.id;
    const isWorker = application.workerId === req.dbUser?.id;
    if (req.dbUser?.role !== 'ADMIN' && !isJobOwner && !isWorker) {
      return res.status(403).json({ error: 'Forbidden: cannot delete this application' });
    }

    await prisma.application.delete({ where: { id: application.id } });
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
    // Users may only read their own notifications (admins may read any).
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s notifications' });
    }
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
    if (!userId) return res.status(400).json({ error: 'userId is required' });
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
    // Users may only mark their own notifications as read.
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot update another user\'s notifications' });
    }
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
    const existing = await (prisma as any).notification.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: 'Notification not found' });
    // Users may only mark their own notifications as read.
    if (req.dbUser?.role !== 'ADMIN' && existing.userId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot update another user\'s notification' });
    }
    const notification = await (prisma as any).notification.update({
      where: { id: existing.id },
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
    // Users may only delete their own notifications.
    if (req.dbUser?.role !== 'ADMIN' && existing.userId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete another user\'s notification' });
    }
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
    // Users may only read their own messages.
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s messages' });
    }
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
    // Users may only fetch their own conversations.
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s conversations' });
    }

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
        const preview = m.content?.trim()
          ? m.content
          : (m.attachments && JSON.parse(m.attachments).length > 0 ? '📎 Attachment' : m.content);
        peerMap.set(peerId, {
          peer: { id: peer.id, displayName: peer.displayName, role: peer.role, avatarUrl: peer.avatarUrl },
          lastMessage: preview,
          lastMessageAt: m.createdAt,
          unread: unreadDelta,
        });
      } else {
        existing.unread = (existing.unread || 0) + unreadDelta;
      }
    }

    // Load per-user preferences (pin/mute) and merge into conversations
    const prefs = await prisma.userConversation.findMany({
      where: { userId },
    });
    const prefMap = new Map(prefs.map((p) => [p.peerId, p]));

    const conversations = Array.from(peerMap.values()).map((c) => {
      const pref = prefMap.get(c.peer.id);
      return { ...c, pinned: pref?.pinned ?? false, muted: pref?.muted ?? false };
    });
    conversations.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { content, senderId, receiverId, attachments } = req.body;
    if (!senderId || !receiverId || (content === undefined && !attachments)) {
      return res.status(400).json({ error: 'content (or attachments), senderId, and receiverId are required' });
    }

    // A user may only send messages as themselves (admins may send for any).
    if (req.dbUser?.role !== 'ADMIN' && String(senderId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot send a message as another user' });
    }

    // Validate attachments: max 2 files, max 5MB each, image or pdf/doc/docx only
    const MAX_ATTACHMENTS = 2;
    const MAX_BYTES = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (attachments && attachments.length > 0) {
      if (attachments.length > MAX_ATTACHMENTS) {
        return res.status(400).json({ error: `You can attach at most ${MAX_ATTACHMENTS} files per message` });
      }
      for (const att of attachments) {
        if (!att || !att.name || !att.dataUrl) {
          return res.status(400).json({ error: 'Each attachment needs a name and dataUrl' });
        }
        if (!ALLOWED_TYPES.includes(att.type)) {
          return res.status(400).json({ error: `File type "${att.type}" is not supported` });
        }
        const base64 = att.dataUrl.split(',')[1] || '';
        const byteLen = Math.floor(base64.length * 3 / 4);
        if (byteLen > MAX_BYTES) {
          return res.status(400).json({ error: `"${att.name}" exceeds the 5MB limit` });
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content || '',
        senderId,
        receiverId,
        attachments: attachments && attachments.length > 0 ? JSON.stringify(attachments) : null,
      },
      include: {
        sender: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, role: true, avatarUrl: true } },
      },
    });

    const receiverLink = await resolveLinkForUser(receiverId, 'messages');

    const bodyText = (content || '').trim() || (attachments && attachments.length > 0 ? `📎 ${attachments.length} attachment(s)` : '');

    // Notify the receiver (in-app) that they have a new message
    await (prisma as any).notification.create({
      data: {
        userId: receiverId,
        title: `New message from ${message.sender?.displayName || 'User'}`,
        body: bodyText.length > 90 ? bodyText.slice(0, 90) + '…' : bodyText,
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
    // Users may only mark their own messages as read.
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot update another user\'s messages' });
    }
    await prisma.message.updateMany({
      where: { senderId: peerId, receiverId: userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Update per-user conversation preferences (pin/mute a chat)
app.patch('/api/conversations/prefs', async (req, res) => {
  try {
    const { userId, peerId, pinned, muted } = req.body;
    if (!userId || !peerId) return res.status(400).json({ error: 'userId and peerId are required' });
    // Users may only update their own conversation preferences.
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot update another user\'s preferences' });
    }

    const upserted = await prisma.userConversation.upsert({
      where: { userId_peerId: { userId, peerId } },
      create: {
        userId,
        peerId,
        pinned: pinned ?? false,
        muted: muted ?? false,
      },
      update: {
        ...(typeof pinned === 'boolean' ? { pinned } : {}),
        ...(typeof muted === 'boolean' ? { muted } : {}),
      },
    });
    res.json(upserted);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update conversation preferences' });
  }
});

// ─── TEAMS ──────────────────────────────────────────────────────────────────

// Create a team (creator becomes super_leader)
app.post('/api/teams', async (req, res) => {
  try {
    const { name, userId, email, phone, mainSkill, location, description, logoUrl } = req.body;
    if (!name || !userId) return res.status(400).json({ error: 'name and userId are required' });

    // A user may only create a team for themselves (admins may create for any).
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot create a team for another user' });
    }

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
    // Only team members or admins may read the full team (includes member email/phone).
    if (req.dbUser?.role !== 'ADMIN') {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId: req.params.teamId, userId: req.dbUser?.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: not a member of this team' });
      }
    }
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
    // Users may only read their own membership (admins may read any).
    if (req.dbUser?.role !== 'ADMIN' && String(req.params.userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s team membership' });
    }
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

    // A user may only join a team for themselves (admins may join for any).
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot join a team as another user' });
    }

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
    // Users may only remove themselves; team super_leaders/admins may remove others.
    if (req.dbUser?.role === 'ADMIN' || String(userId) === req.dbUser?.id) {
      // allowed — self-removal or admin
    } else {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId, userId: req.dbUser?.id },
      });
      if (membership?.role !== 'super_leader') {
        return res.status(403).json({ error: 'Forbidden: only the team leader or the member themselves can remove membership' });
      }
    }
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

    // Invitations may only be sent by the inviting user themselves (admins may invite for any).
    if (req.dbUser?.role !== 'ADMIN' && String(invitedBy) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot invite as another user' });
    }

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
    // Only team members or admins may view invitations.
    if (req.dbUser?.role !== 'ADMIN') {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId: req.params.teamId, userId: req.dbUser?.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: not a member of this team' });
      }
    }
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

    // Announcements may only be authored by the caller (admins may author for any).
    if (req.dbUser?.role !== 'ADMIN' && String(authorId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot post an announcement as another user' });
    }

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
    // Only team members or admins may view announcements.
    if (req.dbUser?.role !== 'ADMIN') {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId: req.params.teamId, userId: req.dbUser?.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: not a member of this team' });
      }
    }
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
    // Only team members or admins may view team stats.
    if (req.dbUser?.role !== 'ADMIN') {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId: req.params.teamId, userId: req.dbUser?.id },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: not a member of this team' });
      }
    }
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

    const app_ = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!app_) return res.status(404).json({ error: 'Application not found' });

    // Only admins or the team leader of the applicant team may assign members.
    if (req.dbUser?.role !== 'ADMIN' && app_.teamId) {
      const membership = await prisma.teamMembership.findFirst({
        where: { teamId: app_.teamId, userId: req.dbUser?.id, role: 'super_leader' },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: only the team leader or an admin may assign members' });
      }
    }

    const updated = await prisma.application.update({
      where: { id: app_.id },
      data: { assignedMembers: JSON.stringify(assignedMembers || []) },
    });
    res.json(updated);
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
    const { reviewerId } = req.body;
    if (!reviewerId) return res.status(400).json({ error: 'reviewerId is required' });
    // A user may only leave a review as themselves (admins may review for any).
    if (req.dbUser?.role !== 'ADMIN' && String(reviewerId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot submit a review as another user' });
    }
    const review = await prisma.review.create({ data: req.body });
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create review' });
  }
});

// ─── CONTRACTS (contract lifecycle, DB-backed) ───────────────────────────────

app.get('/api/contracts', async (req, res) => {
  try {
    const { workerId, employerId } = req.query;
    const role = req.dbUser?.role;
    const uid = req.dbUser?.id;

    const where: any = {};
    if (workerId) where.workerId = workerId as string;
    if (employerId) where.employerId = employerId as string;

    // Workers see only their own contracts; employers/companies see only theirs.
    if (role === 'WORKER') {
      where.workerId = uid;
    } else if (role === 'COMPANY' || role === 'EMPLOYER') {
      where.employerId = uid;
    }
    // ADMIN sees everything.

    const contracts = await (prisma as any).contract.findMany({
      where,
      include: { worker: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      // Direct-hire contract (no application): a company/employer hires a worker directly.
      const { jobId, jobTitle, company, salary, location, workerId, employerId, employerName, logo, phone, status } = req.body;
      if (!workerId || !employerId) {
        return res.status(400).json({ error: 'workerId and employerId are required for direct contracts' });
      }
      if (req.dbUser?.role !== 'ADMIN' && String(employerId) !== req.dbUser?.id) {
        return res.status(403).json({ error: 'Forbidden: cannot create a direct contract as another user' });
      }
      const contract = await (prisma as any).contract.create({
        data: {
          jobId: jobId || null,
          jobTitle: jobTitle || 'Contract Gig',
          company: company || req.dbUser?.displayName || 'Employer',
          salary: salary || 'RWF 20,000 / Task',
          location: location || 'Kigali',
          status: status || 'accepted',
          workerId,
          employerId,
          employerName: employerName || 'Employer',
          daysSinceRequest: 0,
          logo: logo || 'PJ',
          phone: phone || null,
        },
        include: { worker: { select: { id: true, displayName: true } } },
      });
      return res.json(contract);
    }

    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
      include: { job: { include: { employer: true } }, worker: true },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Job owner or the applying worker may create the contract (admins may always).
    const isJobOwner = application.job?.employerId === req.dbUser?.id;
    const isWorker = application.workerId === req.dbUser?.id;
    if (req.dbUser?.role !== 'ADMIN' && !isJobOwner && !isWorker) {
      return res.status(403).json({ error: 'Forbidden: cannot create a contract for this application' });
    }

    const existingContract = await (prisma as any).contract.findUnique({
      where: { applicationId: application.id },
    });
    if (existingContract) return res.json(existingContract);

    const contract = await (prisma as any).contract.create({
      data: {
        applicationId: application.id,
        jobId: application.jobId,
        jobTitle: application.job?.title || 'Contract Gig',
        company: application.job?.employer?.displayName || 'Employer',
        salary: application.job?.salary || 'RWF 20,000 / Task',
        location: application.job?.location || 'Kigali',
        status: 'accepted',
        workerId: application.workerId,
        employerId: application.job.employerId,
        employerName: application.job?.employer?.displayName || 'Employer',
        daysSinceRequest: 0,
        logo: 'PJ',
        phone: application.worker?.phone || null,
      },
      include: { worker: { select: { id: true, displayName: true } } },
    });
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create contract' });
  }
});

app.patch('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await (prisma as any).contract.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const isEmployer = contract.employerId === req.dbUser?.id;
    const isWorker = contract.workerId === req.dbUser?.id;
    if (req.dbUser?.role !== 'ADMIN' && !isEmployer && !isWorker) {
      return res.status(403).json({ error: 'Forbidden: cannot update this contract' });
    }

    const safe: any = {};
    const body = req.body;
    for (const f of ['status', 'rating', 'review', 'daysSinceRequest', 'commissionPaidWorker', 'commissionPaidEmployer']) {
      if (body[f] !== undefined) safe[f] = body[f];
    }

    const updated = await (prisma as any).contract.update({
      where: { id: contract.id },
      data: safe,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update contract' });
  }
});

// ─── SAVED JOBS ──────────────────────────────────────────────────────────────

app.get('/api/saved-jobs', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot read another user\'s saved jobs' });
    }
    const savedJobs = await (prisma as any).savedJob.findMany({
      where: { userId: userId as string },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(savedJobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

app.post('/api/saved-jobs', async (req, res) => {
  try {
    const { userId, jobId } = req.body;
    if (!userId || !jobId) return res.status(400).json({ error: 'userId and jobId are required' });
    if (req.dbUser?.role !== 'ADMIN' && String(userId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot save a job for another user' });
    }
    const savedJob = await (prisma as any).savedJob.create({
      data: { userId, jobId: parseInt(jobId) },
      include: { job: true },
    });
    res.json(savedJob);
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Job already saved' });
    res.status(500).json({ error: error.message || 'Failed to save job' });
  }
});

app.delete('/api/saved-jobs/:id', async (req, res) => {
  try {
    const savedJob = await (prisma as any).savedJob.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!savedJob) return res.status(404).json({ error: 'Saved job not found' });
    if (req.dbUser?.role !== 'ADMIN' && savedJob.userId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete another user\'s saved job' });
    }
    await (prisma as any).savedJob.delete({ where: { id: savedJob.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saved job' });
  }
});

// ─── BIDS (company subcontracting) ───────────────────────────────────────────

app.get('/api/bids', async (req, res) => {
  try {
    const { companyId, jobId } = req.query;
    const role = req.dbUser?.role;
    const uid = req.dbUser?.id;

    const where: any = {};
    if (companyId) where.companyId = companyId as string;
    if (jobId) where.jobId = parseInt(jobId as string);

    if (role === 'COMPANY') {
      where.companyId = uid;
    } else if (role === 'EMPLOYER') {
      // Employers may see bids placed on their jobs.
      where.job = { employerId: uid };
    }
    // ADMIN sees everything.

    const bids = await (prisma as any).bid.findMany({
      where,
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        company: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

app.post('/api/bids', async (req, res) => {
  try {
    const { companyId, jobId, leadTitle, proposedPrice, proposedStaff, coverLetter, timeline } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });
    // A company may only bid as itself (admins may bid for any).
    if (req.dbUser?.role !== 'ADMIN' && String(companyId) !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot place a bid as another user' });
    }
    const bid = await (prisma as any).bid.create({
      data: {
        companyId,
        jobId: jobId ? parseInt(jobId) : null,
        leadTitle: leadTitle || null,
        proposedPrice: parseInt(proposedPrice || 0),
        proposedStaff: parseInt(proposedStaff || 1),
        coverLetter: coverLetter || '',
        timeline: timeline || '3 Weeks',
      },
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        company: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json(bid);
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Bid already placed for this job' });
    res.status(500).json({ error: error.message || 'Failed to place bid' });
  }
});

app.patch('/api/bids/:id', async (req, res) => {
  try {
    const bid = await (prisma as any).bid.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { job: true },
    });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const isCompany = bid.companyId === req.dbUser?.id;
    const isJobOwner = bid.job?.employerId === req.dbUser?.id;
    if (req.dbUser?.role !== 'ADMIN' && !isCompany && !isJobOwner) {
      return res.status(403).json({ error: 'Forbidden: cannot update this bid' });
    }

    const safe: any = {};
    const body = req.body;
    for (const f of ['proposedPrice', 'proposedStaff', 'coverLetter', 'timeline', 'status']) {
      if (body[f] !== undefined) safe[f] = body[f];
    }

    const updated = await (prisma as any).bid.update({
      where: { id: bid.id },
      data: safe,
      include: {
        job: { include: { employer: { select: { id: true, displayName: true } } } },
        company: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update bid' });
  }
});

app.delete('/api/bids/:id', async (req, res) => {
  try {
    const bid = await (prisma as any).bid.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (req.dbUser?.role !== 'ADMIN' && bid.companyId !== req.dbUser?.id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete this bid' });
    }
    await (prisma as any).bid.delete({ where: { id: bid.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bid' });
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
