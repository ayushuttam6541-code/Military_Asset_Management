const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { base: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
        baseName: user.base?.name || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, role, baseId } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Username, password, and role are required' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    // Validate baseId if provided and role is not ADMIN
    if (role !== 'ADMIN' && baseId) {
      const base = await prisma.base.findUnique({
        where: { id: parseInt(baseId) },
      });

      if (!base) {
        return res.status(400).json({ success: false, message: 'Invalid base' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        baseId: role === 'ADMIN' ? null : (baseId ? parseInt(baseId) : null),
      },
      include: { base: true },
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
        baseName: user.base?.name || null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { base: true },
      select: {
        id: true,
        username: true,
        role: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, register, getMe };
