const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetUrl: {
      type: String,
      required: true,
      index: true,
    },
    pageTitle: {
      type: String,
      default: '',
    },
    grade: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D', 'F'],
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    violations: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

auditReportSchema.methods.toHistoryItem = function () {
  return {
    id: this._id.toString(),
    url: this.targetUrl,
    pageTitle: this.pageTitle,
    grade: this.grade,
    totalErrors: this.summary?.totalErrors ?? 0,
    totalFixed: this.summary?.totalFixed ?? 0,
    timestamp: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

module.exports = mongoose.model('AuditReport', auditReportSchema);
