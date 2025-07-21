const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { validateQuote } = require('../middleware/validation');
const { sendQuoteNotification } = require('../services/emailService');

// 创建报价申请
router.post('/', validateQuote, async (req, res) => {
  try {
    // 提取客户端信息
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // 创建报价记录
    const quoteData = {
      ...req.body,
      ...clientInfo
    };

    const quote = new Quote(quoteData);
    await quote.save();

    // 发送通知邮件给销售团队
    try {
      await sendQuoteNotification(quote);
    } catch (emailError) {
      console.error('发送邮件通知失败:', emailError);
      // 不影响主流程，继续执行
    }

    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '报价申请提交成功！我们将在2个工作日内联系您。',
      data: {
        id: quote._id,
        companyName: quote.companyName,
        contactName: quote.contactName,
        submittedAt: quote.createdAt
      }
    });

  } catch (error) {
    console.error('创建报价申请失败:', error);
    
    // 处理重复提交
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '该联系方式已提交过申请，请耐心等待我们的联系。'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '提交失败，请稍后重试或联系客服。',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取报价申请列表（管理员接口）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      companyType,
      startDate,
      endDate,
      search
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (status) query.status = status;
    if (companyType) query.companyType = companyType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // 执行查询
    const quotes = await Quote.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Quote.countDocuments(query);

    res.json({
      success: true,
      data: {
        quotes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: quotes.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('获取报价申请列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    });
  }
});

// 获取单个报价申请详情（管理员接口）
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: '报价申请不存在'
      });
    }

    res.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('获取报价申请详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败'
    });
  }
});

// 更新报价申请状态（管理员接口）
router.put('/:id', async (req, res) => {
  try {
    const { status, assignedTo, notes, quotedPrice } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (notes) updateData.notes = notes;
    if (quotedPrice) {
      updateData.quotedPrice = quotedPrice;
      updateData.quotedAt = new Date();
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: '报价申请不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      data: quote
    });

  } catch (error) {
    console.error('更新报价申请失败:', error);
    res.status(500).json({
      success: false,
      error: '更新失败'
    });
  }
});

// 删除报价申请（管理员接口）
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: '报价申请不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除报价申请失败:', error);
    res.status(500).json({
      success: false,
      error: '删除失败'
    });
  }
});

// 获取报价申请统计数据（管理员接口）
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalQuotes,
      pendingQuotes,
      convertedQuotes,
      todayQuotes
    ] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pending' }),
      Quote.countDocuments({ status: 'converted' }),
      Quote.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // 按企业类型统计
    const byCompanyType = await Quote.aggregate([
      {
        $group: {
          _id: '$companyType',
          count: { $sum: 1 }
        }
      }
    ]);

    // 按月份统计
    const byMonth = await Quote.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalQuotes,
          pendingQuotes,
          convertedQuotes,
          todayQuotes,
          conversionRate: totalQuotes > 0 ? ((convertedQuotes / totalQuotes) * 100).toFixed(2) : 0
        },
        byCompanyType,
        byMonth
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

module.exports = router;