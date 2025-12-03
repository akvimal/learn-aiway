-- Seed data: Sample curricula across various domains
-- Description: Diverse curriculum examples with proper categorization and difficulty levels

-- First, ensure we have an admin user for curriculum creation
INSERT INTO users (email, password_hash, role, first_name, last_name)
VALUES (
  'admin@ai-learning.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIgHrGK3ei', -- password: Admin123!
  'admin',
  'System',
  'Administrator'
)
ON CONFLICT (email) DO NOTHING;

-- Get admin user ID for reference
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;

  -- ============================================
  -- TECHNOLOGY & ENGINEERING
  -- ============================================

  -- Web Development
  INSERT INTO curricula (title, description, domain, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Frontend Web Development with React',
    'Master modern frontend development using React, JavaScript, and responsive design. Build interactive web applications from scratch.',
    'web development', -- domain (backward compatibility)
    'Technology & Engineering',
    'Web Development',
    'beginner',
    admin_user_id,
    true,
    40,
    ARRAY['react', 'javascript', 'frontend', 'web', 'html', 'css', 'responsive']
  ),
  (
    'Full-Stack Web Development with Node.js',
    'Learn end-to-end web development using Node.js, Express, React, and MongoDB. Build and deploy complete web applications.',
    'Technology & Engineering',
    'Web Development',
    'intermediate',
    admin_user_id,
    true,
    60,
    ARRAY['nodejs', 'express', 'react', 'mongodb', 'fullstack', 'api', 'rest']
  ),
  (
    'Advanced Web Performance Optimization',
    'Deep dive into web performance, including CDN strategies, lazy loading, code splitting, and advanced caching techniques.',
    'Technology & Engineering',
    'Web Development',
    'advanced',
    admin_user_id,
    true,
    30,
    ARRAY['performance', 'optimization', 'cdn', 'caching', 'webpack', 'vite']
  );

  -- Cloud Computing
  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'AWS Cloud Fundamentals',
    'Introduction to Amazon Web Services including EC2, S3, RDS, and basic cloud concepts. Perfect for cloud beginners.',
    'Technology & Engineering',
    'Cloud Computing',
    'beginner',
    admin_user_id,
    true,
    35,
    ARRAY['aws', 'cloud', 'ec2', 's3', 'rds', 'infrastructure']
  ),
  (
    'AWS Solutions Architect Professional',
    'Comprehensive training for designing scalable, highly available systems on AWS. Covers advanced architectures and best practices.',
    'Technology & Engineering',
    'Cloud Computing',
    'advanced',
    admin_user_id,
    true,
    80,
    ARRAY['aws', 'architecture', 'solutions-architect', 'scalability', 'ha', 'dr']
  ),
  (
    'Multi-Cloud Strategy and Management',
    'Learn to design and manage applications across AWS, Azure, and GCP. Master cloud-agnostic architectures and migration strategies.',
    'Technology & Engineering',
    'Cloud Computing',
    'expert',
    admin_user_id,
    true,
    50,
    ARRAY['multi-cloud', 'aws', 'azure', 'gcp', 'strategy', 'migration']
  );

  -- Machine Learning & AI
  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Introduction to Machine Learning',
    'Learn fundamental ML concepts, algorithms, and applications using Python and scikit-learn. No prior ML experience required.',
    'Technology & Engineering',
    'Machine Learning & AI',
    'beginner',
    admin_user_id,
    true,
    45,
    ARRAY['machine-learning', 'python', 'scikit-learn', 'algorithms', 'ai']
  ),
  (
    'Deep Learning and Neural Networks',
    'Master deep learning architectures including CNNs, RNNs, and Transformers using TensorFlow and PyTorch.',
    'Technology & Engineering',
    'Machine Learning & AI',
    'advanced',
    admin_user_id,
    true,
    70,
    ARRAY['deep-learning', 'neural-networks', 'tensorflow', 'pytorch', 'cnn', 'rnn']
  );

  -- Cybersecurity
  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Application Security Fundamentals',
    'Learn essential application security concepts including OWASP Top 10, secure coding practices, and vulnerability assessment.',
    'Technology & Engineering',
    'Cybersecurity',
    'intermediate',
    admin_user_id,
    true,
    40,
    ARRAY['security', 'appsec', 'owasp', 'vulnerabilities', 'secure-coding']
  ),
  (
    'Advanced Penetration Testing',
    'Master advanced penetration testing techniques, exploit development, and security assessment methodologies.',
    'Technology & Engineering',
    'Cybersecurity',
    'expert',
    admin_user_id,
    true,
    60,
    ARRAY['pentesting', 'security', 'hacking', 'exploits', 'assessment']
  );

  -- ============================================
  -- FINANCE & ACCOUNTING
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Financial Accounting Basics',
    'Learn fundamental accounting principles, financial statements, and basic bookkeeping for business transactions.',
    'Finance & Accounting',
    'Financial Accounting',
    'beginner',
    admin_user_id,
    true,
    30,
    ARRAY['accounting', 'financial-statements', 'bookkeeping', 'gaap', 'basics']
  ),
  (
    'Corporate Financial Analysis',
    'Master financial statement analysis, ratio analysis, and financial forecasting for corporate decision-making.',
    'Finance & Accounting',
    'Corporate Finance',
    'intermediate',
    admin_user_id,
    true,
    35,
    ARRAY['finance', 'analysis', 'corporate', 'ratios', 'forecasting']
  ),
  (
    'Investment Banking and M&A',
    'Advanced training in investment banking, mergers & acquisitions, valuation, and deal structuring.',
    'Finance & Accounting',
    'Corporate Finance',
    'advanced',
    admin_user_id,
    true,
    50,
    ARRAY['investment-banking', 'ma', 'valuation', 'deals', 'finance']
  ),
  (
    'Algorithmic Trading Strategies',
    'Learn to design, backtest, and deploy quantitative trading strategies using Python and financial data.',
    'Finance & Accounting',
    'Investment & Trading',
    'expert',
    admin_user_id,
    true,
    60,
    ARRAY['trading', 'algorithms', 'quant', 'python', 'backtesting', 'strategies']
  ),
  (
    'Personal Finance Mastery',
    'Comprehensive guide to personal finance including budgeting, investing, retirement planning, and wealth building.',
    'Finance & Accounting',
    'Personal Finance',
    'beginner',
    admin_user_id,
    true,
    20,
    ARRAY['personal-finance', 'budgeting', 'investing', 'retirement', 'wealth']
  );

  -- ============================================
  -- BUSINESS & MANAGEMENT
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Agile Project Management',
    'Learn Agile methodologies, Scrum framework, sprint planning, and how to lead agile teams effectively.',
    'Business & Management',
    'Project Management',
    'intermediate',
    admin_user_id,
    true,
    30,
    ARRAY['agile', 'scrum', 'project-management', 'sprints', 'kanban']
  ),
  (
    'Product Management Essentials',
    'Master product strategy, roadmapping, user research, and product analytics to build successful products.',
    'Business & Management',
    'Product Management',
    'intermediate',
    admin_user_id,
    true,
    40,
    ARRAY['product-management', 'strategy', 'roadmap', 'analytics', 'user-research']
  ),
  (
    'Startup Entrepreneurship',
    'Complete guide to launching a startup including business models, fundraising, MVP development, and growth strategies.',
    'Business & Management',
    'Entrepreneurship',
    'intermediate',
    admin_user_id,
    true,
    45,
    ARRAY['startup', 'entrepreneurship', 'business-model', 'fundraising', 'mvp']
  );

  -- ============================================
  -- COMPLIANCE & GOVERNANCE
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'GDPR Compliance for Organizations',
    'Comprehensive GDPR training covering data protection principles, consent management, and compliance implementation.',
    'Compliance & Governance',
    'Data Privacy',
    'intermediate',
    admin_user_id,
    true,
    25,
    ARRAY['gdpr', 'privacy', 'compliance', 'data-protection', 'eu']
  ),
  (
    'ISO 27001 Information Security Management',
    'Learn to implement and manage ISO 27001 information security management systems (ISMS) for your organization.',
    'Compliance & Governance',
    'Information Security',
    'advanced',
    admin_user_id,
    true,
    40,
    ARRAY['iso27001', 'isms', 'security', 'compliance', 'audit']
  ),
  (
    'SOX Compliance and Internal Controls',
    'Master Sarbanes-Oxley compliance requirements, internal controls, and audit processes for public companies.',
    'Compliance & Governance',
    'Financial Compliance',
    'advanced',
    admin_user_id,
    true,
    35,
    ARRAY['sox', 'compliance', 'internal-controls', 'audit', 'finance']
  );

  -- ============================================
  -- DATA & ANALYTICS
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Data Analysis with Python',
    'Learn data analysis using Python, pandas, numpy, and data visualization libraries. Perfect for beginners.',
    'Data & Analytics',
    'Data Analysis',
    'beginner',
    admin_user_id,
    true,
    35,
    ARRAY['data-analysis', 'python', 'pandas', 'numpy', 'visualization']
  ),
  (
    'Business Intelligence with Tableau',
    'Master Tableau for creating interactive dashboards, reports, and data visualizations for business insights.',
    'Data & Analytics',
    'Business Intelligence',
    'intermediate',
    admin_user_id,
    true,
    30,
    ARRAY['tableau', 'bi', 'dashboards', 'visualization', 'reporting']
  ),
  (
    'Data Science End-to-End Projects',
    'Complete data science workflow from data collection to model deployment, using real-world case studies.',
    'Data & Analytics',
    'Data Science',
    'advanced',
    admin_user_id,
    true,
    70,
    ARRAY['data-science', 'machine-learning', 'python', 'deployment', 'mlops']
  );

  -- ============================================
  -- DESIGN & CREATIVE
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'UI/UX Design Fundamentals',
    'Learn user interface and user experience design principles, wireframing, prototyping, and usability testing.',
    'Design & Creative',
    'UI/UX Design',
    'beginner',
    admin_user_id,
    true,
    35,
    ARRAY['ux', 'ui', 'design', 'wireframing', 'prototyping', 'figma']
  ),
  (
    'Advanced Product Design Systems',
    'Master design systems, component libraries, and design-to-development workflows for scalable products.',
    'Design & Creative',
    'Product Design',
    'advanced',
    admin_user_id,
    true,
    40,
    ARRAY['design-systems', 'components', 'product-design', 'figma', 'tokens']
  ),
  (
    'Motion Design and Animation',
    'Create engaging animations and motion graphics using After Effects, Lottie, and modern web animation techniques.',
    'Design & Creative',
    'Motion Design',
    'intermediate',
    admin_user_id,
    true,
    45,
    ARRAY['motion-design', 'animation', 'after-effects', 'lottie', 'graphics']
  );

  -- ============================================
  -- MARKETING & SALES
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Digital Marketing Fundamentals',
    'Complete introduction to digital marketing including SEO, SEM, social media, content marketing, and analytics.',
    'Marketing & Sales',
    'Digital Marketing',
    'beginner',
    admin_user_id,
    true,
    30,
    ARRAY['digital-marketing', 'seo', 'sem', 'social-media', 'content']
  ),
  (
    'Growth Marketing and Growth Hacking',
    'Learn growth marketing strategies, viral loops, A/B testing, and data-driven growth techniques for startups.',
    'Marketing & Sales',
    'Growth Marketing',
    'intermediate',
    admin_user_id,
    true,
    35,
    ARRAY['growth-marketing', 'growth-hacking', 'ab-testing', 'viral', 'metrics']
  ),
  (
    'B2B Sales Strategy and Execution',
    'Master B2B sales processes, enterprise selling, account-based marketing, and sales team leadership.',
    'Marketing & Sales',
    'Sales Strategy',
    'advanced',
    admin_user_id,
    true,
    40,
    ARRAY['b2b', 'sales', 'enterprise', 'account-based', 'strategy']
  );

  -- ============================================
  -- LANGUAGES & COMMUNICATION
  -- ============================================

  INSERT INTO curricula (title, description, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags) VALUES
  (
    'Python Programming for Beginners',
    'Learn Python from scratch including syntax, data structures, OOP, and build practical projects.',
    'Languages & Communication',
    'Programming Languages',
    'beginner',
    admin_user_id,
    true,
    40,
    ARRAY['python', 'programming', 'coding', 'oop', 'beginner']
  ),
  (
    'Advanced JavaScript and TypeScript',
    'Master advanced JavaScript concepts, TypeScript, async programming, and modern ES6+ features.',
    'Languages & Communication',
    'Programming Languages',
    'advanced',
    admin_user_id,
    true,
    50,
    ARRAY['javascript', 'typescript', 'es6', 'async', 'advanced']
  ),
  (
    'Technical Writing for Developers',
    'Learn to write clear technical documentation, API docs, tutorials, and user guides for software products.',
    'Languages & Communication',
    'Technical Writing',
    'intermediate',
    admin_user_id,
    true,
    20,
    ARRAY['technical-writing', 'documentation', 'api-docs', 'writing']
  ),
  (
    'Business Spanish for Professionals',
    'Learn Spanish for business contexts including negotiations, presentations, and professional communication.',
    'Languages & Communication',
    'Foreign Languages',
    'intermediate',
    admin_user_id,
    true,
    60,
    ARRAY['spanish', 'business', 'language', 'communication', 'professional']
  );

END $$;
