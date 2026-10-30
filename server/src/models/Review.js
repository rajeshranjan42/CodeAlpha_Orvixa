import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  rating: { type: Number, required: true, min: [1, 'Rating must be 1 to 5'], max: [5, 'Rating must be 1 to 5'] },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ product: 1, user: 1 }, { unique: true });
export default mongoose.model('Review', schema);
