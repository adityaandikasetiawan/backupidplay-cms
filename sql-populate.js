// Direct SQL population using better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp/data.db');
console.log(`📁 Opening database: ${dbPath}\n`);

const db = new Database(dbPath);

try {
    console.log('🚀 Starting data population...\n');

    // Insert Regionals
    console.log('📥 Inserting Regionals...');
    const regions = ['BANTEN', 'JABODETABEK', 'JABAR', 'JATENG', 'JATIM', 'JOMBANG', 'MALANG'];
    const insertRegional = db.prepare(`
    INSERT INTO regionals (document_id, region, created_at, updated_at, published_at, locale)
    VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'), null)
  `);

    regions.forEach((region, i) => {
        const docId = `reg_${Date.now()}_${i}`;
        insertRegional.run(docId, region);
        console.log(`  ✅ ${region}`);
    });

    // Insert Product Categories
    console.log('\n📥 Inserting Product Categories...');
    const categories = ['RETAIL', 'NON_RETAIL'];
    const insertCategory = db.prepare(`
    INSERT INTO product_categories (document_id, name, created_at, updated_at, published_at, locale)
    VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'), null)
  `);

    categories.forEach((cat, i) => {
        const docId = `cat_${Date.now()}_${i}`;
        insertCategory.run(docId, cat);
        console.log(`  ✅ ${cat}`);
    });

    // Insert Testimonials
    console.log('\n📥 Inserting Testimonials...');
    const testimonials = [
        ['Budi Santoso', 'Internet cepat dan stabil', 'Entrepreneur', 5],
        ['Siti Rahman', 'Pelayanan sangat memuaskan', 'Teacher', 5],
        ['Ahmad Yani', 'Harga terjangkau kualitas bagus', 'Developer', 4],
        ['Dewi Lestari', 'Recommended untuk WFH', 'Designer', 5],
        ['Rudi Hartono', 'Support team responsif', 'Manager', 4],
        ['Linda Wijaya', 'Streaming lancar tanpa buffering', 'Content Creator', 5],
        ['Andi Prakoso', 'Best value for money', 'Student', 5]
    ];

    const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (document_id, name, quote, job, rating, created_at, updated_at, published_at, locale)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)
  `);

    testimonials.forEach(([name, quote, job, rating], i) => {
        const docId = `test_${Date.now()}_${i}`;
        insertTestimonial.run(docId, name, quote, job, rating);
        console.log(`  ✅ ${name}`);
    });

    // Verify counts
    console.log('\n📊 Verification...');
    const regionalCount = db.prepare('SELECT COUNT(*) as count FROM regionals').get();
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM product_categories').get();
    const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get();

    console.log(`  Regionals: ${regionalCount.count}`);
    console.log(`  Product Categories: ${categoryCount.count}`);
    console.log(`  Testimonials: ${testimonialCount.count}`);

    console.log('\n✨ Population completed!');
    console.log('\nRestart Strapi to see changes:');
    console.log('  pm2 restart idplay_cms');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
