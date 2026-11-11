const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'sales',
      company: company || 'Worth Prime Global',
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      company: req.user.company,
    },
  });
}

/**
 * Auto-seed default admin and sales account if they don't exist
 */
async function ensureDefaultUsers() {
  try {
    const adminEmail = 'admin@worthprimeglobal.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const defaultAdmin = new User({
        name: 'Executive Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        company: 'Worth Prime Global',
      });
      await defaultAdmin.save();
      console.log(`[Auth] Default admin created: ${adminEmail} (password: admin123)`);
    }

    const salesEmail = 'sales@worthprimeglobal.com';
    const salesExists = await User.findOne({ email: salesEmail });

    if (!salesExists) {
      const defaultSales = new User({
        name: 'Tariq Al-Mansoor',
        email: salesEmail,
        password: 'sales123',
        role: 'sales',
        company: 'Worth Prime Global',
      });
      await defaultSales.save();
      console.log(`[Auth] Default sales user created: ${salesEmail} (password: sales123)`);
    }
  } catch (err) {
    console.error('[Auth] Failed to initialize default users:', err.message);
  }
}

module.exports = {
  login,
  register,
  me,
  ensureDefaultUsers,
};

