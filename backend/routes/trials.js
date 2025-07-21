const express = require('express');
const router = express.Router();
const Trial = require('../models/Trial');
const { validateTrial } = require('../middleware/validation');
const { sendTrialAccountEmail } = require('../services/emailService');
const { generateTrialAccount } = require('../services/trialService');

// 申请免费试用
router.post('/', validateTrial, async (req, res) => {
  try {
    // 检查是否已经申请过试用
    const existingTrial = await Trial.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });

    if (existingTrial) {
      return res.status(400).json({
        success: false,
        error: '该联系方式已申请过试用，请查收邮件或联系客服。'
      });
    }

    // 提取客户端信息
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // 生成试用账户
    const trialAccount = await generateTrialAccount(req.body.companyName);

    // 创建试用记录
    const trialData = {
      ...req.body,
      ...clientInfo,
      trialAccount
    };

    const trial = new Trial(trialData);
    await trial.save();

    // 发送试用账户邮件
    try {
      await sendTrialAccountEmail(trial);
    } catch (emailError) {
      console.error('发送试用账户邮件失败:', emailError);
      // 不影响主流程，但需要记录
    }

    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '试用申请成功！试用账户信息已发送到您的邮箱，请查收。',
      data: {
        id: trial._id,
        companyName: trial.companyName,
        contactName: trial.contactName,
        trialEndDate: trial.trialEndDate,
        accessUrl: trial.trialAccount.accessUrl
      }
    });

  } catch (error) {
    console.error('申请试用失败:', error);
    res.status(500).json({
      success: false,
      error: '申请失败，请稍后重试或联系客服。',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取试用申请列表（管理员接口）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 执行查询
    const trials = await Trial.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Trial.countDocuments(query);

    res.json({
      success: true,
      data: {
        trials,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: trials.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('获取试用申请列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    });
  }
});

// 获取单个试用申请详情
router.get('/:id', async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id)
      .populate('convertedToQuote', 'companyName status quotedPrice');
    
    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '试用申请不存在'
      });
    }

    res.json({
      success: true,
      data: trial
    });

  } catch (error) {
    console.error('获取试用申请详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    });
  }
});

// 更新试用状态
router.put('/:id', async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (status) updateData.status = status;
    if (feedback) updateData.feedback = feedback;

    const trial = await Trial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '试用申请不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      data: trial
    });

  } catch (error) {
    console.error('更新试用状态失败:', error);
    res.status(500).json({
      success: false,
      error: '更新失败'
    });
  }
});

// 延长试用期
router.post('/:id/extend', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const trial = await Trial.findById(req.params.id);
    
    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '试用申请不存在'
      });
    }

    await trial.extendTrial(days);

    res.json({
      success: true,
      message: `试用期已延长${days}天`,
      data: {
        newEndDate: trial.trialEndDate,
        remainingDays: trial.remainingDays
      }
    });

  } catch (error) {
    console.error('延长试用期失败:', error);
    res.status(500).json({
      success: false,
      error: '延长失败'
    });
  }
});

// 记录试用用户登录
router.post('/:id/login', async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id);
    
    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '试用账户不存在'
      });
    }

    if (trial.status !== 'active' || trial.trialEndDate < new Date()) {
      return res.status(403).json({
        success: false,
        error: '试用期已过期'
      });
    }

    await trial.recordLogin();

    res.json({
      success: true,
      message: '登录记录成功',
      data: {
        loginCount: trial.loginCount,
        remainingDays: trial.remainingDays
      }
    });

  } catch (error) {
    console.error('记录登录失败:', error);
    res.status(500).json({
      success: false,
      error: '记录登录失败'
    });
  }
});

// 添加跟进记录
router.post('/:id/followups', async (req, res) => {
  try {
    const { type, content, contactedBy, scheduledAt } = req.body;
    
    const trial = await Trial.findById(req.params.id);
    
    if (!trial) {
      return res.status(404).json({
        success: false,
        error: '试用申请不存在'
      });
    }

    trial.followUps.push({
      type,
      content,
      contactedBy,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    await trial.save();

    res.json({
      success: true,
      message: '跟进记录添加成功',
      data: trial.followUps[trial.followUps.length - 1]
    });

  } catch (error) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json({
      success: false,
      error: '添加跟进记录失败'
    });
  }
});

// 获取试用统计数据
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalTrials,
      activeTrials,
      expiredTrials,
      convertedTrials,
      todayTrials
    ] = await Promise.all([
      Trial.countDocuments(),
      Trial.countDocuments({ status: 'active' }),
      Trial.countDocuments({ status: 'expired' }),
      Trial.countDocuments({ status: 'converted' }),
      Trial.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // 即将过期的试用账户（7天内）
    const expiringTrials = await Trial.countDocuments({
      status: 'active',
      trialEndDate: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // 使用活跃度统计
    const usageStats = await Trial.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          avgLoginCount: { $avg: '$loginCount' },
          totalLogins: { $sum: '$loginCount' },
          totalDocuments: { $sum: '$usageStats.documentsProcessed' },
          totalApprovals: { $sum: '$usageStats.approvalRequests' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTrials,
          activeTrials,
          expiredTrials,
          convertedTrials,
          todayTrials,
          expiringTrials,
          conversionRate: totalTrials > 0 ? ((convertedTrials / totalTrials) * 100).toFixed(2) : 0
        },
        usage: usageStats[0] || {
          avgLoginCount: 0,
          totalLogins: 0,
          totalDocuments: 0,
          totalApprovals: 0
        }
      }
    });

  } catch (error) {
    console.error('获取试用统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

module.exports = router;