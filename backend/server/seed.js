const User = require('./models/User');
const Project = require('./models/Project');
const Document = require('./models/Document');

const users = [
  {
    name: 'System Administrator',
    email: 'admin@genessence.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Project Manager',
    email: 'manager@genessence.com',
    password: 'manager123',
    role: 'manager'
  },
  {
    name: 'Guest Viewer',
    email: 'viewer@genessence.com',
    password: 'viewer123',
    role: 'viewer'
  }
];

const projects = [
  {
    projectName: 'Alpha Research & Diagnostics Integration',
    spocs: ['Kavya Chopra', 'Karan'],
    scopeDoc: 'Alpha Scope Document v1.2',
    projectNumber: 'GPMP-001',
    projectAmount: 1250000,
    projectStatus: 'In Progress',
    projectManager: 'Kavya Chopra',
    description: 'R&D initiative integrating genome diagnostics flow with central patient portal.',
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-12-20')
  },
  {
    projectName: 'Beta Biotech Clinical Phase 2',
    spocs: ['Sarah Jenkins', 'Abhishek'],
    scopeDoc: 'Immunology Phase 2 Trials Plan',
    projectNumber: 'GPMP-002',
    projectAmount: 3450000,
    projectStatus: 'In Progress',
    projectManager: 'Sarah Jenkins',
    description: 'Clinical evaluation monitoring for secondary immunology booster vaccines.',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2027-06-30')
  },
  {
    projectName: 'Gamma Sequence Analytics Platform',
    spocs: ['John Davis', 'Girish'],
    scopeDoc: 'Gamma Sequencing Software Req Spec',
    projectNumber: 'GPMP-003',
    projectAmount: 890000,
    projectStatus: 'Completed',
    projectManager: 'John Davis',
    description: 'Custom bio-informatics sequencing analytical tool implementation and QA rollout.',
    startDate: new Date('2025-06-15'),
    endDate: new Date('2026-05-30')
  },
  {
    projectName: 'Delta Immunology Trials & Compliance',
    spocs: ['Emily Smith'],
    scopeDoc: 'Delta Safety Audit Protocol v4',
    projectNumber: 'GPMP-004',
    projectAmount: 4120000,
    projectStatus: 'On Hold',
    projectManager: 'Emily Smith',
    description: 'Regulatory audit coordination and safety profile tracking across multiple trials.',
    startDate: new Date('2026-02-15'),
    endDate: new Date('2027-02-15')
  },
  {
    projectName: 'Epsilon Genetic Mapping Core v3',
    spocs: ['David Miller'],
    scopeDoc: 'High Throughput Mapping Proposal',
    projectNumber: 'GPMP-005',
    projectAmount: 620000,
    projectStatus: 'Planning',
    projectManager: 'David Miller',
    description: 'Initiation and planning of new high-throughput computing nodes for gene alignment.',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2027-04-30')
  },
  {
    projectName: 'Pricing Phase 2',
    spocs: ['Karan'],
    scopeDoc: 'Pricing Strategy Scope v2.1',
    projectNumber: 'GPMP-006',
    projectAmount: 2450000,
    projectStatus: 'In Progress',
    projectManager: 'Kavya Chopra',
    description: 'Phase 2 of global pricing structure refactoring and automated invoice validation.',
    startDate: new Date('2026-04-10'),
    endDate: new Date('2026-11-30')
  },
  {
    projectName: 'Transport',
    spocs: ['Karan'],
    scopeDoc: 'Logistics and Fleet Safety Protocol',
    projectNumber: 'GPMP-007',
    projectAmount: 1850000,
    projectStatus: 'Planning',
    projectManager: 'Emily Smith',
    description: 'Optimization of shipping and logistics networks across multi-region depots.',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2027-03-31')
  },
  {
    projectName: 'AICM',
    spocs: ['Karan', 'Abhishek'],
    scopeDoc: 'AICM Integration Blueprint v1',
    projectNumber: 'GPMP-008',
    projectAmount: 4200000,
    projectStatus: 'On Hold',
    projectManager: 'Sarah Jenkins',
    description: 'AI-driven Customer Relationship Management tool deployment and employee training.',
    startDate: new Date('2026-02-15'),
    endDate: new Date('2026-12-15')
  },
  {
    projectName: 'NPD',
    spocs: ['Girish'],
    scopeDoc: 'New Product Development Flow',
    projectNumber: 'GPMP-009',
    projectAmount: 3100000,
    projectStatus: 'Completed',
    projectManager: 'John Davis',
    description: 'R&D cycle for next-generation bio-sensor devices validation and safety trials.',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2026-06-15')
  },
  {
    projectName: 'Capex',
    spocs: ['Abhishek'],
    scopeDoc: 'Capital Expenditure Budget Plan 2026',
    projectNumber: 'GPMP-010',
    projectAmount: 7500000,
    projectStatus: 'In Progress',
    projectManager: 'David Miller',
    description: 'Capital expenditure deployment for high-performance lab equipment and new cleanrooms.',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-12-31')
  }
];

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Project.deleteMany();
    await Document.deleteMany();
    console.log('Purging existing database records...');

    // Seed Users
    const seededUsers = [];
    for (const u of users) {
      const newUser = new User(u);
      await newUser.save();
      seededUsers.push(newUser);
    }
    console.log(`Successfully seeded ${seededUsers.length} users:`);
    seededUsers.forEach(u => console.log(` - Role [${u.role}]: ${u.email} (password: ${u.password})`));

    // Seed Projects
    const seededProjects = await Project.insertMany(projects);
    console.log(`Successfully seeded ${seededProjects.length} projects.`);
    console.log('Database Seeding Complete.');
  } catch (err) {
    console.error(`Error seeding database: ${err.message}`);
    throw err;
  }
};

// If run directly
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();
  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/genessence';
  
  mongoose.connect(connStr)
    .then(async () => {
      console.log('Connected to MongoDB directly for seeding...');
      await seedData();
      process.exit(0);
    })
    .catch(err => {
      console.error(`Direct seed connection failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = seedData;
