// // const express = require("express");
// // const router = express.Router();
// // const fs = require("fs");
// // const path = require("path");

// // const categories = [
// //   "cancellation",
// //   "coupons",
// //   "feedback",
// //   "general_inquiry", // updated to match the JSON file
// //   "giftcard",
// //   "okalspecials",
// //   "okalsupersaver",
// //   "orders_and_products",
// //   "payment",
// //   "refund_and_replacement",
// //   "wallet"
// // ];


// // router.get("/:category", (req, res) => {
// //   const category = req.params.category.toLowerCase().replace(/[\s-]/g, "_");
// //   if (!categories.includes(category)) {
// //     return res.status(400).json({ message: "Invalid FAQ category." });
// //   }

// //   const filePath = path.join(__dirname, "../config/faqs", `${category}.json`);

// //   if (!fs.existsSync(filePath)) {
// //     return res.json({ faqs: [] });
// //   }

// //   try {
// //     const data = fs.readFileSync(filePath, "utf8");
// //     const faqs = JSON.parse(data);
// //     res.json(faqs);
// //   } catch (err) {
// //     res.status(500).json({ message: "Error reading FAQs.", error: err.message });
// //   }
// // });
// // const faqs = JSON.parse(fs.readFileSync(filePath, "utf8"));
// //   res.json(faqs);


// // // Endpoint to list all categories
// // router.get("/", (req, res) => {
// //   res.json({
// //     categories
// //   });
// // });

// // module.exports = router;
// const express = require("express");
// const router = express.Router();
// const fs = require("fs");
// const path = require("path");

// // debug route - temporarily add this
// router.get("/_debug/list-files", (req, res) => {
//   const dir = path.join(__dirname, "../config/faqs");
//   if (!fs.existsSync(dir)) return res.json({ ok: false, message: "faqs dir missing", dir });
//   const files = fs.readdirSync(dir);
//   // Normalize filenames for easier comparison
//   const normalized = files.map(f => f.toLowerCase());
//   // categories expected (same as your categories array)
//   const expected = [
//     "cancellation",
//     "coupons",
//     "feedback",
//     "general_inquiry",
//     "giftcard",
//     "okalspecials",
//     "okalsupersaver",
//     "orders_and_products",
//     "payment",
//     "refund_and_replacement",
//     "wallet"
//   ];
//   const missing = expected.filter(cat => !normalized.includes(`${cat}.json`));
//   res.json({ ok: true, dir, files, missing });
// });


// // All FAQ categories
// const categories = [
//   "cancellation",
//   "coupons",
//   "feedback",
//   "general_inquiry",
//   "giftcard",
//   "okalspecials",
//   "okalsupersaver",
//   "orders_and_products",
//   "payment",
//   "returns_and_replacement",
//   "wallet"
// ];

// // Get FAQs by category
// router.get("/:category", (req, res) => {
//   const category = req.params.category.toLowerCase().replace(/[\s-]/g, "_");

//   if (!categories.includes(category)) {
//     return res.status(400).json({ message: "Invalid FAQ category." });
//   }

//   const filePath = path.join(__dirname, "../config/faqs", `${category}.json`);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ message: "FAQ file not found." });
//   }

//   const faqs = JSON.parse(fs.readFileSync(filePath, "utf8"));
//   res.json(faqs);
// });

// // Endpoint to list all categories
// router.get("/", (req, res) => {
//   res.json({
//     categories
//   });
// });

// module.exports = router;
// routes/faqsRoutes.js
// 
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const FAQ_DIR = path.join(__dirname, "../config/faqs");

// Debug route (optional)
router.get("/_debug/list-files", (req, res) => {
  if (!fs.existsSync(FAQ_DIR)) {
    return res.json({ ok: false, message: "faqs dir missing", dir: FAQ_DIR });
  }
  const files = fs.readdirSync(FAQ_DIR);
  res.json({ ok: true, dir: FAQ_DIR, files });
});

// Canonical categories (for reference/display)
const categories = [
  "Cancellation",
  "Coupons",
  "General_Enquiry",
  "Giftcard",
  "Okalspecials",
  "Okalsupersaver",
  "Orders_and_Products",
  "Payment",
  "Returns_and_Replacement",
  "Wallet"
];

// Helper: normalize incoming slug (lowercase + underscores)
function normalizeSlug(slug) {
  return String(slug || "").toLowerCase().replace(/[\s-]+/g, "_");
}

// Helper: capitalize first letter of each word/segment
function capitalizeWords(str) {
  return str
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_");
}

// Helper: find FAQ file flexibly
function findFaqFile(category) {
  if (!fs.existsSync(FAQ_DIR)) return null;
  const files = fs.readdirSync(FAQ_DIR);

  const direct = `${category}.json`;

  // exact
  if (files.includes(direct)) return path.join(FAQ_DIR, direct);

  // case-insensitive
  const ci = files.find(f => f.toLowerCase() === direct.toLowerCase());
  if (ci) return path.join(FAQ_DIR, ci);

  // flexible normalization
  const normalizeName = s => s.toLowerCase().replace(/[\s_-]/g, "");
  const matched = files.find(f => normalizeName(f) === normalizeName(direct));
  return matched ? path.join(FAQ_DIR, matched) : null;
}

// 🟢 Route: list all categories
router.get("/", (req, res) => {
  // Return categories with capitalized first letters for display
  const formatted = categories.map(capitalizeWords);
  res.json({ categories: formatted });
});

// 🟢 Route: get FAQ by category (case-insensitive)
router.get("/:category", (req, res) => {
  const raw = req.params.category;
  const normalized = normalizeSlug(raw);

  // Find a canonical category match (case-insensitive)
  const matchedCategory = categories.find(
    c => c.toLowerCase() === normalized
  );

  if (!matchedCategory) {
    return res
      .status(400)
      .json({ message: "Invalid FAQ category.", category: normalized });
  }

  const filePath = findFaqFile(matchedCategory);
  if (!filePath) {
    return res
      .status(404)
      .json({ message: "FAQ file not found on server.", category: matchedCategory });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return res.json({
      category: capitalizeWords(matchedCategory),
      faqs: data
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error reading FAQ file.",
      error: err.message
    });
  }
});

module.exports = router;
