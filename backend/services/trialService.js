const crypto = require('crypto');

// 生成试用账户信息
const generateTrialAccount = async (companyName) => {
  try {
    // 生成用户名：企业名称拼音首字母 + 随机数字
    const username = generateUsername(companyName);
    
    // 生成随机密码
    const password = generateRandomPassword();
    
    // 生成试用系统访问地址
    const accessUrl = generateAccessUrl(username);

    return {
      username,
      password,
      accessUrl
    };
  } catch (error) {
    console.error('生成试用账户失败:', error);
    throw new Error('试用账户生成失败');
  }
};

// 生成用户名
const generateUsername = (companyName) => {
  // 简单处理：取企业名称前几个字符 + 时间戳后4位
  const timestamp = Date.now().toString().slice(-4);
  const cleanName = companyName.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 4);
  return `trial_${cleanName}_${timestamp}`;
};

// 生成随机密码
const generateRandomPassword = (length = 8) => {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// 生成访问地址
const generateAccessUrl = (username) => {
  // 这里应该是实际的试用系统地址
  const baseUrl = process.env.TRIAL_SYSTEM_URL || 'https://trial.wastewater-ai.com';
  return `${baseUrl}/login?user=${username}`;
};

// 检查账户名是否已存在
const checkUsernameExists = async (username) => {
  const Trial = require('../models/Trial');
  const existingTrial = await Trial.findOne({ 'trialAccount.username': username });
  return !!existingTrial;
};

// 生成唯一用户名
const generateUniqueUsername = async (companyName, maxAttempts = 5) => {
  let attempts = 0;
  let username;
  
  do {
    username = generateUsername(companyName);
    attempts++;
    
    if (attempts > maxAttempts) {
      // 如果多次尝试都重复，添加随机后缀
      username += '_' + crypto.randomBytes(3).toString('hex');
      break;
    }
  } while (await checkUsernameExists(username));
  
  return username;
};

// 验证试用账户状态
const validateTrialAccess = async (username) => {
  const Trial = require('../models/Trial');
  
  const trial = await Trial.findOne({ 'trialAccount.username': username });
  
  if (!trial) {
    return { valid: false, message: '试用账户不存在' };
  }
  
  if (trial.status !== 'active') {
    return { valid: false, message: '试用账户已被禁用' };
  }
  
  if (trial.trialEndDate < new Date()) {
    return { valid: false, message: '试用期已过期' };
  }
  
  return { valid: true, trial };
};

// 获取即将到期的试用账户
const getExpiringTrials = async (daysBeforeExpiry = 7) => {
  const Trial = require('../models/Trial');
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);
  
  return await Trial.find({
    status: 'active',
    trialEndDate: {
      $lte: expiryDate,
      $gte: new Date()
    }
  });
};

// 自动清理过期试用账户
const cleanupExpiredTrials = async () => {
  const Trial = require('../models/Trial');
  
  try {
    const result = await Trial.updateMany(
      {
        status: 'active',
        trialEndDate: { $lt: new Date() }
      },
      {
        $set: { status: 'expired' }
      }
    );
    
    console.log(`已清理 ${result.modifiedCount} 个过期试用账户`);
    return result;
  } catch (error) {
    console.error('清理过期试用账户失败:', error);
    throw error;
  }
};

// 获取试用使用统计
const getTrialUsageStats = async (trialId) => {
  const Trial = require('../models/Trial');
  
  const trial = await Trial.findById(trialId);
  if (!trial) return null;
  
  const totalDays = Math.ceil((trial.trialEndDate - trial.trialStartDate) / (1000 * 60 * 60 * 24));
  const usedDays = Math.ceil((new Date() - trial.trialStartDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - usedDays);
  
  return {
    totalDays,
    usedDays,
    remainingDays,
    usageRate: totalDays > 0 ? (usedDays / totalDays * 100).toFixed(2) : 0,
    loginCount: trial.loginCount,
    lastLoginAt: trial.lastLoginAt,
    avgLoginsPerDay: usedDays > 0 ? (trial.loginCount / usedDays).toFixed(2) : 0
  };
};

// 批量发送即将到期提醒
const sendExpiryReminders = async () => {
  const { sendTrialExpiryReminder } = require('./emailService');
  
  try {
    // 获取7天内到期的试用账户
    const expiringTrials = await getExpiringTrials(7);
    
    for (const trial of expiringTrials) {
      const remainingDays = Math.ceil((trial.trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (remainingDays <= 7 && remainingDays > 0) {
        try {
          await sendTrialExpiryReminder(trial, remainingDays);
          console.log(`已发送到期提醒邮件给: ${trial.email}`);
        } catch (emailError) {
          console.error(`发送到期提醒邮件失败 (${trial.email}):`, emailError);
        }
      }
    }
    
    return { success: true, notified: expiringTrials.length };
  } catch (error) {
    console.error('批量发送到期提醒失败:', error);
    throw error;
  }
};

module.exports = {
  generateTrialAccount: async (companyName) => {
    const username = await generateUniqueUsername(companyName);
    const password = generateRandomPassword();
    const accessUrl = generateAccessUrl(username);
    
    return { username, password, accessUrl };
  },
  validateTrialAccess,
  getExpiringTrials,
  cleanupExpiredTrials,
  getTrialUsageStats,
  sendExpiryReminders
};