const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const saleRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function dropLegacyIndexes() {
  const db = mongoose.connection.db;
  const drops = [
    { col: 'categories', idx: 'name_1' },
    { col: 'products', idx: 'sku_1' },
  ];
  for (const { col, idx } of drops) {
    try {
      await db.collection(col).dropIndex(idx);
      console.log(`Dropped legacy index ${idx} from ${col}`);
    } catch {
      // Index doesn't exist — nothing to do
    }
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await dropLegacyIndexes();
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error(err));
