const router = require('express').Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category, sortBy = 'createdAt', sortOrder = 'desc', lowStock } = req.query;
    const mongoose = require('mongoose');
    const filter = { user: new mongoose.Types.ObjectId(req.userId) };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
    if (category) filter.category = new mongoose.Types.ObjectId(category);

    if (lowStock === 'true') {
      const pipeline = [
        { $match: filter },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $addFields: { isLowStock: { $lte: ['$stock', '$lowStockThreshold'] } } },
        { $sort: { isLowStock: -1, stock: 1 } },
        { $facet: {
          data: [{ $skip: (page - 1) * Number(limit) }, { $limit: Number(limit) }],
          total: [{ $count: 'count' }],
        }},
      ];
      const [result] = await Product.aggregate(pipeline);
      const products = result.data.map((p) => ({ ...p, id: p._id }));
      const total = result.total[0]?.count ?? 0;
      return res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({
      user: req.userId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).populate('category', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, user: req.userId });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
