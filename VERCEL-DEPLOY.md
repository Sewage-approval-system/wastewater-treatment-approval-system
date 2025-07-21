# 🚀 Vercel 云端部署指南

## 🎯 完整部署流程

### 第一步：设置云数据库（MongoDB Atlas）

1. **注册MongoDB Atlas**
   - 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 注册免费账户
   - 创建新的集群（选择免费的M0沙盒）

2. **配置数据库**
   - 集群名称：`WastewaterCluster`
   - 云服务商：AWS（推荐）
   - 区域：选择最近的区域
   
3. **设置数据库用户**
   - 创建数据库用户
   - 用户名：`wastewater_user`
   - 密码：生成强密码（保存好）

4. **获取连接字符串**
   - 点击 "Connect" → "Connect your application"
   - 复制连接字符串，类似：
   ```
   mongodb+srv://wastewater_user:<password>@wastewatercluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 第二步：部署到Vercel

1. **访问Vercel**
   - 打开 [Vercel.com](https://vercel.com)
   - 使用GitHub账户登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的GitHub仓库 `wastewater-treatment-approval-system`
   - 点击 "Import"

3. **配置环境变量**
   在Vercel项目设置中添加以下环境变量：
   
   ```
   变量名                    值
   NODE_ENV                 production
   MONGODB_URI              [你的MongoDB连接字符串]
   RATE_LIMIT_WINDOW_MS     900000
   RATE_LIMIT_MAX_REQUESTS  100
   ```

4. **部署设置**
   - Framework Preset: 选择 "Other"
   - Build Command: `npm run build`
   - Output Directory: 留空
   - Install Command: `npm install`

5. **开始部署**
   - 点击 "Deploy"
   - 等待部署完成（通常2-3分钟）

### 第三步：验证部署

部署完成后，你会得到：

- **用户界面**: `https://your-project-name.vercel.app/`
- **管理界面**: `https://your-project-name.vercel.app/admin`
- **API接口**: `https://your-project-name.vercel.app/api/health`

## 🧪 测试功能

1. **测试用户表单**
   - 访问用户界面
   - 填写完整的报价申请表单
   - 提交并查看成功提示

2. **测试管理界面**
   - 访问管理界面
   - 查看报价申请统计
   - 验证数据是否正确显示

## 🔧 常见问题解决

### 问题1：部署失败
```bash
解决方案：
1. 检查package.json中的依赖版本
2. 确保所有文件已提交到GitHub
3. 查看Vercel构建日志
```

### 问题2：数据库连接失败
```bash
解决方案：
1. 验证MongoDB Atlas连接字符串
2. 确保数据库用户权限正确
3. 检查网络白名单设置（设为0.0.0.0/0允许所有IP）
```

### 问题3：API接口404错误
```bash
解决方案：
1. 检查vercel.json路由配置
2. 确保后端文件路径正确
3. 验证环境变量设置
```

## 🔄 更新部署

当你修改代码后：

1. **提交到GitHub**
   ```bash
   git add .
   git commit -m "更新功能"
   git push origin main
   ```

2. **自动重新部署**
   - Vercel会自动检测GitHub更新
   - 自动重新部署最新版本

## 🌐 最终访问地址

部署成功后，分享以下地址：

- **用户填写表单**: `https://your-project-name.vercel.app/`
- **管理查看数据**: `https://your-project-name.vercel.app/admin`

## 📞 技术支持

如果遇到问题：
1. 检查Vercel部署日志
2. 验证MongoDB Atlas连接
3. 测试API接口响应

---

🎉 完成部署后，你的污水治理智能审批系统将在云端运行，任何人都可以通过网址访问！