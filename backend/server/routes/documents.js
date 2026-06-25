const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');

// Setup storage directory
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter (PDF, DOCX, XLSX, Images, ZIP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for: ${file.originalname}. Allowed: PDF, DOCX, XLSX, Images, ZIP`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST api/documents/upload
// @desc    Upload project document files (multiple support)
// @access  Private (Admin, Manager)
router.post('/upload', protect, authorize(['admin', 'manager']), (req, res) => {
  upload.array('files', 10)(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { projectId } = req.body;
    if (!projectId) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res.status(400).json({ message: 'Project ID is required' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        return res.status(404).json({ message: 'Project not found' });
      }

      const uploadedDocs = [];
      for (const file of req.files) {
        const doc = await Document.create({
          projectId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileType: path.extname(file.originalname).toLowerCase(),
          fileSize: file.size,
          uploadedBy: req.user.name
        });
        uploadedDocs.push(doc);
      }

      res.status(201).json(uploadedDocs);
    } catch (saveErr) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      res.status(500).json({ message: saveErr.message });
    }
  });
});

// @route   GET api/documents
// @desc    Get all documents or filter by project / search
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { projectId, search = '' } = req.query;
    const query = {};

    if (projectId) {
      query.projectId = projectId;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const documents = await Document.find(query)
      .populate('projectId', 'projectName spocs')
      .sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/documents/recent
// @desc    Get recent uploaded documents
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate('projectId', 'projectName spocs')
      .sort({ uploadedAt: -1 })
      .limit(5);
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/documents/download/:id
// @desc    Download specific document file
// @access  Private
router.get('/download/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.download(doc.filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/documents/preview/:id
// @desc    Preview document inline (PDF or Images)
// @access  Private
router.get('/preview/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    const contentType = contentTypeMap[doc.fileType.toLowerCase()];
    if (!contentType) {
      return res.status(400).json({ message: 'File type does not support inline preview' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalName)}"`);
    fs.createReadStream(doc.filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET api/documents/:id
// @desc    Get single document details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('projectId', 'projectName projectNumber spocs');
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT api/documents/:id
// @desc    Update document metadata (name, description, tags, version note)
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { originalName, description, tags, versionNote, projectId } = req.body;

    // If moving to a different project, verify that project exists
    if (projectId && projectId !== String(doc.projectId)) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ message: 'Target project not found' });
      }
      doc.projectId = projectId;
    }

    if (originalName && originalName.trim()) doc.originalName = originalName.trim();
    if (description !== undefined) doc.description = description;
    if (Array.isArray(tags)) doc.tags = tags.map(t => String(t).trim()).filter(Boolean);
    if (versionNote !== undefined) doc.versionNote = versionNote;

    const updated = await doc.save();
    const populated = await updated.populate('projectId', 'projectName projectNumber spocs');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST api/documents/replace/:id
// @desc    Replace the physical file, keeping version history
// @access  Private (Admin, Manager)
router.post('/replace/:id', protect, authorize(['admin', 'manager']), (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No replacement file provided' });
    }

    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Document not found' });
      }

      // Archive the current version into history
      doc.versions.push({
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        versionNote: req.body.versionNote || `Replaced on ${new Date().toLocaleDateString()}`
      });

      // Update with new file details
      doc.fileName = req.file.filename;
      doc.filePath = req.file.path;
      doc.fileSize = req.file.size;
      doc.fileType = path.extname(req.file.originalname).toLowerCase();
      doc.uploadedBy = req.user.name;
      doc.uploadedAt = new Date();
      if (req.body.originalName) doc.originalName = req.body.originalName;

      const updated = await doc.save();
      const populated = await updated.populate('projectId', 'projectName projectNumber spocs');
      res.json(populated);
    } catch (saveErr) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: saveErr.message });
    }
  });
});

// @route   DELETE api/documents/:id
// @desc    Delete a document file and DB record (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // FIX: was `docId = req.params.id` — implicit global variable bug
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the main file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // Also clean up any archived version files from disk
    for (const ver of doc.versions) {
      if (ver.filePath && fs.existsSync(ver.filePath)) {
        try { fs.unlinkSync(ver.filePath); } catch (_) {}
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
