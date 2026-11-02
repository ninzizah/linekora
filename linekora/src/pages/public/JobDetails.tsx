/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Briefcase, ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import { getJobById, type Job } from '../../lib/api';
import { getJobCategory } from '../../lib/jobCategories';
import { useLanguage } from '../../lib/LanguageContext';
import Seo, { absoluteUrl } from '../../components/Seo';
import SocialShare from '../../components/SocialShare';
import PublicProfileModal from '../../components/PublicProfileModal';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompany, setShowCompany] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await getJobById(Number(id));
        setJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-4">
        <h1 className="text-xl font-black text-gray-900">{t('job_not_found') || 'Job not found'}</h1>
        <Link to="/" className="text-blue-600 hover:underline font-bold">
          {t('back_to_home') || 'Back to home'}
        </Link>
      </div>
    );
  }

  const companyName = job.employer?.displayName || t('company_information');
  const categoryLabel = (() => {
    const labelKey = getJobCategory(job.category)?.labelKey;
    return labelKey ? t(labelKey) : job.category || '';
  })();
  const shareUrl = absoluteUrl(`/jobs/${job.id}`);
  const shareDescription = [job.location, job.salary, categoryLabel].filter(Boolean).join(' • ');
  const seoDescription = `${job.title} at ${companyName}${shareDescription ? ` — ${shareDescription}` : ''}. Apply on LINEKORA.`;
  const jobJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    employmentType: job.jobType || 'OTHER',
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      ...(job.employer?.avatarUrl ? { logo: job.employer.avatarUrl } : {}),
    },
    ...(job.location ? { jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location } } } : {}),
    ...(job.salary ? { baseSalary: { '@type': 'MonetaryAmount', currency: 'RWF', value: { '@type': 'QuantitativeValue', value: job.salary } } } : {}),
    ...(categoryLabel ? { occupationalCategory: categoryLabel } : {}),
    url: shareUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Seo
        title={job.title}
        description={seoDescription}
        path={`/jobs/${job.id}`}
        image={job.employer?.avatarUrl || '/linekora-logo.png'}
        jsonLd={jobJsonLd}
      />
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline font-bold mb-6">
          <ArrowLeft size={16} />
          {t('back') || 'Back'}
        </Link>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">{job.title}</h1>
          </div>
          <SocialShare
            url={shareUrl}
            title={`${job.title} | LINEKORA`}
            description={shareDescription}
            className="mb-5"
          />
          {job.employer?.displayName && (
            <p className="text-gray-500 font-bold mb-6">{job.employer.displayName}</p>
          )}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
              <MapPin size={15} />
              {job.location}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
              <DollarSign size={15} />
              {job.salary}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
              <Clock size={15} />
              {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
            </div>
            {categoryLabel && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Briefcase size={15} />
                {categoryLabel}
              </div>
            )}
          </div>
          {job.description && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {job.description}
            </div>
          )}

          {job.employer && (
            <button
              type="button"
              onClick={() => setShowCompany(true)}
              className="mt-8 w-full text-left p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/40 transition-all flex items-center gap-4"
            >
              {job.employer.avatarUrl ? (
                <img
                  src={job.employer.avatarUrl}
                  alt={companyName}
                  className="h-12 w-12 rounded-xl object-cover border border-gray-200 bg-white"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-blue-600">
                  <Building2 size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('company_information')}</p>
                <p className="font-black text-gray-900 truncate">{companyName}</p>
                <p className="text-xs font-bold text-gray-500 truncate">
                  {[job.employer.industry, job.employer.location].filter(Boolean).join(' • ') || t('view_profile')}
                </p>
              </div>
              {job.employer.verificationStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-600">
                  <ShieldCheck size={13} />
                  {t('verified')}
                </span>
              )}
            </button>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t('apply_on_platform') || 'Apply on LINEKORA to get started.'}
            </p>
            <Link to="/register" className="inline-block mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold">
              {t('register_to_apply') || 'Register to Apply'}
            </Link>
          </div>
        </div>
      </div>

      <PublicProfileModal
        user={
          job.employer
            ? {
                id: job.employer.id,
                displayName: job.employer.displayName,
                role: 'COMPANY',
                location: job.employer.location,
                avatarUrl: job.employer.avatarUrl,
                industry: job.employer.industry,
                verificationStatus: job.employer.verificationStatus,
              }
            : null
        }
        isOpen={showCompany}
        onClose={() => setShowCompany(false)}
      />
    </div>
  );
}
