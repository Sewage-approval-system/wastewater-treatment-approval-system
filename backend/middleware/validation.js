const Joi = require('joi');

// 报价申请表单验证
const quoteSchema = Joi.object({
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '企业名称不能为空',
      'string.min': '企业名称至少需要2个字符',
      'string.max': '企业名称不能超过100个字符',
      'any.required': '企业名称是必填项'
    }),
    
  contactName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': '联系人姓名不能为空',
      'string.min': '联系人姓名至少需要2个字符',
      'string.max': '联系人姓名不能超过50个字符',
      'any.required': '联系人姓名是必填项'
    }),
    
  phone: Joi.string()
    .trim()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.empty': '联系电话不能为空',
      'string.pattern.base': '请输入有效的手机号码',
      'any.required': '联系电话是必填项'
    }),
    
  email: Joi.string()
    .trim()
    .email()
    .allow('')
    .messages({
      'string.email': '请输入有效的邮箱地址'
    }),
    
  companyType: Joi.string()
    .valid('government', 'park', 'enterprise', 'consultant', 'other')
    .required()
    .messages({
      'any.only': '请选择有效的企业类型',
      'any.required': '企业类型是必填项'
    }),
    
  userCount: Joi.string()
    .valid('1-10', '11-50', '51-100', '100+', '')
    .allow('')
    .messages({
      'any.only': '请选择有效的用户数量范围'
    }),
    
  requirements: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': '特殊需求不能超过1000个字符'
    })
});

// 试用申请表单验证
const trialSchema = Joi.object({
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '企业名称不能为空',
      'string.min': '企业名称至少需要2个字符',
      'string.max': '企业名称不能超过100个字符',
      'any.required': '企业名称是必填项'
    }),
    
  contactName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': '联系人姓名不能为空',
      'string.min': '联系人姓名至少需要2个字符',
      'string.max': '联系人姓名不能超过50个字符',
      'any.required': '联系人姓名是必填项'
    }),
    
  phone: Joi.string()
    .trim()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.empty': '联系电话不能为空',
      'string.pattern.base': '请输入有效的手机号码',
      'any.required': '联系电话是必填项'
    }),
    
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.empty': '邮箱不能为空',
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    })
});

// 验证中间件工厂函数
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true // 移除未定义的字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: '表单验证失败',
        details: errors
      });
    }

    // 将验证后的数据替换原始数据
    req.body = value;
    next();
  };
};

// 导出验证中间件
const validateQuote = createValidationMiddleware(quoteSchema);
const validateTrial = createValidationMiddleware(trialSchema);

// 通用查询参数验证
const validateQuery = (req, res, next) => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(100).allow(''),
    status: Joi.string().trim().max(50).allow(''),
    companyType: Joi.string().trim().max(50).allow(''),
    startDate: Joi.date().iso().allow(''),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('')
  }).unknown(true); // 允许其他查询参数

  const { error, value } = querySchema.validate(req.query, {
    stripUnknown: false
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: '查询参数验证失败',
      details: errors
    });
  }

  req.query = { ...req.query, ...value };
  next();
};

// ID参数验证
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: '无效的ID格式'
    });
  }
  
  next();
};

module.exports = {
  validateQuote,
  validateTrial,
  validateQuery,
  validateObjectId
};