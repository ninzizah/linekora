import { useState } from 'react';
import { Star, MessageSquare, ShieldCheck, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion } from 'motion/react';

export default function WorkerReviews() {
  const [reviews, setReviews] = useState<any[]>(() => {
    const defaultReviews = [
      { id: 1, author: 'Jane Nabirye', company: 'Tech Hub', rating: 5, comment: 'Excellent worker, very reliable and punctual. The office was spotless.', date: '2 days ago', task: 'Office Cleaning' },
      { id: 2, author: 'Mark Ssemambo', company: 'Individual', rating: 4, comment: 'Good job overall, though he arrived 10 mins late. Very professional conduct.', date: '1 week ago', task: 'Gardening' },
      { id: 3, author: 'Security Solutions', company: 'SafeGuard', rating: 5, comment: 'Highly recommended for night shifts. Very professional and reliable.', date: '2 weeks ago', task: 'Night Guard' },
    ];

    let contractList: any[] = [];
    const cachedContracts = localStorage.getItem('linekora_contracts');
    if (cachedContracts) {
      try { contractList = JSON.parse(cachedContracts); } catch (e) { contractList = []; }
    }

    const completedWithReviews = contractList.filter(c => c.status === 'completed' && c.rating > 0);
    const convertedReviews = completedWithReviews.map(c => ({
      id: c.id,
      author: c.employerName || 'Employer',
      company: c.company || 'LINEKORA Client',
      rating: c.rating,
      comment: c.review || 'No comment provided.',
      date: 'Just now',
      task: c.jobTitle
    }));

    return [...convertedReviews, ...defaultReviews];
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-black text-gray-900 font-sans tracking-tight">Reviews & Reputation</h1>
          <p className="text-gray-500 font-sans font-medium mt-1 uppercase tracking-widest text-xs">Your professional identity on LINEKORA</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Average Rating</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-5xl font-black text-gray-900 font-sans">4.8</h3>
              <Star className="text-yellow-500 fill-current" size={32} />
            </div>
            <p className="text-xs font-bold text-gray-400 font-sans">Based on 14 reviews</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans mb-2">Completion Rate</p>
            <h3 className="text-5xl font-black text-gray-900 font-sans">98%</h3>
            <p className="text-xs font-bold text-gray-400 font-sans mt-2">Highly Reliable</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm text-center text-white">
            <p className="text-xs font-black text-white/60 uppercase tracking-widest font-sans mb-2">Trust Points</p>
            <h3 className="text-5xl font-black font-sans">720</h3>
            <p className="text-xs font-bold text-white/80 font-sans mt-2 flex items-center justify-center gap-1">
              <ShieldCheck size={12} />
              Gold Tier
            </p>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2 mb-8">
            <MessageSquare className="text-blue-600" size={20} />
            Recent Feedback
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
