const router = require('express').Router();
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const validOnly = { $match: { status: { $ne: 'Void' } } };

    const [totalSales, monthlySales, totalProducts, lowStockProducts, revenueByDay, topProducts] =
      await Promise.all([
        Sale.aggregate([
          validOnly,
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$profit' } } },
        ]),
        Sale.aggregate([
          validOnly,
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } },
        ]),
        Product.countDocuments(),
        Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
        Sale.aggregate([
          validOnly,
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
          validOnly,
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
