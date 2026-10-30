import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Coupon from './models/Coupon.js';
import Order from './models/Order.js';
import Review from './models/Review.js';
import { Banner, Page } from './models/Content.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---- your own images: read automatically from client/public/image ----
const IMG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../client/public/image');
const files = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// every keyword must appear in the file name; smaller jpg/webp files win over big png files
const find = (...keys) => {
  const hit = files.filter((f) => keys.every((k) => norm(f).includes(k)));
  const light = hit.filter((f) => !/\.png$/i.test(f));
  return (light.length ? light : hit).map((f) => '/image/' + encodeURIComponent(f));
};
const own = {
  'Wireless Earbuds Pro': find('wireless', 'earbuds'),
  'Smart Watch Active': find('smartwatch'),
  'Bluetooth Speaker Mini': find('bluetooth', 'speaker'),
  'Power Bank 20000mAh': find('power', 'bank'),
  '4K Action Camera': find('4k', 'action', 'camera'),
  'Laptop Stand Aluminium': find('laptop', 'stand'),
  'Nova 5G Smartphone 128GB': find('nova'),
  'Phone Case Armor': find('armour', 'case'),
  'Fast Charger 65W': find('65w', 'charger'),
  'Tempered Glass Pack of 2': find('tempered', 'glass'),
  'Lite Smartphone 64GB': find('smartphone', 'collection'),
  'Phone Tripod Flexible': find('phone', 'tripod'),
  'Cotton Crew T-Shirt': find('cotton', 'crew'),
  'Slim Fit Jeans': find('slim', 'fit', 'jeans'),
  'Running Shoes Air': find('running', 'shoes'),
  'Hooded Sweatshirt': find('hooded'),
  'Leather Wallet': find('leather', 'wallet'),
  'Sports Cap': find('sports', 'cap'),
  'Non-stick Cookware Set': find('cookware'),
  'LED Desk Lamp': find('desk', 'lamp'),
  'Memory Foam Pillow': find('memory', 'foam'),
  'Stainless Steel Bottle 1L': find('stainless', 'bottle'),
  'Cotton Bedsheet King': find('bedsheet'),
  'Air Fryer 4L': find('air', 'fryer'),
  'The Pragmatic Programmer': find('programmer'),
  'Atomic Habits': find('atomic'),
  'Deep Work': find('deep', 'work'),
  'Clean Code': find('clean', 'coder'),
  'Wings of Fire': find('wings', 'fire'),
  'Rich Dad Poor Dad': find('rich', 'dad'),
  'Vitamin C Face Serum': find('vitamin', 'serum'),
  'Sunscreen SPF 50': find('sunscreen'),
  'Beard Trimmer Pro': find('trimmer'),
  'Hair Dryer 1800W': find('hair', 'dryer'),
  'Herbal Shampoo 500ml': find('herbal', 'shampoo'),
  'Moisturising Cream': find('moisturising'),
};
const banner = (fallback, ...keys) => find(...keys)[0] || fallback;

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;
const catalog = {
  Electronics: [['Wireless Earbuds Pro', 'Orvixa', 2499, 4999], ['Smart Watch Active', 'Pulse', 3999, 7999], ['Bluetooth Speaker Mini', 'Boomer', 1299, 2499], ['Power Bank 20000mAh', 'Voltix', 1599, 2299], ['4K Action Camera', 'Snapz', 5999, 9999], ['Laptop Stand Aluminium', 'Orvixa', 899, 1499]],
  Mobiles: [['Nova 5G Smartphone 128GB', 'Nova', 13999, 17999], ['Phone Case Armor', 'Guardy', 299, 799], ['Fast Charger 65W', 'Voltix', 799, 1499], ['Tempered Glass Pack of 2', 'Guardy', 199, 499], ['Lite Smartphone 64GB', 'Nova', 8999, 10999], ['Phone Tripod Flexible', 'Snapz', 399, 899]],
  Fashion: [['Cotton Crew T-Shirt', 'Weave', 399, 999], ['Slim Fit Jeans', 'Denimo', 1099, 2199], ['Running Shoes Air', 'Strider', 1999, 3999], ['Hooded Sweatshirt', 'Weave', 899, 1799], ['Leather Wallet', 'Hide', 499, 999], ['Sports Cap', 'Strider', 249, 499]],
  Home: [['Non-stick Cookware Set', 'Chefly', 1799, 3499], ['LED Desk Lamp', 'Lumo', 699, 1299], ['Memory Foam Pillow', 'Dreamy', 599, 1199], ['Stainless Steel Bottle 1L', 'Chefly', 349, 699], ['Cotton Bedsheet King', 'Dreamy', 799, 1799], ['Air Fryer 4L', 'Chefly', 4499, 7999]],
  Books: [['The Pragmatic Programmer', 'Addison', 549, 799], ['Atomic Habits', 'Penguin', 399, 699], ['Deep Work', 'Piatkus', 349, 599], ['Clean Code', 'Prentice', 599, 899], ['Wings of Fire', 'Universities Press', 199, 350], ['Rich Dad Poor Dad', 'Plata', 249, 399]],
  Beauty: [['Vitamin C Face Serum', 'Glowy', 499, 999], ['Sunscreen SPF 50', 'Glowy', 349, 599], ['Beard Trimmer Pro', 'Groomer', 999, 1999], ['Hair Dryer 1800W', 'Groomer', 1199, 2299], ['Herbal Shampoo 500ml', 'Veda', 299, 499], ['Moisturising Cream', 'Veda', 199, 349]],
};

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orvixa');
await Promise.all([User, Product, Coupon, Order, Review, Banner, Page].map((m) => m.deleteMany({})));

