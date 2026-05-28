const router = require('express').Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const filter = { user: req.userId };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Category.countDocuments(filter),
    ]);

    res.json({ categories, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const category = await Category.create({ ...req.body, user: req.userId });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Category.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
