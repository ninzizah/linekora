export interface JobCategoryMeta {
  value: string;
  labelKey: string;
  min: number;
  max: number;
  range: string;
  tags: string[];
}

/**
 * Single source of truth for job categories.
 *
 * Both posting flows (company/PostJob and employer/PostTask) and the worker
 * marketplace (worker/BrowseJobs) read from this list so a job posted in one
 * place can always be found from the other.
 */
export const JOB_CATEGORIES: JobCategoryMeta[] = [
  {
    value: 'Construction',
    labelKey: 'category_construction',
    min: 15000,
    max: 150000,
    range: '15,000 - 150,000 RWF',
    tags: ['Masonry', 'Concrete Works', 'Steel Fixing', 'Roofing', 'Tiling', 'Painting'],
  },
  {
    value: 'Domestic Help',
    labelKey: 'category_domestic_help',
    min: 5000,
    max: 20000,
    range: '5,000 - 20,000 RWF',
    tags: ['House Cleaning', 'Laundry / Ironing', 'Cooking', 'Childcare', 'Shopping Errands'],
  },
  {
    value: 'Cleaning Services',
    labelKey: 'category_cleaning_services',
    min: 5000,
    max: 15000,
    range: '5,000 - 15,000 RWF',
    tags: ['Floor Mopping', 'Dishes & Kitchen', 'Laundry / Ironing', 'Window Washing', 'Bathroom Sanitation', 'Dusting'],
  },
  {
    value: 'Plumbing',
    labelKey: 'category_plumbing',
    min: 15000,
    max: 45000,
    range: '15,000 - 45,000 RWF',
    tags: ['Pipe Fitting', 'Emergency Leaks', 'Clogged Drain', 'Sewer Check', 'Tap & Shower Install'],
  },
  {
    value: 'Electrical',
    labelKey: 'category_electrical',
    min: 15000,
    max: 60000,
    range: '15,000 - 60,000 RWF',
    tags: ['Wiring', 'Socket Installation', 'Lighting Repair', 'Solar Installation', 'Fault Finding'],
  },
  {
    value: 'Carpentry',
    labelKey: 'category_carpentry',
    min: 15000,
    max: 60000,
    range: '15,000 - 60,000 RWF',
    tags: ['Furniture Repair', 'Door Installation', 'Wardrobe Making', 'Roof Timber', 'Wood Polishing'],
  },
  {
    value: 'Mechanical',
    labelKey: 'category_mechanical',
    min: 20000,
    max: 75000,
    range: '20,000 - 75,000 RWF',
    tags: ['Car Alternator', 'Brake Pads Replacement', 'Engine Noise Check', 'Moto Maintenance', 'Battery Boost'],
  },
  {
    value: 'Security',
    labelKey: 'category_security',
    min: 10000,
    max: 35000,
    range: '10,000 - 35,000 RWF',
    tags: ['Overnight Patrol', 'Gate Registry', 'CCTV Setup Check', 'Access Control'],
  },
  {
    value: 'Logistics',
    labelKey: 'category_logistics',
    min: 10000,
    max: 50000,
    range: '10,000 - 50,000 RWF',
    tags: ['Warehouse Work', 'Stock Loading', 'Route Planning', 'Inventory Count'],
  },
  {
    value: 'Delivery',
    labelKey: 'category_delivery',
    min: 5000,
    max: 30000,
    range: '5,000 - 30,000 RWF',
    tags: ['Food Delivery', 'Parcel Delivery', 'Moto Delivery', 'Same-Day Delivery'],
  },
  {
    value: 'Driving',
    labelKey: 'category_driving',
    min: 15000,
    max: 60000,
    range: '15,000 - 60,000 RWF',
    tags: ['Personal Driver', 'Truck Driving', 'School Transport', 'Airport Transfer'],
  },
  {
    value: 'Agriculture',
    labelKey: 'category_agriculture',
    min: 5000,
    max: 30000,
    range: '5,000 - 30,000 RWF',
    tags: ['Planting', 'Harvesting', 'Irrigation', 'Livestock Care', 'Coffee Sorting'],
  },
  {
    value: 'Gardening & Landscaping',
    labelKey: 'category_gardening',
    min: 5000,
    max: 20000,
    range: '5,000 - 20,000 RWF',
    tags: ['Lawn Mowing', 'Hedge Trimming', 'Weed Control', 'Soil Tilling', 'Fencing repair'],
  },
  {
    value: 'Hospitality',
    labelKey: 'category_hospitality',
    min: 10000,
    max: 50000,
    range: '10,000 - 50,000 RWF',
    tags: ['Waiter / Waitress', 'Hotel Reception', 'Housekeeping', 'Barista', 'Tour Guide'],
  },
  {
    value: 'Food Service',
    labelKey: 'category_food_service',
    min: 7000,
    max: 30000,
    range: '7,000 - 30,000 RWF',
    tags: ['Cooking', 'Catering', 'Server & Catering', 'Dishwashing', 'Baking'],
  },
  {
    value: 'Events',
    labelKey: 'category_events',
    min: 7000,
    max: 18000,
    range: '7,000 - 18,000 RWF',
    tags: ['Marquee Decor', 'Server & Catering', 'Guest ushering', 'Exhibition Clean up'],
  },
  {
    value: 'Childcare',
    labelKey: 'category_childcare',
    min: 8000,
    max: 30000,
    range: '8,000 - 30,000 RWF',
    tags: ['Babysitting', 'School Pickup', 'Feeding', 'Homework Help'],
  },
  {
    value: 'Healthcare',
    labelKey: 'category_healthcare',
    min: 20000,
    max: 100000,
    range: '20,000 - 100,000 RWF',
    tags: ['Caregiving', 'Nursing Support', 'Physiotherapy', 'Lab Assistant'],
  },
  {
    value: 'Education & Tutoring',
    labelKey: 'category_education',
    min: 10000,
    max: 50000,
    range: '10,000 - 50,000 RWF',
    tags: ['Math Tutoring', 'English Tutoring', 'Exam Prep', 'Computer Lessons'],
  },
  {
    value: 'IT & Tech',
    labelKey: 'category_it_tech',
    min: 20000,
    max: 150000,
    range: '20,000 - 150,000 RWF',
    tags: ['Web Development', 'Computer Repair', 'Network Setup', 'Data Entry', 'Social Media'],
  },
  {
    value: 'Creative',
    labelKey: 'category_creative',
    min: 10000,
    max: 100000,
    range: '10,000 - 100,000 RWF',
    tags: ['Graphic Design', 'Photography', 'Videography', 'Music', 'Writing'],
  },
  {
    value: 'Marketing & Media',
    labelKey: 'category_marketing_media',
    min: 15000,
    max: 80000,
    range: '15,000 - 80,000 RWF',
    tags: ['Social Media', 'Content Creation', 'Advertising', 'Brand Promotion'],
  },
  {
    value: 'Office Jobs',
    labelKey: 'category_office_jobs',
    min: 20000,
    max: 120000,
    range: '20,000 - 120,000 RWF',
    tags: ['Data Entry', 'Receptionist', 'Administrative Support', 'Filing', 'Scheduling'],
  },
  {
    value: 'Retail & Sales',
    labelKey: 'category_retail_sales',
    min: 10000,
    max: 60000,
    range: '10,000 - 60,000 RWF',
    tags: ['Shop Assistant', 'Cashier', 'Sales Agent', 'Merchandising'],
  },
  {
    value: 'Beauty & Wellness',
    labelKey: 'category_beauty_wellness',
    min: 8000,
    max: 50000,
    range: '8,000 - 50,000 RWF',
    tags: ['Hair Styling', 'Makeup', 'Nails', 'Massage', 'Barbering'],
  },
  {
    value: 'Tailoring & Fashion',
    labelKey: 'category_tailoring',
    min: 8000,
    max: 50000,
    range: '8,000 - 50,000 RWF',
    tags: ['Dressmaking', 'Alterations', 'Embroidery', 'Fashion Design'],
  },
  {
    value: 'Accounting & Finance',
    labelKey: 'category_accounting',
    min: 20000,
    max: 120000,
    range: '20,000 - 120,000 RWF',
    tags: ['Bookkeeping', 'Tax Filing', 'Payroll', 'Financial Reporting'],
  },
  {
    value: 'Customer Service',
    labelKey: 'category_customer_service',
    min: 15000,
    max: 60000,
    range: '15,000 - 60,000 RWF',
    tags: ['Call Center', 'Client Support', 'Complaint Handling', 'Chat Support'],
  },
  {
    value: 'Moving & Relocation',
    labelKey: 'category_moving',
    min: 12000,
    max: 40000,
    range: '12,000 - 40,000 RWF',
    tags: ['Heavy Couch Lifting', 'Fragile packing', 'Truck loading', 'Furniture reassembly'],
  },
  {
    value: 'Other',
    labelKey: 'category_other',
    min: 5000,
    max: 100000,
    range: '5,000 - 100,000 RWF',
    tags: ['General Labor', 'Errands', 'Special Request'],
  },
];