let n = 0;
const products = [];
for (const [category, rows] of Object.entries(catalog)) {
  for (const [title, brand, price, mrp] of rows) {
    n++;
    products.push({
      title, brand, category, price, mrp,
      description: `${title} by ${brand}. Quality you can rely on, delivered fast.`,
      bullets: ['Genuine product with 1-year brand warranty', 'Easy 7-day returns', 'Free delivery on orders above ₹499', 'Secure payments'],
      images: own[title]?.length ? own[title].slice(0, 6) : [1, 2, 3, 4].map((k) => img(`${n}-${k}`)),
      stock: n % 11 === 0 ? 0 : 5 + ((n * 7) % 40),
      featured: n % 3 === 0, bestSeller: n % 4 === 0,
    });
  }
}
const created = await Product.insertMany(products);

await User.create([
  { name: 'Orvixa Admin', email: 'admin@orvixa.com', password: 'Admin@12345', role: 'admin' },
  { name: 'Demo Customer', email: 'customer@orvixa.com', password: 'Customer@123', addresses: [{ name: 'Demo Customer', phone: '9876543210', line1: '12 MG Road', city: 'Raipur', state: 'Chhattisgarh', pincode: '492001', isDefault: true }] },
  { name: 'Rajesh Ranjan', email: 'officialrajeshranjan@gmail.com', password: '#Rajesh123', addresses: [{ name: 'Rajesh Ranjan', phone: '6287083510', line1: 'Guria', city: 'Supaul', state: 'Bihar', pincode: '852214', isDefault: true }] },
]);
await Coupon.create([
  { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, maxDiscount: 200 },
  { code: 'FLAT100', type: 'flat', value: 100, minOrder: 999 },
  { code: 'OLDONE', type: 'percent', value: 50, expiresAt: new Date('2026-10-31') },
]);
await Banner.create([
  { kind: 'hero', order: 0, title: 'Big savings on electronics', subtitle: 'Up to 50% off', image: banner('https://picsum.photos/seed/hero1/1600/500', 'big', 'electronics'), link: '/search?category=Electronics' },
  { kind: 'hero', order: 1, title: 'New season fashion', subtitle: 'Fresh arrivals every week', image: banner('https://picsum.photos/seed/hero2/1600/500', 'new', 'season', 'fashion'), link: '/search?category=Fashion' },
  { kind: 'hero', order: 2, title: 'Home upgrades', subtitle: 'Kitchen and bedroom essentials', image: banner('https://picsum.photos/seed/hero3/1600/500', 'warm', 'home'), link: '/search?category=Home' },
  { kind: 'promo', order: 0, title: 'Today\'s Deals', subtitle: 'Limited-time discounts', image: banner('https://picsum.photos/seed/promo1/1200/300', 'today', 'deals'), link: '/deals' },
]);
const privacy = `Last updated: [DATE]

Orvixa ("we", "us", "our") respects your privacy. This policy explains what personal information we collect when you use our website, how we use it, and the choices you have. By using Orvixa you agree to this policy.

1. Information we collect

Account details: your name, email address, mobile number and password. Your password is stored only in encrypted (hashed) form, so we cannot read it.

Delivery details: the addresses you save, including name, phone number, street address, city, state and pincode.

Order details: the items you buy, order totals, coupon codes used, payment method chosen and order status. We do not store full card numbers on our servers.

Activity on the site: items in your cart, wishlist items, reviews you write, and recently viewed products.

Technical information: basic server logs such as IP address, browser type and the pages requested, used to keep the site secure and working.

2. How we use your information

To create and manage your account and sign you in.

To process, deliver, track, cancel and return your orders.

To show your cart, wishlist and order history.

To prevent fraud and misuse, and to keep the website secure.

To answer your questions and support requests.

To improve our products, pages and performance.

We do not sell your personal information.

3. Cookies and local storage

Orvixa uses your browser's local storage to keep you signed in (a login token), to remember the items in your cart when you are not signed in, and to remember recently viewed products. You can clear this data at any time in your browser settings. Doing so will sign you out and empty a guest cart.

4. Sharing your information

We share information only when needed to run the service: with delivery partners so your order reaches you, with payment providers to process payments, and with technology providers that host our website and database. These parties may use your information only to provide their service to us.

We may also disclose information if required by law, court order or a government authority, or to protect the rights, safety and property of Orvixa, our customers or others.

5. Reviews and public content

Reviews you post show your name (or the first part of your email) and may be visible to other shoppers. Please do not include sensitive personal details in a review.

6. Data security

We protect your data with encrypted passwords, signed login tokens, access controls on admin features and limits on repeated login attempts. No system is completely secure, so please choose a strong password and do not share it.

7. How long we keep data

We keep your account information while your account is active. Order records are kept for as long as needed for returns, accounting and legal requirements. You can ask us to delete your account, and we will remove or anonymise data we are not required to keep.

8. Your choices and rights

You can view and update your name, phone number, addresses and password from Your Account at any time. You can also request a copy of your data, ask us to correct it, or ask us to delete it, subject to applicable law, including the Digital Personal Data Protection Act, 2023 of India. To make a request, contact us using the details below.

9. Children

Orvixa is not meant for children under 18. We do not knowingly collect information from children. If you believe a child has given us information, contact us and we will delete it.

10. Changes to this policy

We may update this policy from time to time. The date at the top shows when it was last changed. Continued use of Orvixa after a change means you accept the updated policy.

11. Contact us

[COMPANY NAME]
[ADDRESS]
Email: [support@yourdomain.com]
Phone: [PHONE NUMBER]`;

