# 污水治理智能审批系统

这是一个完整的全栈Web应用程序，包含前端网站和后端API服务，用于污水治理项目的智能审批管理。

## 项目结构

```
Website/
├── 111.html                 # 前端主页面
├── icon.png                # 网站Logo
├── backend/                 # 后端API服务
│   ├── server.js           # 主服务器文件
│   ├── package.json        # 依赖配置
│   ├── .env               # 环境变量配置
│   ├── models/            # 数据库模型
│   │   ├── Quote.js       # 报价申请模型
│   │   └── Trial.js       # 试用申请模型
│   ├── routes/            # API路由
│   │   ├── quotes.js      # 报价相关接口
│   │   ├── trials.js      # 试用相关接口
│   │   └── health.js      # 健康检查接口
│   ├── middleware/        # 中间件
│   │   └── validation.js  # 数据验证中间件
│   └── services/          # 业务服务
│       ├── emailService.js # 邮件服务
│       └── trialService.js # 试用服务
└── README.md              # 项目说明文档
```

## 功能特性

### 前端功能
- 📱 响应式设计，支持桌面和移动设备
- 🎨 现代化UI设计，苹果风格交互
- 📋 报价申请表单，支持实时验证
- 🆓 免费试用申请，模态框交互
- ✨ 丰富的动画效果和交互反馈
- 🔍 智能功能展示，SVG图标

### 后端功能
- 🚀 Node.js + Express + MongoDB技术栈
- 📊 完整的数据模型和验证
- 📧 自动邮件通知系统
- 🔒 安全防护和速率限制
- 📈 数据统计和分析接口
- 🎯 试用账户自动管理
- 🔍 健康检查和监控

## 安装和启动

### 环境要求
- Node.js 16.0 或更高版本
- MongoDB 4.4 或更高版本
- npm 或 yarn 包管理器

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并根据需要修改配置：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置（请根据实际情况修改）
MONGODB_URI=mongodb://localhost:27017/wastewater_approval

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your_very_long_and_random_secret_key_here

# 邮箱配置（请配置真实的SMTP服务）
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_USER=24721042@bjtu.edu.cn
EMAIL_PASS=your_email_password_here

# 前端域名
FRONTEND_URL=http://localhost:8080
```

### 3. 启动数据库

确保MongoDB服务正在运行：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo service mongod start
```

### 4. 启动后端服务

```bash
cd backend
npm run dev    # 开发模式
# 或
npm start      # 生产模式
```

后端服务将在 `http://localhost:3000` 启动。

### 5. 启动前端

由于前端是静态HTML文件，可以通过以下方式之一启动：

**方法1：使用Live Server（推荐）**
```bash
# 安装Live Server
npm install -g live-server

# 在项目根目录启动
live-server --port=8080
```

**方法2：使用Python简单服务器**
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

**方法3：直接打开HTML文件**
双击 `111.html` 文件在浏览器中打开。

前端将在 `http://localhost:8080` 可访问。

## API接口文档

### 报价申请接口

**POST /api/quotes**
```json
{
  "companyName": "企业名称",
  "contactName": "联系人姓名", 
  "phone": "联系电话",
  "email": "企业邮箱",
  "companyType": "企业类型",
  "userCount": "用户数量",
  "requirements": "特殊需求"
}
```

**GET /api/quotes** - 获取报价申请列表（管理员）
**GET /api/quotes/stats/overview** - 获取报价统计数据

### 试用申请接口

**POST /api/trials**
```json
{
  "companyName": "企业名称",
  "contactName": "联系人姓名",
  "phone": "联系电话", 
  "email": "企业邮箱"
}
```

**GET /api/trials** - 获取试用申请列表（管理员）
**GET /api/trials/stats/overview** - 获取试用统计数据

### 健康检查接口

**GET /api/health** - 基础健康检查
**GET /api/health/detailed** - 详细系统状态

## 数据库设计

### 报价申请表 (quotes)
- 企业基本信息（名称、联系人、电话、邮箱）
- 企业类型和规模
- 特殊需求
- 状态管理（待处理、已联系、已报价、已转化、已关闭）
- 处理信息（负责人、备注、报价金额）
- 技术信息（IP地址、浏览器、来源）

### 试用申请表 (trials)
- 企业基本信息
- 试用账户信息（用户名、密码、访问地址）
- 试用期限管理
- 使用统计（登录次数、功能使用情况）
- 反馈信息
- 跟进记录

## 邮件服务

系统集成了完整的邮件通知功能：

1. **报价申请通知** - 新申请时通知销售团队
2. **试用账户邮件** - 发送试用账户信息给客户
3. **试用到期提醒** - 自动提醒即将到期的试用用户

## 开发说明

### 添加新功能
1. 在 `models/` 中定义数据模型
2. 在 `routes/` 中添加API路由
3. 在 `middleware/` 中添加验证逻辑
4. 在 `services/` 中实现业务逻辑
5. 更新前端JavaScript调用新接口

### 部署注意事项
1. 修改 `.env` 文件中的生产环境配置
2. 配置真实的SMTP邮件服务
3. 使用强密码和JWT密钥
4. 启用HTTPS
5. 配置反向代理（Nginx）
6. 设置进程管理器（PM2）

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript ES6+
- 响应式设计
- SVG图标
- Fetch API
- 现代浏览器兼容

### 后端
- Node.js + Express.js
- MongoDB + Mongoose
- JWT认证
- 邮件服务 (Nodemailer)
- 数据验证 (Joi)
- 安全防护 (Helmet, CORS, Rate Limiting)

## 联系信息

- 📞 服务热线：19905980186
- 📧 技术支持：24721042@bjtu.edu.cn
- 🏢 地址：北京交通大学威海校区

---

© 2025 污水治理智能审批系统. 保留所有权利.