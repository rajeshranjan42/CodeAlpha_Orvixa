import mongoose from 'mongoose';
export const Banner = mongoose.model('Banner', new mongoose.Schema({
  kind: { type: String, enum: ['hero', 'promo'], default: 'hero' },
  title: String, subtitle: String, image: String, link: { type: String, default: '/' },
  order: { type: Number, default: 0 },
}));
export const Page = mongoose.model('Page', new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: String, content: String,
}, { timestamps: true }));
