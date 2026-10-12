/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Briefcase, ArrowLeft, Share2 } from 'lucide-react';
import { getJobById, type Job } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleShare = async () => {
    if (!job) return;
    const url = `${window.location.origin}/jobs/${job.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: job.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('link_copied') || 'Link copied');
      }
    } catch (e) {
      // ignore
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline font-bold mb-6">
          <ArrowLeft size={16} />
          {t('back') || 'Back'}
        </Link>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">{job.title}</h1>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-gray-600 hover:border-blue-100 hover:text-blue-600 transition-all"
            >
              <Share2 size={16} />
              {t('share') || 'Share'}
            </button>
          </div>
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
            {job.category && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Briefcase size={15} />
                {job.category}
              </div>
            )}
          </div>
          {job.description && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {job.description}
            </div>
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
    </div>
  );
}
