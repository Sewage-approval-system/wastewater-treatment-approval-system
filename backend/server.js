const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 安全中间件
app.use(helmet());

// 请求日志
app.use(morgan('combined'));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// CORS配置
app.use(cors({
  origin: function (origin, callback) {
    // 允许没有origin的请求（比如移动端或直接文件访问）
    if (!origin) return callback(null, true);
    
    // 允许localhost的任何端口和file协议
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('file://') ||
        origin === 'null') {
      return callback(null, true);
    }
    
    // 也可以允许特定域名
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('不允许的CORS访问'));
  },
  credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 连接MongoDB数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wastewater_approval', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB数据库连接成功');
})
.catch((error) => {
  console.error('❌ MongoDB数据库连接失败:', error);
  process.exit(1);
});

// 导入路由
const quoteRoutes = require('./routes/quotes');
const trialRoutes = require('./routes/trials');
const healthRoutes = require('./routes/health');

// 使用路由
app.use('/api/quotes', quoteRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/health', healthRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '污水治理智能审批系统API服务运行中',
    version: '1.0.0',
    status: 'running'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API接口不存在',
    message: `路径 ${req.originalUrl} 未找到`
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  // 数据库验证错误
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: '数据验证失败',
      details: errors
    });
  }
  
  // 数据库重复键错误
  if (error.code === 11000) {
    return res.status(400).json({
      error: '数据已存在',
      message: '该记录已经存在'
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '无效的认证令牌'
    });
  }
  
  // 默认服务器错误
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请联系技术支持'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/api`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});