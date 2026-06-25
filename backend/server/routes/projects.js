const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');

// @route   GET api/projects
// @desc    Get all projects with search, filter, sorting, and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status,
      company,
      manager,
      spoc,
      projectName
    } = req.query;

    const query = {};

    // Apply text search across relevant fields (projectName, spocs, scopeDoc, etc.)
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { spocs: { $regex: search, $options: 'i' } },
        { scopeDoc: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } },
        { projectManager: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply specific filters
    if (status) {
      query.projectStatus = status;
    }
    if (company) {
      query.scopeDoc = { $regex: company, $options: 'i' };
    }
    if (manager) {
      query.projectManager = { $regex: manager, $options: 'i' };
    }
    if (spoc) {
      query.spocs = spoc;
    }
    if (projectName) {
      query.projectName = { $regex: projectName, $options: 'i' };
    }

    // Execute query with sorting and pagination
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const totalProjects = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Map each project to append its file count from Documents collection
    const projectsWithCounts = [];
    for (let proj of projects) {
      const docCount = await Document.countDocuments({ projectId: proj._id });
      projectsWithCounts.push({
        ...proj.toObject(),
        fileCount: docCount
      });
    }

    // Get list of unique scope documents, managers, spocs, and project names for filters
    const companies = await Project.distinct('scopeDoc');
    const managers = await Project.distinct('projectManager');
    const spocs = await Project.distinct('spocs');
    const projectNames = await Project.distinct('projectName');

    res.json({
      projects: projectsWithCounts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalProjects / limit),
        totalProjects
      },
      filters: {
        companies,
        managers,
        spocs,
        projectNames
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/projects/stats
// @desc    Get dashboard KPIs in Indian Currency (INR) formatted fields
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    
    // Aggregation for total value
    const totalValueAgg = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$projectAmount' } } }
    ]);
    const totalValue = totalValueAgg.length > 0 ? totalValueAgg[0].total : 0;

    // Aggregation for active projects value (In Progress)
    const activeValueAgg = await Project.aggregate([
      { $match: { projectStatus: 'In Progress' } },
      { $group: { _id: null, total: { $sum: '$projectAmount' } } }
    ]);
    const activeValue = activeValueAgg.length > 0 ? activeValueAgg[0].total : 0;

    // Aggregation for completed projects value (Completed)
    const completedValueAgg = await Project.aggregate([
      { $match: { projectStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$projectAmount' } } }
    ]);
    const completedValue = completedValueAgg.length > 0 ? completedValueAgg[0].total : 0;

    // Aggregation for pending projects value (Planning, On Hold, Cancelled)
    const pendingValueAgg = await Project.aggregate([
      { $match: { projectStatus: { $nin: ['In Progress', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$projectAmount' } } }
    ]);
    const pendingValue = pendingValueAgg.length > 0 ? pendingValueAgg[0].total : 0;

    // Count projects in each state
    const activeCount = await Project.countDocuments({ projectStatus: 'In Progress' });
    const completedCount = await Project.countDocuments({ projectStatus: 'Completed' });
    const pendingCount = await Project.countDocuments({ projectStatus: { $nin: ['In Progress', 'Completed'] } });

    // Aggregation for distinct SPOCs count
    const distinctSpocs = await Project.distinct('spocs');
    const totalSpocs = distinctSpocs.length;

    // Aggregation for distinct scope docs count
    const distinctScopeDocs = await Project.distinct('scopeDoc');
    const totalCompanies = distinctScopeDocs.length;

    // Aggregation for projects by status
    const statusCounts = await Project.aggregate([
      { $group: { _id: '$projectStatus', count: { $sum: 1 } } }
    ]);

    // Aggregation for projects by manager
    const managerCounts = await Project.aggregate([
      { $group: { _id: '$projectManager', count: { $sum: 1 }, totalValue: { $sum: '$projectAmount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Aggregation for monthly value trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const monthlyTrends = await Project.aggregate([
      { $match: { startDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          totalAmount: { $sum: '$projectAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrends = monthlyTrends.map(trend => {
      const monthIndex = trend._id.month - 1;
      return {
        month: `${monthNames[monthIndex]} ${trend._id.year}`,
        value: trend.totalAmount,
        projectsCount: trend.count
      };
    });

    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalProjects,
      totalSpocs,
      totalCompanies,
      totalValue,
      activeValue,
      completedValue,
      pendingValue,
      activeCount,
      completedCount,
      pendingCount,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      managerCounts: managerCounts.map(m => ({
        manager: m._id,
        count: m.count,
        totalValue: m.totalValue
      })),
      monthlyTrends: formattedTrends,
      recentProjects
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/projects/export
// @desc    Get all projects for export
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/projects/:id
// @desc    Get project details with attached files list
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find documents attached to this project
    const documents = await Document.find({ projectId: project._id }).sort({ uploadedAt: -1 });
    
    res.json({
      ...project.toObject(),
      documents
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/projects
// @desc    Create a new project
// @access  Private (Admin, Manager)
router.post('/', protect, authorize(['admin', 'manager']), async (req, res) => {
  const {
    projectName,
    spocs,
    scopeDoc,
    projectNumber,
    projectAmount,
    projectStatus,
    projectManager,
    description,
    startDate,
    endDate
  } = req.body;

  if (!projectName || !spocs || !Array.isArray(spocs) || spocs.length === 0 || !scopeDoc || !projectNumber || !projectAmount || !projectManager || !startDate || !endDate) {
    return res.status(400).json({ message: 'Please provide all required fields, including at least one SPOC' });
  }

  try {
    const numExists = await Project.findOne({ projectNumber });
    if (numExists) {
      return res.status(400).json({ message: 'Project number must be unique' });
    }

    const project = await Project.create({
      projectName,
      spocs,
      scopeDoc,
      projectNumber,
      projectAmount: Number(projectAmount),
      projectStatus,
      projectManager,
      description,
      startDate,
      endDate
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/projects/import
// @desc    Bulk import projects from Excel rows
// @access  Private (Admin, Manager)
router.post('/import', protect, authorize(['admin', 'manager']), async (req, res) => {
  const { projects } = req.body;

  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ message: 'Please provide a valid array of projects to import' });
  }

  try {
    const importedProjects = [];
    const errors = [];

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      
      const name = p.projectName || p.spoc;
      let spocsList = [];
      if (p.spocs) {
        if (Array.isArray(p.spocs)) {
          spocsList = p.spocs.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof p.spocs === 'string') {
          spocsList = p.spocs.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (p.spoc) {
        // If legacy spoc is provided but no separate spocs, use the manager or a default SPOC
        spocsList = [p.projectManager || 'System'];
      }

      if (!name || spocsList.length === 0 || !p.scopeDoc || !p.projectNumber || p.projectAmount === undefined || !p.projectManager) {
        errors.push(`Row ${i + 1}: Missing required fields (Project Name, SPOC, Scope Doc, Project Number, Amount, Manager).`);
        continue;
      }

      const existingProject = await Project.findOne({ projectNumber: String(p.projectNumber) });
      if (existingProject) {
        errors.push(`Row ${i + 1}: Project Number '${p.projectNumber}' already exists.`);
        continue;
      }

      const start = new Date(p.startDate || new Date());
      const end = new Date(p.endDate || new Date());

      try {
        const newProj = new Project({
          projectName: name,
          spocs: spocsList,
          scopeDoc: p.scopeDoc,
          projectNumber: String(p.projectNumber),
          projectAmount: Number(p.projectAmount),
          projectStatus: p.projectStatus || 'Planning',
          projectManager: p.projectManager,
          description: p.description || '',
          startDate: isNaN(start.getTime()) ? new Date() : start,
          endDate: isNaN(end.getTime()) ? new Date() : end
        });
        await newProj.save();
        importedProjects.push(newProj);
      } catch (saveErr) {
        errors.push(`Row ${i + 1}: Save error - ${saveErr.message}`);
      }
    }

    res.json({
      successCount: importedProjects.length,
      failedCount: errors.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const {
      projectName,
      spocs,
      scopeDoc,
      projectNumber,
      projectAmount,
      projectStatus,
      projectManager,
      description,
      startDate,
      endDate
    } = req.body;

    if (projectNumber && projectNumber !== project.projectNumber) {
      const numExists = await Project.findOne({ projectNumber });
      if (numExists) {
        return res.status(400).json({ message: 'Project number must be unique' });
      }
      project.projectNumber = projectNumber;
    }

    if (projectName) project.projectName = projectName;
    if (spocs && Array.isArray(spocs) && spocs.length > 0) project.spocs = spocs;
    project.scopeDoc = scopeDoc || project.scopeDoc;
    project.projectAmount = projectAmount !== undefined ? Number(projectAmount) : project.projectAmount;
    project.projectStatus = projectStatus || project.projectStatus;
    project.projectManager = projectManager || project.projectManager;
    project.description = description !== undefined ? description : project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project and its attached files
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const fs = require('fs');
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find and delete attached documents files from disk and database
    const documents = await Document.find({ projectId: project._id });
    for (const doc of documents) {
      if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
    }
    await Document.deleteMany({ projectId: project._id });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project and all attached documents removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
