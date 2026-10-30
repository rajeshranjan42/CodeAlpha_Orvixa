import mongoose from 'mongoose';
export const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String, image: String, price: Number, qty: Number,
  }],
  address: { name: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String },
  payment: { method: { type: String, enum: ['UPI', 'Card', 'COD'] }, status: { type: String, default: 'Paid' } },
  couponCode: String,
  subtotal: Number, discount: Number, delivery: Number, gst: Number, total: Number,
  status: { type: String, enum: STATUSES, default: 'Placed' },
  history: [{ status: String, at: { type: Date, default: Date.now } }],
  deliveredAt: Date,
}, { timestamps: true });
export default mongoose.model('Order', schema);
