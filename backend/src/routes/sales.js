const router = require('express').Router();
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, from, to, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { createdBy: req.userId };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Sale.countDocuments(filter),
    ]);

    res.json({ sales, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { items, note } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Sale must have at least one item' });

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, user: req.userId });
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap[item.product];
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for: ${product.name}` });
    }

    let totalAmount = 0;
    let totalCost = 0;
    const saleItems = items.map((item) => {
      const product = productMap[item.product];
      totalAmount += product.price * item.quantity;
      totalCost += product.costPrice * item.quantity;
      return {
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        unitCost: product.costPrice,
      };
    });

    const sale = await Sale.create({
      items: saleItems,
      totalAmount,
      totalCost,
      profit: totalAmount - totalCost,
      note,
      createdBy: req.userId,
    });

    await Promise.all(
      items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -Number(item.quantity) } })
      )
    );

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Valid', 'Void'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const sale = await Sale.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.status === status) return res.json(sale);

    // Restore stock when voiding, deduct when re-validating
    const stockDelta = status === 'Void' ? 1 : -1;
    await Promise.all(
      sale.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: stockDelta * item.quantity } })
      )
    );

    sale.status = status;
    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/note', async (req, res) => {
  try {
    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { note: req.body.note },
      { new: true }
    );
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
