const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // 基本企业信息
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
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // 如果邮箱为空，则允许通过验证
        if (!v || v === '') return true;
        // 如果不为空，则验证邮箱格式
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: '请输入有效的邮箱地址'
    }
  },
  
  // 企业类型和规模
  companyType: {
    type: String,
    required: [true, '企业类型不能为空'],
    enum: {
      values: ['government', 'park', 'enterprise', 'consultant', 'other'],
      message: '企业类型必须是: 政府部门、园区运营方、重点排污企业、环保咨询公司或其他'
    }
  },
  userCount: {
    type: String,
    enum: {
      values: ['1-10', '11-50', '51-100', '100+', ''],
      message: '用户数量必须是预定义的范围'
    }
  },
  
  // 特殊需求
  requirements: {
    type: String,
    trim: true,
    maxlength: [1000, '特殊需求不能超过1000个字符']
  },
  
  // 状态管理
  status: {
    type: String,
    default: 'pending',
    enum: {
      values: ['pending', 'contacted', 'quoted', 'converted', 'closed'],
      message: '状态必须是: pending(待处理)、contacted(已联系)、quoted(已报价)、converted(已转化)或closed(已关闭)'
    }
  },
  
  // 处理信息
  assignedTo: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // 报价信息
  quotedPrice: {
    type: Number,
    min: [0, '报价不能为负数']
  },
  quotedAt: {
    type: Date
  },
  
  // IP地址和来源追踪
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrer: {
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
quoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
quoteSchema.index({ companyName: 1 });
quoteSchema.index({ phone: 1 });
quoteSchema.index({ email: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });

// 虚拟字段 - 企业类型中文名
quoteSchema.virtual('companyTypeText').get(function() {
  const typeMap = {
    government: '政府部门',
    park: '园区运营方',
    enterprise: '重点排污企业',
    consultant: '环保咨询公司',
    other: '其他'
  };
  return typeMap[this.companyType] || this.companyType;
});

// 虚拟字段 - 状态中文名
quoteSchema.virtual('statusText').get(function() {
  const statusMap = {
    pending: '待处理',
    contacted: '已联系',
    quoted: '已报价',
    converted: '已转化',
    closed: '已关闭'
  };
  return statusMap[this.status] || this.status;
});

// 确保虚拟字段在JSON输出中包含
quoteSchema.set('toJSON', { virtuals: true });
quoteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quote', quoteSchema);