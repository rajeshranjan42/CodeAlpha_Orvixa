import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, match: [/^\d{10}$/, 'Phone must be 10 digits'] },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true, default: '' },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, match: [/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'] },
  isDefault: { type: Boolean, default: false },
});
const lineSchema = new mongoose.Schema(
  { product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, qty: { type: Number, min: 1, default: 1 } },
  { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'], select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  phone: { type: String, default: '' },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [lineSchema],
  saved: [lineSchema],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matches = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.methods.toSafe = function () {
  const o = this.toObject(); delete o.password; delete o.cart; delete o.saved; delete o.__v; return o;
};
export default mongoose.model('User', userSchema);
