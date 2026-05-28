const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  unitCost: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  items: { type: [saleItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  profit: { type: Number, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['Valid', 'Void'], default: 'Valid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
