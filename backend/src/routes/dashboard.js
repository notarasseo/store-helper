const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const validMatch = { createdBy: userId, status: { $ne: 'Void' } };

    const [totalSales, monthlySales, totalProducts, lowStockProducts, revenueByDay, topProducts] =
      await Promise.all([
        Sale.aggregate([
          { $match: validMatch },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$profit' } } },
        ]),
        Sale.aggregate([
          { $match: { ...validMatch, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } },
        ]),
        Product.countDocuments({ user: req.userId }),
        Product.countDocuments({ user: req.userId, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
        Sale.aggregate([
          { $match: validMatch },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              profit: { $sum: '$profit' },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 30 },
        ]),
        Sale.aggregate([
          { $match: validMatch },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productName',
              totalQty: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
            },
          },
          { $sort: { totalQty: -1 } },
          { $limit: 5 },
        ]),
      ]);

    res.json({
      totalRevenue: totalSales[0]?.revenue ?? 0,
      totalProfit: totalSales[0]?.profit ?? 0,
      monthlyRevenue: monthlySales[0]?.revenue ?? 0,
      monthlyProfit: monthlySales[0]?.profit ?? 0,
      monthlySalesCount: monthlySales[0]?.count ?? 0,
      totalProducts,
      lowStockProducts,
      revenueByDay,
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