const terms = `Last updated: [DATE]

Welcome to Orvixa. By creating an account, browsing or placing an order, you agree to these Terms and Conditions. If you do not agree, please do not use the website.

1. Eligibility and your account

You must be at least 18 years old, or use Orvixa under the supervision of a parent or guardian. You are responsible for the accuracy of your account details and for keeping your password confidential. You are responsible for all activity under your account. Tell us immediately if you suspect unauthorised use.

2. Products and pricing

We try to show accurate descriptions, images and prices. Product images are for illustration, and colours may vary slightly on your screen. All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise. Prices and availability can change without notice. If a product is listed at a wrong price or is out of stock, we may cancel the order and refund any amount paid.

3. Orders

Placing an order is an offer to buy. An order is confirmed when it appears in Your Orders with the status Placed or Confirmed. We may refuse or cancel an order for reasons such as stock shortage, pricing errors, suspected fraud or an undeliverable address.

4. Payments

You can pay using the methods shown at checkout, which may include UPI, cards and Cash on Delivery. For Cash on Delivery, payment is due when the order is delivered. Payments made online are processed by secure third-party providers.

5. Coupons and offers

Coupons are valid only for the conditions shown, such as minimum order value, maximum discount and expiry date. Coupons have no cash value, cannot be combined unless stated, and may be withdrawn at any time. We may cancel discounts obtained by misuse.

6. Shipping, cancellation and returns

Shipping, cancellation and returns are governed by our Shipping Policy and Refund & Return Policy, which form part of these terms.

7. Reviews and user content

By posting a review you confirm it is honest and based on your own experience. You grant Orvixa a free licence to display it on the website. We may remove content that is false, abusive, unlawful or promotional.

8. Acceptable use

You agree not to misuse the website, including by attempting to gain unauthorised access, interfering with its operation, scraping data at scale, uploading harmful code, or using it for any unlawful purpose.

9. Intellectual property

The Orvixa name, logo, design and content belong to us or our licensors. You may not copy, reproduce or distribute them without our written permission. Brand names and product images belong to their respective owners.

10. Limitation of liability

To the fullest extent allowed by law, Orvixa is not liable for indirect or consequential loss arising from use of the website. Our total liability for any order is limited to the amount you paid for that order. Nothing in these terms limits rights you have under consumer protection law.

11. Privacy

Your use of Orvixa is also governed by our Privacy Policy.

12. Changes to these terms

We may update these terms from time to time. The updated version applies from the date shown above.

13. Governing law

These terms are governed by the laws of India. Disputes are subject to the courts at [CITY, STATE].

14. Contact

Questions about these terms: [support@yourdomain.com]`;

