const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  spocs: {
    type: [String],
    required: true
  },
  scopeDoc: {
    type: String,
    required: true,
    trim: true
  },
  projectNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  projectAmount: {
    type: Number,
    required: true,
    min: 0
  },
  projectStatus: {
    type: String,
    required: true,
    enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  projectManager: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Project', ProjectSchema);
