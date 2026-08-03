import { useState } from 'react';
import { Star, MessageSquare, ShieldCheck, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'motion/react';
import { useLanguage } from '../../lib/LanguageContext';

export default function WorkerReviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<any[]>(() => {
    let contractList: any[] = [];
    const cachedContracts = localStorage.getItem('linekora_contracts');
    if (cachedContracts) {
      try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
    }

    const completedWithReviews = contractList.filter(c => c.status === 'completed' && c.rating > 0);
    const convertedReviews = completedWithReviews.map(c => ({
      id: c.id,
      author: c.employerName || t('employer'),
      company: c.company || t('linekora_client'),
      rating: c.rating,
      comment: c.review || t('no_comment_provided'),
      date: t('just_now'),
      task: c.jobTitle
    }));

    return convertedReviews;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">{t('reviews_reputation')}</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 uppercase tracking-widest text-xs">{t('reviews_identity_subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">{t('average_rating')}</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-5xl font-black text-gray-900 font-sans">{reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}</h3>
              <Star className="text-yellow-500 fill-current" size={32} />
            </div>
            <p className="text-xs font-bold text-gray-400 font-sans">{t(reviews.length === 1 ? 'based_on_review' : 'based_on_reviews', { count: reviews.length })}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">{t('reviews')}</p>
            <h3 className="text-5xl font-black text-gray-900 font-sans">{reviews.length}</h3>
            <p className="text-xs font-bold text-gray-400 font-sans mt-2">{reviews.length > 0 ? t('active') : t('no_reviews_yet')}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm text-center text-white">
            <p className="text-xs font-black text-white/60 uppercase tracking-widest font-sans mb-2">{t('reputation')}</p>
            <h3 className="text-5xl font-black font-sans">{reviews.length}</h3>
            <p className="text-xs font-bold text-white/80 font-sans mt-2 flex items-center justify-center gap-1">
              <ShieldCheck size={12} />
              {reviews.length >= 10 ? t('gold_tier') : t('new_member')}
            </p>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2 mb-8">
            <MessageSquare className="text-blue-600" size={20} />
            {t('recent_feedback')}
          </h2>
          
          {reviews.map((rev, i) => (
            <motion.div 
              key={rev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-gray-900">{rev.author}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">{rev.company}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < rev.rating ? 'text-yellow-500 fill-current' : 'text-gray-200'} />
                  ))}
                </div>
              </div>

              <p className="text-gray-600 font-sans leading-relaxed italic mb-6">"{rev.comment}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter font-sans">
                  {rev.task}
                </span>
                <span className="text-xs font-bold text-gray-400 font-sans">{rev.date}</span>
              </div>
            </motion.div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
