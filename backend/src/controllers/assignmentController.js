const prisma = require('../config/database');

const getAssignments = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, status } = req.query;

    const where = {};
    if (baseId) where.baseId = parseInt(baseId);
    if (equipmentTypeId) where.equipmentTypeId = parseInt(equipmentTypeId);
    if (status) where.status = status;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true, category: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, personnelName, quantity } = req.body;

    if (!baseId || !equipmentTypeId || !personnelName || !quantity) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    // Check available inventory
    const asset = await prisma.asset.findFirst({
      where: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
      },
    });

    if (!asset || asset.quantity < parseInt(quantity)) {
      return res.status(400).json({ success: false, message: 'Insufficient inventory' });
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        baseId: parseInt(baseId),
        equipmentTypeId: parseInt(equipmentTypeId),
        personnelName,
        quantity: parseInt(quantity),
        assignedBy: req.user.userId,
        status: 'ACTIVE',
      },
      include: {
        base: { select: { id: true, name: true } },
        equipmentType: { select: { id: true, name: true } },
      },
    });

    // Update asset quantity
    await prisma.asset.update({
      where: { id: asset.id },
      data: { quantity: asset.quantity - parseInt(quantity) },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ASSIGNMENT',
        entityType: 'Assignment',
        entityId: assignment.id,
        details: `Assigned ${quantity} ${assignment.equipmentType.name} to ${personnelName} at ${assignment.base.name}`,
      },
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const returnAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status === 'RETURNED') {
      return res.status(400).json({ success: false, message: 'Assignment already returned' });
    }

    // Update assignment status
    await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: { status: 'RETURNED' },
    });

    // Return quantity to asset
    const asset = await prisma.asset.findFirst({
      where: {
        baseId: assignment.baseId,
        equipmentTypeId: assignment.equipmentTypeId,
      },
    });

    if (asset) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { quantity: asset.quantity + assignment.quantity },
      });
    } else {
      await prisma.asset.create({
        data: {
          baseId: assignment.baseId,
          equipmentTypeId: assignment.equipmentTypeId,
          quantity: assignment.quantity,
          status: 'AVAILABLE',
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ASSIGNMENT_RETURN',
        entityType: 'Assignment',
        entityId: parseInt(id),
        details: `Returned assignment ${id}`,
      },
    });

    res.json({ success: true, message: 'Assignment returned successfully' });
  } catch (error) {
    console.error('Return assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAssignments, createAssignment, returnAssignment };
