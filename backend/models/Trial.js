const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  // 基本信息
  companyName: {
    type: String,
    required: [true, '企业名称不能为空'],
    trim: true,
    maxlength: [100, '企业名称不能超过100个字符']
  },
  contactName: {
    type: String,
    required: [true, '联系人姓名不能为空'],
    trim: true,
    maxlength: [50, '联系人姓名不能超过50个字符']
  },
  phone: {
    type: String,
    required: [true, '联系电话不能为空'],
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  
  // 试用账户信息
  trialAccount: {
    username: {
      type: String,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      trim: true
    },
    accessUrl: {
      type: String,
      trim: true
    }
  },
  
  // 试用期限
  trialStartDate: {
    type: Date,
    default: Date.now
  },
  trialEndDate: {
    type: Date,
    default: function() {
      // 默认30天试用期
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      return endDate;
    }
  },
  
  // 试用状态
  status: {
    type: String,
    default: 'active',
    enum: {
      values: ['pending', 'active', 'expired', 'converted', 'cancelled'],
      message: '状态必须是: pending(待激活)、active(试用中)、expired(已过期)、converted(已转化)或cancelled(已取消)'
    }
  },
  
  // 使用统计
  loginCount: {
    type: Number,
    default: 0
  },
  lastLoginAt: {
    type: Date
  },
  
  // 功能使用情况
  usageStats: {
    documentsProcessed: {
      type: Number,
      default: 0
    },
    approvalRequests: {
      type: Number,
      default: 0
    },
    reportGenerated: {
      type: Number,
      default: 0
    }
  },
  
  // 反馈信息
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, '反馈意见不能超过1000个字符']
    },
    submittedAt: {
      type: Date
    }
  },
  
  // 营销信息
  source: {
    type: String,
    trim: true,
    default: 'website'
  },
  referrer: {
    type: String,
    trim: true
  },
  
  // 转化相关
  convertedToQuote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  convertedAt: {
    type: Date
  },
  
  // 跟进记录
  followUps: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'other'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    contactedBy: {
      type: String,
      required: true,
      trim: true
    },
    scheduledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // IP地址和追踪信息
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
trialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
trialSchema.index({ companyName: 1 });
trialSchema.index({ phone: 1 });
trialSchema.index({ email: 1 });
trialSchema.index({ status: 1 });
trialSchema.index({ trialEndDate: 1 });
trialSchema.index({ createdAt: -1 });
trialSchema.index({ 'trialAccount.username': 1 });

// 虚拟字段 - 是否试用中
trialSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.trialEndDate > new Date();
});

// 虚拟字段 - 剩余试用天数
trialSchema.virtual('remainingDays').get(function() {
  if (this.status !== 'active') return 0;
  const today = new Date();
  const endDate = new Date(this.trialEndDate);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// 虚拟字段 - 状态中文名
trialSchema.virtual('statusText').get(function() {
  const statusMap = {
    pending: '待激活',
    active: '试用中',
    expired: '已过期',
    converted: '已转化',
    cancelled: '已取消'
  };
  return statusMap[this.status] || this.status;
});

// 方法 - 延长试用期
trialSchema.methods.extendTrial = function(days) {
  const newEndDate = new Date(this.trialEndDate);
  newEndDate.setDate(newEndDate.getDate() + days);
  this.trialEndDate = newEndDate;
  return this.save();
};

// 方法 - 记录登录
trialSchema.methods.recordLogin = function() {
  this.loginCount += 1;
  this.lastLoginAt = new Date();
  return this.save();
};

// 确保虚拟字段在JSON输出中包含
trialSchema.set('toJSON', { virtuals: true });
trialSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trial', trialSchema);