const refund = `Last updated: [DATE]

We want you to be happy with your purchase. This policy explains how cancellations, returns and refunds work at Orvixa.

1. Cancelling an order

You can cancel an order yourself from Your Orders while its status is Placed, Confirmed or Packed. Once an order is Shipped it can no longer be cancelled, but you may be able to return it after delivery. Cancelled items are returned to stock and any amount paid is refunded as described below.

2. Returning an item

You can request a return within 7 days of delivery from Your Orders, by choosing Return items on a Delivered order. After 7 days, the return option is no longer available.

To be eligible, the item should be unused, in its original condition and packaging, with all tags, accessories and invoices included.

3. Items that cannot be returned

Items marked as non-returnable on the product page, opened personal-care and hygiene products, perishable goods, and items damaged by misuse cannot be returned.

4. Damaged, defective or wrong items

If you receive a damaged, defective or incorrect item, request a return within 7 days of delivery and include a short description of the problem. We will arrange a replacement or a full refund, including delivery charges.

5. Refunds

Once a returned item is received and inspected, we approve the refund and notify you. Refunds are made to the original payment method and usually reach you within 5 to 10 business days, depending on your bank or payment provider. For Cash on Delivery orders, we will refund to a bank account or UPI ID that you provide.

Delivery charges are refunded only when the return is due to our error, such as a damaged, defective or wrong item.

6. Coupons

If an order that used a coupon is cancelled in full, the discount is not carried over as a credit. If part of an order is returned, the refund equals the amount you paid for those items after discount.

7. Need help?

Contact us at [support@yourdomain.com] or call [PHONE NUMBER] and include your order number.`;

const shipping = `Last updated: [DATE]

This policy explains how Orvixa ships your orders.

1. Where we deliver

We deliver to addresses across India that are served by our delivery partners. Enter your pincode at checkout to confirm delivery to your area. Pincodes must be valid 6-digit Indian pincodes.

2. Delivery charges

Delivery is FREE on orders of ₹499 or more after discounts. For orders below ₹499, a delivery fee of ₹40 applies. The exact charge is always shown in your order summary before you place the order.

3. Processing and delivery time

Orders are usually packed within 1 to 2 business days. After dispatch, delivery typically takes 3 to 7 business days depending on your location. The estimated delivery date is shown on the product page and in your order. Delays can happen during sales, festivals, bad weather or due to courier issues.

4. Tracking your order

You can follow your order from Your Orders by choosing Track package. The status moves through Placed, Confirmed, Packed, Shipped and Delivered.

5. Delivery attempts

Our partner will try to deliver to the address on your order. Please make sure the address and phone number are correct and that someone can receive the package. If delivery fails repeatedly, the order may be returned to us and refunded according to our Refund & Return Policy.

6. Cash on Delivery

For Cash on Delivery orders, please keep the exact amount ready. We may limit Cash on Delivery for some areas or order values.

7. Damaged packages

If a package looks damaged or tampered with, please do not accept it, or note it with the delivery person, and contact us right away at [support@yourdomain.com].

8. Contact

For shipping questions, write to [support@yourdomain.com] or call [PHONE NUMBER].`;

const contact = `We are happy to help with orders, returns, payments or anything else.

Email: [support@yourdomain.com]
Phone: [PHONE NUMBER] (Monday to Saturday, 10 am to 6 pm)
Address: [COMPANY NAME], [ADDRESS]

When you write to us, please include your order number so we can help you faster. We usually reply within one business day.

You can also use the form below to send us a message.`;

await Page.create([
  { slug: 'privacy', title: 'Privacy Policy', content: privacy },
  { slug: 'terms', title: 'Terms & Conditions', content: terms },
  { slug: 'refund', title: 'Refund & Return Policy', content: refund },
  { slug: 'shipping', title: 'Shipping Policy', content: shipping },
  { slug: 'contact', title: 'Contact Us', content: contact },
]);

const withOwn = products.filter((p) => own[p.title]?.length).length;
console.log(`Images: ${files.length} files found in client/public/image, ${withOwn}/${products.length} products matched.`);
console.log(`Seeded ${created.length} products. Admin: admin@orvixa.com / Admin@12345 · Customer: customer@orvixa.com / Customer@123 · Rajesh: officialrajeshranjan@gmail.com / #Rajesh123`);
await mongoose.disconnect();