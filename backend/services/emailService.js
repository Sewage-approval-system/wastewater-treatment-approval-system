const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// 发送报价申请通知邮件给销售团队
const sendQuoteNotification = async (quote) => {
  try {
    const transporter = createTransporter();

    const companyTypeMap = {
      government: '政府部门',
      park: '园区运营方',
      enterprise: '重点排污企业',
      consultant: '环保咨询公司',
      other: '其他'
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">新的报价申请</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">客户信息</h3>
          <p><strong>企业名称：</strong>${quote.companyName}</p>
          <p><strong>联系人：</strong>${quote.contactName}</p>
          <p><strong>联系电话：</strong>${quote.phone}</p>
          <p><strong>企业邮箱：</strong>${quote.email || '未提供'}</p>
          <p><strong>企业类型：</strong>${companyTypeMap[quote.companyType] || quote.companyType}</p>
          <p><strong>用户规模：</strong>${quote.userCount || '未选择'}</p>
        </div>

        ${quote.requirements ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">特殊需求</h4>
          <p style="color: #856404;">${quote.requirements}</p>
        </div>
        ` : ''}

        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0066cc; margin-top: 0;">技术信息</h4>
          <p><strong>提交时间：</strong>${new Date(quote.createdAt).toLocaleString('zh-CN')}</p>
          <p><strong>IP地址：</strong>${quote.ipAddress || '未知'}</p>
          <p><strong>来源页面：</strong>${quote.referrer || '直接访问'}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666;">请及时联系客户，提供专业的咨询服务。</p>
          <p style="color: #999; font-size: 12px;">此邮件由污水治理智能审批系统自动发送</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // 发送给自己的邮箱
      subject: `新报价申请 - ${quote.companyName}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('报价通知邮件发送成功:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('发送报价通知邮件失败:', error);
    throw error;
  }
};

// 发送试用账户邮件给客户
const sendTrialAccountEmail = async (trial) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">欢迎试用污水治理智能审批系统</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">您的试用账户已创建成功</p>
        </div>

        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
          <p>尊敬的 <strong>${trial.contactName}</strong>，您好！</p>
          
          <p>感谢您申请试用污水治理智能审批系统。您的试用账户已成功创建，详细信息如下：</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">试用账户信息</h3>
            <p><strong>企业名称：</strong>${trial.companyName}</p>
            <p><strong>用户名：</strong>${trial.trialAccount.username}</p>
            <p><strong>初始密码：</strong>${trial.trialAccount.password}</p>
            <p><strong>访问地址：</strong><a href="${trial.trialAccount.accessUrl}" style="color: #667eea;">${trial.trialAccount.accessUrl}</a></p>
            <p><strong>试用期限：</strong>${new Date(trial.trialEndDate).toLocaleDateString('zh-CN')} （30天）</p>
          </div>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d2e; margin-top: 0;">试用期间您可以：</h4>
            <ul style="color: #2e7d2e; margin: 0; padding-left: 20px;">
              <li>体验完整的智能审批流程</li>
              <li>使用AI智能识别和处理功能</li>
              <li>生成和导出审批报告</li>
              <li>享受专业技术支持服务</li>
            </ul>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">重要提醒</h4>
            <p style="color: #856404; margin: 0;">请妥善保管您的账户信息，建议首次登录后修改密码。如有任何问题，请联系我们的技术支持团队。</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trial.trialAccount.accessUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">立即开始试用</a>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <h4 style="color: #333;">联系我们</h4>
            <p>📞 服务热线：19905980186</p>
            <p>📧 技术支持：24721042@bjtu.edu.cn</p>
            <p>🏢 地址：北京交通大学威海校区</p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; background: #f8f9fa; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 12px;">此邮件由污水治理智能审批系统自动发送，请勿直接回复</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: trial.email,
      subject: '污水治理智能审批系统 - 试用账户信息',
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('试用账户邮件发送成功:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('发送试用账户邮件失败:', error);
    throw error;
  }
};

// 发送试用即将到期提醒邮件
const sendTrialExpiryReminder = async (trial, daysRemaining) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">试用期即将到期提醒</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">还有 ${daysRemaining} 天到期</p>
        </div>

        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0;">
          <p>尊敬的 <strong>${trial.contactName}</strong>，您好！</p>
          
          <p>您的污水治理智能审批系统试用账户将在 <strong>${daysRemaining} 天</strong>后到期。</p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">试用信息</h3>
            <p><strong>企业名称：</strong>${trial.companyName}</p>
            <p><strong>到期时间：</strong>${new Date(trial.trialEndDate).toLocaleString('zh-CN')}</p>
            <p><strong>登录次数：</strong>${trial.loginCount} 次</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>如需继续使用我们的服务，请联系我们获取正式版本。</p>
            <a href="tel:19905980186" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 10px;">联系销售</a>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: trial.email,
      subject: `试用即将到期提醒 - 还有${daysRemaining}天`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('试用到期提醒邮件发送成功:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('发送试用到期提醒邮件失败:', error);
    throw error;
  }
};

module.exports = {
  sendQuoteNotification,
  sendTrialAccountEmail,
  sendTrialExpiryReminder
};