/**
 * Older categories that may still exist on jobs already stored in the
 * database. They are folded into the canonical list above so filtering and
 * labels stay consistent without a data migration.
 */
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'Domestic Cleaning': 'Cleaning Services',
  'Plumbing Repairs': 'Plumbing',
  'Garden Work': 'Gardening & Landscaping',
  'Mechanical Repairs': 'Mechanical',
  'Security / Guard': 'Security',
  'Event Helper': 'Events',
  'Moving Support': 'Moving & Relocation',
  Cleaning: 'Cleaning Services',
  Mechanic: 'Mechanical',
  'Office jobs': 'Office Jobs',
  IT: 'IT & Tech',
  Admin: 'Office Jobs',
};

export const normalizeJobCategory = (value?: string | null): string => {
  if (!value) return '';
  return LEGACY_CATEGORY_ALIASES[value] || value;
};

export const getJobCategory = (value?: string | null): JobCategoryMeta | undefined => {
  const normalized = normalizeJobCategory(value);
  return JOB_CATEGORIES.find((category) => category.value === normalized);
};

export const jobCategoryLabelKey = (value?: string | null): string =>
  getJobCategory(value)?.labelKey || '';

export const jobCategoryTags = (value?: string | null): string[] =>
  getJobCategory(value)?.tags || [];

export const matchesJobCategory = (
  jobCategory?: string | null,
  selectedCategory?: string | null
): boolean => {
  if (!selectedCategory) return true;
  return normalizeJobCategory(jobCategory) === normalizeJobCategory(selectedCategory);
};
