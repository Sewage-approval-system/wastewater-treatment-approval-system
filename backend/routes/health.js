const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 健康检查接口
router.get('/', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };

  try {
    // 检查数据库连接
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    healthCheck.database = {
      status: dbStatus[dbState],
      connected: dbState === 1
    };

    // 检查内存使用情况
    const memUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

// 详细的系统状态检查
router.get('/detailed', async (req, res) => {
  try {
    const Quote = require('../models/Quote');
    const Trial = require('../models/Trial');

    // 数据库统计
    const [quoteCount, trialCount] = await Promise.all([
      Quote.countDocuments(),
      Trial.countDocuments()
    ]);

    const systemStatus = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: {
          quotes: quoteCount,
          trials: trialCount
        }
      },
      memory: process.memoryUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    };

    res.json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '系统状态检查失败',
      details: error.message
    });
  }
});

module.exports = router;