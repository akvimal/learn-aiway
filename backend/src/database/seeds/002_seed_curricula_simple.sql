-- Simplified seed data: Sample curricula across various domains
-- Uses specialization as domain for backward compatibility

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

-- Insert curricula with computed domain from specialization
WITH admin_user AS (
  SELECT id FROM users WHERE role = 'admin' LIMIT 1
)
INSERT INTO curricula (title, description, domain, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags)
SELECT t.title, t.description, t.domain, t.category, t.specialization, t.difficulty_level::difficulty_level, t.created_by, t.is_published, t.estimated_duration_hours, t.tags FROM (VALUES
  -- Technology & Engineering > Web Development
  ('Frontend Web Development with React', 'Master modern frontend development using React, JavaScript, and responsive design. Build interactive web applications from scratch.', 'web development', 'Technology & Engineering', 'Web Development', 'beginner', (SELECT id FROM admin_user), true, 40, ARRAY['react', 'javascript', 'frontend', 'web', 'html', 'css', 'responsive']),
  ('Full-Stack Web Development with Node.js', 'Learn end-to-end web development using Node.js, Express, React, and MongoDB. Build and deploy complete web applications.', 'web development', 'Technology & Engineering', 'Web Development', 'intermediate', (SELECT id FROM admin_user), true, 60, ARRAY['nodejs', 'express', 'react', 'mongodb', 'fullstack', 'api', 'rest']),
  ('Advanced Web Performance Optimization', 'Deep dive into web performance, including CDN strategies, lazy loading, code splitting, and advanced caching techniques.', 'web development', 'Technology & Engineering', 'Web Development', 'advanced', (SELECT id FROM admin_user), true, 30, ARRAY['performance', 'optimization', 'cdn', 'caching', 'webpack', 'vite']),

  -- Technology & Engineering > Cloud Computing
  ('AWS Cloud Fundamentals', 'Introduction to Amazon Web Services including EC2, S3, RDS, and basic cloud concepts. Perfect for cloud beginners.', 'cloud', 'Technology & Engineering', 'Cloud Computing', 'beginner', (SELECT id FROM admin_user), true, 35, ARRAY['aws', 'cloud', 'ec2', 's3', 'rds', 'infrastructure']),
  ('AWS Solutions Architect Professional', 'Comprehensive training for designing scalable, highly available systems on AWS. Covers advanced architectures and best practices.', 'cloud', 'Technology & Engineering', 'Cloud Computing', 'advanced', (SELECT id FROM admin_user), true, 80, ARRAY['aws', 'architecture', 'solutions-architect', 'scalability', 'ha', 'dr']),
  ('Multi-Cloud Strategy and Management', 'Learn to design and manage applications across AWS, Azure, and GCP. Master cloud-agnostic architectures and migration strategies.', 'cloud', 'Technology & Engineering', 'Cloud Computing', 'expert', (SELECT id FROM admin_user), true, 50, ARRAY['multi-cloud', 'aws', 'azure', 'gcp', 'strategy', 'migration']),

  -- Technology & Engineering > Machine Learning & AI
  ('Introduction to Machine Learning', 'Learn fundamental ML concepts, algorithms, and applications using Python and scikit-learn. No prior ML experience required.', 'machine learning', 'Technology & Engineering', 'Machine Learning & AI', 'beginner', (SELECT id FROM admin_user), true, 45, ARRAY['machine-learning', 'python', 'scikit-learn', 'algorithms', 'ai']),
  ('Deep Learning and Neural Networks', 'Master deep learning architectures including CNNs, RNNs, and Transformers using TensorFlow and PyTorch.', 'machine learning', 'Technology & Engineering', 'Machine Learning & AI', 'advanced', (SELECT id FROM admin_user), true, 70, ARRAY['deep-learning', 'neural-networks', 'tensorflow', 'pytorch', 'cnn', 'rnn']),

  -- Technology & Engineering > Cybersecurity
  ('Application Security Fundamentals', 'Learn essential application security concepts including OWASP Top 10, secure coding practices, and vulnerability assessment.', 'security', 'Technology & Engineering', 'Cybersecurity', 'intermediate', (SELECT id FROM admin_user), true, 40, ARRAY['security', 'appsec', 'owasp', 'vulnerabilities', 'secure-coding']),
  ('Advanced Penetration Testing', 'Master advanced penetration testing techniques, exploit development, and security assessment methodologies.', 'security', 'Technology & Engineering', 'Cybersecurity', 'expert', (SELECT id FROM admin_user), true, 60, ARRAY['pentesting', 'security', 'hacking', 'exploits', 'assessment']),

  -- Finance & Accounting
  ('Financial Accounting Basics', 'Learn fundamental accounting principles, financial statements, and basic bookkeeping for business transactions.', 'accounting', 'Finance & Accounting', 'Financial Accounting', 'beginner', (SELECT id FROM admin_user), true, 30, ARRAY['accounting', 'financial-statements', 'bookkeeping', 'gaap', 'basics']),
  ('Corporate Financial Analysis', 'Master financial statement analysis, ratio analysis, and financial forecasting for corporate decision-making.', 'finance', 'Finance & Accounting', 'Corporate Finance', 'intermediate', (SELECT id FROM admin_user), true, 35, ARRAY['finance', 'analysis', 'corporate', 'ratios', 'forecasting']),
  ('Investment Banking and M&A', 'Advanced training in investment banking, mergers & acquisitions, valuation, and deal structuring.', 'finance', 'Finance & Accounting', 'Corporate Finance', 'advanced', (SELECT id FROM admin_user), true, 50, ARRAY['investment-banking', 'ma', 'valuation', 'deals', 'finance']),
  ('Algorithmic Trading Strategies', 'Learn to design, backtest, and deploy quantitative trading strategies using Python and financial data.', 'trading', 'Finance & Accounting', 'Investment & Trading', 'expert', (SELECT id FROM admin_user), true, 60, ARRAY['trading', 'algorithms', 'quant', 'python', 'backtesting', 'strategies']),
  ('Personal Finance Mastery', 'Comprehensive guide to personal finance including budgeting, investing, retirement planning, and wealth building.', 'personal finance', 'Finance & Accounting', 'Personal Finance', 'beginner', (SELECT id FROM admin_user), true, 20, ARRAY['personal-finance', 'budgeting', 'investing', 'retirement', 'wealth']),

  -- Business & Management
  ('Agile Project Management', 'Learn Agile methodologies, Scrum framework, sprint planning, and how to lead agile teams effectively.', 'project management', 'Business & Management', 'Project Management', 'intermediate', (SELECT id FROM admin_user), true, 30, ARRAY['agile', 'scrum', 'project-management', 'sprints', 'kanban']),
  ('Product Management Essentials', 'Master product strategy, roadmapping, user research, and product analytics to build successful products.', 'product management', 'Business & Management', 'Product Management', 'intermediate', (SELECT id FROM admin_user), true, 40, ARRAY['product-management', 'strategy', 'roadmap', 'analytics', 'user-research']),
  ('Startup Entrepreneurship', 'Complete guide to launching a startup including business models, fundraising, MVP development, and growth strategies.', 'entrepreneurship', 'Business & Management', 'Entrepreneurship', 'intermediate', (SELECT id FROM admin_user), true, 45, ARRAY['startup', 'entrepreneurship', 'business-model', 'fundraising', 'mvp']),

  -- Compliance & Governance
  ('GDPR Compliance for Organizations', 'Comprehensive GDPR training covering data protection principles, consent management, and compliance implementation.', 'compliance', 'Compliance & Governance', 'Data Privacy', 'intermediate', (SELECT id FROM admin_user), true, 25, ARRAY['gdpr', 'privacy', 'compliance', 'data-protection', 'eu']),
  ('ISO 27001 Information Security Management', 'Learn to implement and manage ISO 27001 information security management systems (ISMS) for your organization.', 'compliance', 'Compliance & Governance', 'Information Security', 'advanced', (SELECT id FROM admin_user), true, 40, ARRAY['iso27001', 'isms', 'security', 'compliance', 'audit']),
  ('SOX Compliance and Internal Controls', 'Master Sarbanes-Oxley compliance requirements, internal controls, and audit processes for public companies.', 'compliance', 'Compliance & Governance', 'Financial Compliance', 'advanced', (SELECT id FROM admin_user), true, 35, ARRAY['sox', 'compliance', 'internal-controls', 'audit', 'finance']),

  -- Data & Analytics
  ('Data Analysis with Python', 'Learn data analysis using Python, pandas, numpy, and data visualization libraries. Perfect for beginners.', 'data analysis', 'Data & Analytics', 'Data Analysis', 'beginner', (SELECT id FROM admin_user), true, 35, ARRAY['data-analysis', 'python', 'pandas', 'numpy', 'visualization']),
  ('Business Intelligence with Tableau', 'Master Tableau for creating interactive dashboards, reports, and data visualizations for business insights.', 'business intelligence', 'Data & Analytics', 'Business Intelligence', 'intermediate', (SELECT id FROM admin_user), true, 30, ARRAY['tableau', 'bi', 'dashboards', 'visualization', 'reporting']),
  ('Data Science End-to-End Projects', 'Complete data science workflow from data collection to model deployment, using real-world case studies.', 'data science', 'Data & Analytics', 'Data Science', 'advanced', (SELECT id FROM admin_user), true, 70, ARRAY['data-science', 'machine-learning', 'python', 'deployment', 'mlops']),

  -- Design & Creative
  ('UI/UX Design Fundamentals', 'Learn user interface and user experience design principles, wireframing, prototyping, and usability testing.', 'design', 'Design & Creative', 'UI/UX Design', 'beginner', (SELECT id FROM admin_user), true, 35, ARRAY['ux', 'ui', 'design', 'wireframing', 'prototyping', 'figma']),
  ('Advanced Product Design Systems', 'Master design systems, component libraries, and design-to-development workflows for scalable products.', 'design', 'Design & Creative', 'Product Design', 'advanced', (SELECT id FROM admin_user), true, 40, ARRAY['design-systems', 'components', 'product-design', 'figma', 'tokens']),
  ('Motion Design and Animation', 'Create engaging animations and motion graphics using After Effects, Lottie, and modern web animation techniques.', 'design', 'Design & Creative', 'Motion Design', 'intermediate', (SELECT id FROM admin_user), true, 45, ARRAY['motion-design', 'animation', 'after-effects', 'lottie', 'graphics']),

  -- Marketing & Sales
  ('Digital Marketing Fundamentals', 'Complete introduction to digital marketing including SEO, SEM, social media, content marketing, and analytics.', 'marketing', 'Marketing & Sales', 'Digital Marketing', 'beginner', (SELECT id FROM admin_user), true, 30, ARRAY['digital-marketing', 'seo', 'sem', 'social-media', 'content']),
  ('Growth Marketing and Growth Hacking', 'Learn growth marketing strategies, viral loops, A/B testing, and data-driven growth techniques for startups.', 'marketing', 'Marketing & Sales', 'Growth Marketing', 'intermediate', (SELECT id FROM admin_user), true, 35, ARRAY['growth-marketing', 'growth-hacking', 'ab-testing', 'viral', 'metrics']),
  ('B2B Sales Strategy and Execution', 'Master B2B sales processes, enterprise selling, account-based marketing, and sales team leadership.', 'sales', 'Marketing & Sales', 'Sales Strategy', 'advanced', (SELECT id FROM admin_user), true, 40, ARRAY['b2b', 'sales', 'enterprise', 'account-based', 'strategy']),

  -- Languages & Communication
  ('Python Programming for Beginners', 'Learn Python from scratch including syntax, data structures, OOP, and build practical projects.', 'programming', 'Languages & Communication', 'Programming Languages', 'beginner', (SELECT id FROM admin_user), true, 40, ARRAY['python', 'programming', 'coding', 'oop', 'beginner']),
  ('Advanced JavaScript and TypeScript', 'Master advanced JavaScript concepts, TypeScript, async programming, and modern ES6+ features.', 'programming', 'Languages & Communication', 'Programming Languages', 'advanced', (SELECT id FROM admin_user), true, 50, ARRAY['javascript', 'typescript', 'es6', 'async', 'advanced']),
  ('Technical Writing for Developers', 'Learn to write clear technical documentation, API docs, tutorials, and user guides for software products.', 'technical writing', 'Languages & Communication', 'Technical Writing', 'intermediate', (SELECT id FROM admin_user), true, 20, ARRAY['technical-writing', 'documentation', 'api-docs', 'writing']),
  ('Business Spanish for Professionals', 'Learn Spanish for business contexts including negotiations, presentations, and professional communication.', 'language', 'Languages & Communication', 'Foreign Languages', 'intermediate', (SELECT id FROM admin_user), true, 60, ARRAY['spanish', 'business', 'language', 'communication', 'professional'])
) AS t(title, description, domain, category, specialization, difficulty_level, created_by, is_published, estimated_duration_hours, tags);
