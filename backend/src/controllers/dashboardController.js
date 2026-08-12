const prisma = require('../config/database');

const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const baseFilter = baseId ? parseInt(baseId) : null;
    const equipmentFilter = equipmentTypeId ? parseInt(equipmentTypeId) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Calculate opening balance (inventory before start date)
    let openingBalance = 0;
    if (start) {
      const openingAssets = await prisma.asset.findMany({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
        },
      });

      openingBalance = openingAssets.reduce((sum, asset) => sum + asset.quantity, 0);

      // Subtract purchases before start date
      const purchasesBefore = await prisma.purchase.aggregate({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          purchaseDate: { lt: start },
        },
        _sum: { quantity: true },
      });

      // Add transfers in before start date
      const transfersInBefore = await prisma.transfer.aggregate({
        where: {
          destinationBaseId: baseFilter,
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          timestamp: { lt: start },
          status: 'COMPLETED',
        },
        _sum: { quantity: true },
      });

      // Subtract transfers out before start date
      const transfersOutBefore = await prisma.transfer.aggregate({
        where: {
          sourceBaseId: baseFilter,
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          timestamp: { lt: start },
          status: 'COMPLETED',
        },
        _sum: { quantity: true },
      });

      // Add returned assignments before start date
      const returnedBefore = await prisma.assignment.aggregate({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          status: 'RETURNED',
          assignedAt: { lt: start },
        },
        _sum: { quantity: true },
      });

      // Subtract active assignments before start date
      const assignedBefore = await prisma.assignment.aggregate({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          status: 'ACTIVE',
          assignedAt: { lt: start },
        },
        _sum: { quantity: true },
      });

      // Subtract expenditures before start date
      const expendedBefore = await prisma.expenditure.aggregate({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
          expendedAt: { lt: start },
        },
        _sum: { quantity: true },
      });

      openingBalance = openingBalance 
        - (purchasesBefore._sum.quantity || 0)
        + (transfersInBefore._sum.quantity || 0)
        - (transfersOutBefore._sum.quantity || 0)
        + (returnedBefore._sum.quantity || 0)
        - (assignedBefore._sum.quantity || 0)
        - (expendedBefore._sum.quantity || 0);
    } else {
      // If no start date, opening balance is current inventory
      const currentAssets = await prisma.asset.findMany({
        where: {
          ...(baseFilter && { baseId: baseFilter }),
          ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
        },
      });
      openingBalance = currentAssets.reduce((sum, asset) => sum + asset.quantity, 0);
    }

    // Calculate period movements
    const purchaseWhere = {
      ...(baseFilter && { baseId: baseFilter }),
      ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
      ...(start && { purchaseDate: { gte: start, ...(end && { lte: end }) } }),
      ...(!start && end && { purchaseDate: { lte: end } }),
    };

    const purchases = await prisma.purchase.aggregate({
      where: purchaseWhere,
      _sum: { quantity: true },
    });

    const transferInWhere = {
      destinationBaseId: baseFilter,
      ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
      ...(start && { timestamp: { gte: start, ...(end && { lte: end }) } }),
      ...(!start && end && { timestamp: { lte: end } }),
      status: 'COMPLETED',
    };

    const transfersIn = await prisma.transfer.aggregate({
      where: transferInWhere,
      _sum: { quantity: true },
    });

    const transferOutWhere = {
      sourceBaseId: baseFilter,
      ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
      ...(start && { timestamp: { gte: start, ...(end && { lte: end }) } }),
      ...(!start && end && { timestamp: { lte: end } }),
      status: 'COMPLETED',
    };

    const transfersOut = await prisma.transfer.aggregate({
      where: transferOutWhere,
      _sum: { quantity: true },
    });

    const assignmentWhere = {
      ...(baseFilter && { baseId: baseFilter }),
      ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
      ...(start && { assignedAt: { gte: start, ...(end && { lte: end }) } }),
      ...(!start && end && { assignedAt: { lte: end } }),
      status: 'ACTIVE',
    };

    const assigned = await prisma.assignment.aggregate({
      where: assignmentWhere,
      _sum: { quantity: true },
    });

    const expenditureWhere = {
      ...(baseFilter && { baseId: baseFilter }),
      ...(equipmentFilter && { equipmentTypeId: equipmentFilter }),
      ...(start && { expendedAt: { gte: start, ...(end && { lte: end }) } }),
      ...(!start && end && { expendedAt: { lte: end } }),
    };

    const expended = await prisma.expenditure.aggregate({
      where: expenditureWhere,
      _sum: { quantity: true },
    });

    const totalPurchases = purchases._sum.quantity || 0;
    const totalTransfersIn = transfersIn._sum.quantity || 0;
    const totalTransfersOut = transfersOut._sum.quantity || 0;
    const totalAssigned = assigned._sum.quantity || 0;
    const totalExpended = expended._sum.quantity || 0;

    const netMovement = totalPurchases + totalTransfersIn - totalTransfersOut;
    const closingBalance = openingBalance + netMovement - totalAssigned - totalExpended;

    res.json({
      success: true,
      data: {
        openingBalance: Math.max(0, openingBalance),
        purchases: totalPurchases,
        transfersIn: totalTransfersIn,
        transfersOut: totalTransfersOut,
        netMovement,
        assigned: totalAssigned,
        expended: totalExpended,
        closingBalance: Math.max(0, closingBalance),
      },
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboardMetrics };
