import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'rw' | 'fr' | 'sw';

const translations: Record<Language, Record<string, string>> = {
  en: {
    hero_title: 'Find trusted work. Hire trusted people.',
    hero_subtitle: 'LINEKORA is Africa\'s most secure marketplace connecting verified workers with vetted employers.',
    find_jobs: 'Find Jobs',
    hire_workers: 'Hire Workers',
    about: 'About',
    pricing: 'Pricing',
    contact: 'Contact',
    safety: 'Safety',
    login: 'Log in',
    join: 'Join LINEKORA',
    dashboard: 'Dashboard',
    post_job: 'Post Job',
    post_task: 'Post Task',
    browse_workers: 'Browse Workers',
    browse_jobs: 'Browse Jobs',
    profile: 'My Profile',
    applications: 'Applications',
    messages: 'Messages',
    verification: 'Verification',
    reviews: 'Reviews',
    wallet: 'Wallet',
    settings: 'Settings',
    logout: 'Log Out',
    active_jobs: 'Active jobs',
    verified_workers: 'Verified workers',
    verified_companies: 'Verified companies',
    completed_hires: 'Completed hires',
    manage_jobs: 'Manage Jobs',
    applicants: 'Applicants',
    payments: 'Payments',
    analytics: 'Analytics',
    public_home: 'Public Homepage',
    trust_score: 'Trust Score',
  },
  rw: {
    hero_title: 'Gana akazi kayizewe. Nyereka abakozi bizewe.',
    hero_subtitle: 'LINEKORA niyo isoko ryizewe cyane muri Afrika rihuza abakozi bagenzuwe n\'abakoresha bizewe.',
    find_jobs: 'Shaka Akazi',
    hire_workers: 'Shaka Abakozi',
    about: 'Turi Ba Nde',
    pricing: 'Ibiciro',
    contact: 'Twandikire',
    safety: 'Umutekano',
    login: 'Injira',
    join: 'Fatanya na LINEKORA',
    dashboard: 'Imbonerahamwe',
    post_job: 'Shyiraho Akazi',
    post_task: 'Shyiraho Igikorwa',
    browse_workers: 'Shaka Abakozi',
    browse_jobs: 'Shaka Imirimo',
    profile: 'Umwirondoro',
    applications: 'Gusaba Akazi',
    messages: 'Ubutumwa',
    verification: 'Kugenzura',
    reviews: 'Ibitekerezo',
    wallet: 'Uruhu rw\'Amafaranga',
    settings: 'Igenamiterere',
    logout: 'Sohoka',
    active_jobs: 'Imirimo ihari',
    verified_workers: 'Abakozi bagenzuwe',
    verified_companies: 'Ibigo byagenzuwe',
    completed_hires: 'Abahawe akazi',
    manage_jobs: 'Cunga Imirimo',
    applicants: 'Abasaba Akazi',
    payments: 'Kwishura',
    analytics: 'Ibigaragazwa',
    public_home: 'Urubuga Nyamukuru',
    trust_score: 'Amanota y\'ikinyabupfura',
  },
  fr: {
    hero_title: 'Trouvez un travail de confiance. Embauchez des personnes de confiance.',
    hero_subtitle: 'LINEKORA est le marché le plus sécurisé d\'Afrique reliant des travailleurs vérifiés à des employeurs agréés.',
    find_jobs: 'Trouver des Emplois',
    hire_workers: 'Embaucher des Travailleurs',
    about: 'À Propos',
    pricing: 'Tarifs',
    contact: 'Contact',
    safety: 'Sécurité',
    login: 'Se connecter',
    join: 'Rejoindre LINEKORA',
    dashboard: 'Tableau de bord',
    post_job: 'Publier un emploi',
    post_task: 'Publier une tâche',
    browse_workers: 'Parcourir les travailleurs',
    browse_jobs: 'Parcourir les emplois',
    profile: 'Mon profil',
    applications: 'Candidatures',
    messages: 'Messages',
    verification: 'Vérification',
    reviews: 'Avis',
    wallet: 'Portefeuille',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    active_jobs: 'Emplois actifs',
    verified_workers: 'Travailleurs vérifiés',
    verified_companies: 'Entreprises vérifiées',
    completed_hires: 'Embauches terminées',
    manage_jobs: 'Gérer les emplois',
    applicants: 'Candidats',
    payments: 'Paiements',
    analytics: 'Analyses',
    public_home: 'Accueil Public',
    trust_score: 'Score de confiance',
  },
  sw: {
    hero_title: 'Pata kazi ya kuaminika. Ajiri watu wa kuaminika.',
    hero_subtitle: 'LINEKORA ni soko salama zaidi barani Afrika linalounganisha wafanyakazi waliothibitishwa na waajiri wanaoaminika.',
    find_jobs: 'Tafuta Kazi',
    hire_workers: 'Ajiri Wafanyakazi',
    about: 'Kuhusu Sisi',
    pricing: 'Bei',
    contact: 'Wasiliana Nasi',
    safety: 'Usalama',
    login: 'Ingia',
    join: 'Jiunge na LINEKORA',
    dashboard: 'Dashibodi',
    post_job: 'Tuma Kazi',
    post_task: 'Tuma Kazi Ndogo',
    browse_workers: 'Tafuta Wafanyakazi',
    browse_jobs: 'Tafuta Kazi zilizopo',
    profile: 'Wasifu Wangu',
    applications: 'Maombi ya Kazi',
    messages: 'Ujumbe',
    verification: 'Uthibitishaji',
    reviews: 'Mapitio',
    wallet: 'Mkoba wa Pesa',
    settings: 'Mipangilio',
    logout: 'Ondoka',
    active_jobs: 'Kazi zinazoendelea',
    verified_workers: 'Wafanyakazi waliothibitishwa',
    verified_companies: 'Kampuni zilizothibitishwa',
    completed_hires: 'Kazi zilizokamilika',
    manage_jobs: 'Simamia Kazi',
    applicants: 'Waombaji',
    payments: 'Malipo',
    analytics: 'Uchambuzi',
    public_home: 'Ukurasa wa Kwanza',
    trust_score: 'Alama ya Uaminifu',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('linekora_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('linekora_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
