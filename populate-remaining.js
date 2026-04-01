// Populate ALL remaining data - simplified version without media
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp/data.db');
console.log(`📁 Database: ${dbPath}\n`);

const db = new Database(dbPath);

try {
    console.log('🚀 Populating remaining collections...\n');

    // Product Benefits (6)
    console.log('📥 Product Benefits...');
    const benefits = [
        ['Disney+ 1 Bulan', 'ott'],
        ['Easy setup Process', 'umum'],
        ['Fast and reliable connection', 'umum'],
        ['No contract required', 'umum'],
        ['Vidio Pro', 'ott'],
        ['Netflix 1 Bulan', 'ott']
    ];

    const insertBenefit = db.prepare(`INSERT INTO product_benefits (document_id, name, type, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    benefits.forEach(([name, type], i) => {
        insertBenefit.run(`pb_${Date.now()}_${i}`, name, type);
        console.log(`  ✅ ${name}`);
    });

    // Authors (6)  
    console.log('\n📥 Authors...');
    const authors = [
        ['Bayu Aji', 'Teknologi, AI, game', 'Penulis lepas tech'],
        ['Kirana Putri', 'Wisata, kuliner', 'Traveler'],
        ['Rio Satria', 'Kesehatan, fitness', 'Ahli kebugaran'],
        ['Maya Dewi', 'Desain interior', 'Penulis desain'],
        ['Dika Nugraha', 'Keuangan, investasi', 'Analis keuangan'],
        ['Sari Wibowo', 'Psikologi', 'Penulis pengembangan diri']
    ];

    const insertAuthor = db.prepare(`INSERT INTO authors (document_id, name,interest, description, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    authors.forEach(([name, interest, desc], i) => {
        insertAuthor.run(`au_${Date.now()}_${i}`, name, interest, desc);
        console.log(`  ✅ ${name}`);
    });

    // Categories (4)
    console.log('\n📥 Categories...');
    const categories = [
        ['Lifestyle', 'lifestyle'],
        ['Technology', 'technology'],
        ['Business', 'business'],
        ['Health', 'health']
    ];

    const insertCat = db.prepare(`INSERT INTO categories (document_id, name, slug, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    categories.forEach(([name, slug], i) => {
        insertCat.run(`cat_${Date.now()}_${i}`, name, slug);
        console.log(`  ✅ ${name}`);
    });

    console.log('\n📊 Summary:');
    console.log(`  Product Benefits: ${db.prepare('SELECT COUNT(*) as c FROM product_benefits').get().c}`);
    console.log(`  Authors: ${db.prepare('SELECT COUNT(*) as c FROM authors').get().c}`);
    console.log(`  Categories: ${db.prepare('SELECT COUNT(*) as c FROM categories').get().c}`);
    console.log(`  Regionals: ${db.prepare('SELECT COUNT(*) as c FROM regionals').get().c}`);
    console.log(`  Product Categories: ${db.prepare('SELECT COUNT(*) as c FROM product_categories').get().c}`);
    console.log(`  Testimonials: ${db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c}`);

    const total = 6 + 6 + 4 + 7 + 2 + 7; // = 32 entries
    console.log(`\n✨ Total: ${total} entries populated!`);
    console.log('\nRestart Strapi: pm2 restart idplay_cms');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
