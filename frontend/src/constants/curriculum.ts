// Curriculum domain taxonomy
export const CATEGORIES = {
  TECHNOLOGY_ENGINEERING: 'Technology & Engineering',
  FINANCE_ACCOUNTING: 'Finance & Accounting',
  BUSINESS_MANAGEMENT: 'Business & Management',
  COMPLIANCE_GOVERNANCE: 'Compliance & Governance',
  DATA_ANALYTICS: 'Data & Analytics',
  DESIGN_CREATIVE: 'Design & Creative',
  MARKETING_SALES: 'Marketing & Sales',
  LANGUAGES_COMMUNICATION: 'Languages & Communication',
} as const;

export const SPECIALIZATIONS: Record<string, string[]> = {
  [CATEGORIES.TECHNOLOGY_ENGINEERING]: [
    'Web Development',
    'Mobile Development',
    'Software Engineering',
    'Data Engineering',
    'DevOps & Infrastructure',
    'Cloud Computing',
    'Database Systems',
    'Cybersecurity',
    'Machine Learning & AI',
    'Game Development',
  ],
  [CATEGORIES.FINANCE_ACCOUNTING]: [
    'Corporate Finance',
    'Investment & Trading',
    'Financial Accounting',
    'Managerial Accounting',
    'Personal Finance',
    'FinTech',
    'Risk Management',
  ],
  [CATEGORIES.BUSINESS_MANAGEMENT]: [
    'Project Management',
    'Product Management',
    'Business Analysis',
    'Entrepreneurship',
    'Operations Management',
    'Strategic Planning',
  ],
  [CATEGORIES.COMPLIANCE_GOVERNANCE]: [
    'Data Privacy',
    'Information Security',
    'Financial Compliance',
    'Healthcare Compliance',
    'IT Governance',
    'Corporate Governance',
    'Environmental Compliance',
  ],
  [CATEGORIES.DATA_ANALYTICS]: [
    'Data Analysis',
    'Business Intelligence',
    'Data Science',
    'Analytics Engineering',
    'Marketing Analytics',
    'Product Analytics',
  ],
  [CATEGORIES.DESIGN_CREATIVE]: [
    'UI/UX Design',
    'Graphic Design',
    'Motion Design',
    '3D Design & Modeling',
    'Game Design',
    'Product Design',
  ],
  [CATEGORIES.MARKETING_SALES]: [
    'Digital Marketing',
    'Growth Marketing',
    'Sales Strategy',
    'Brand Management',
    'Marketing Analytics',
    'Customer Success',
  ],
  [CATEGORIES.LANGUAGES_COMMUNICATION]: [
    'Programming Languages',
    'Foreign Languages',
    'Technical Writing',
    'Business Communication',
    'Public Speaking',
  ],
};

export const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'green', icon: '🟢' },
  { value: 'intermediate', label: 'Intermediate', color: 'yellow', icon: '🟡' },
  { value: 'advanced', label: 'Advanced', color: 'red', icon: '🔴' },
  { value: 'expert', label: 'Expert', color: 'purple', icon: '🟣' },
];

export const getDifficultyLevelInfo = (level: string) => {
  return DIFFICULTY_LEVELS.find((d) => d.value === level) || DIFFICULTY_LEVELS[0];
};

export const getCategoryDisplayName = (category: string): string => {
  return category;
};

export const getSpecializationsForCategory = (category: string): string[] => {
  return SPECIALIZATIONS[category] || [];
};

export const getAllCategories = (): string[] => {
  return Object.values(CATEGORIES);
};
