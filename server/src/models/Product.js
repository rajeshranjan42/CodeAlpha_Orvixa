import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  brand: { type: String, default: 'Orvixa' },
  category: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  bullets: [String],
  images: [String],
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockAt: { type: Number, default: 5 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  featured: Boolean,
  bestSeller: Boolean,
}, { timestamps: true });
schema.virtual('discount').get(function () { return this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0; });
schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });
export default mongoose.model('Product', schema);
