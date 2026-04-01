// Final batch with correct schema
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp/data.db');
const db = new Database(dbPath);

try {
    console.log('🚀 Final batch (corrected)...\n');

    // Products with correct columns
    console.log('📥 Products...');
    const products = [
        ['RTL865', 'Super Play', 20, 10, 2148000, 2110000, 'Tahunan'],
        ['RTL850', 'Gold Play', 50, 25, 3000000, 2850000, 'Tahunan'],
        ['RTL840', 'Silver Play', 100, 50, 4200000, 3990000, 'Tahunan'],
        ['NRTL100', 'Business Pro', 200, 100, 7500000, 7125000, 'Tahunan'],
        ['NRTL50', 'Starter', 10, 5, 1500000, 1425000, 'Tahunan'],
        ['NRTL200', 'Enterprise', 500, 250, 15000000, 14250000, 'Tahunan']
    ];

    const insertProduct = db.prepare(`INSERT INTO products (document_id, product_code, product_name, final_speed_in_mbps, original_speed_in_mbps, original_price, promo_price, billing_cycle, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    products.forEach(([code, name, finalSpeed, origSpeed, origPrice, promoPrice, cycle], i) => {
        insertProduct.run(`pr_${Date.now()}_${i}`, code, name, finalSpeed, origSpeed, origPrice, promoPrice, cycle);
        console.log(`  ✅ ${name}`);
    });

    // Articles  
    console.log('\n📥 Articles...');
    const insertArticle = db.prepare(`INSERT INTO articles (document_id, title, slug, description, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    const articles = [
        ['Panduan Internet Cepat', 'panduan-internet', 'Tips internet'],
        ['Teknologi 5G', '5g-indonesia', 'Update 5G'],
        ['WFH Produktif', 'wfh-produktif', 'Tips WFH'],
        ['Streaming Lancar', 'streaming-lancar', 'Streaming tips'],
        ['Gaming Online', 'gaming-online', 'Gaming optimal'],
        ['Keamanan Internet', 'keamanan-internet', 'Lindungi data'],
        ['IoT Smart Home', 'iot-smart-home', 'Rumah pintar'],
        ['Cloud Computing', 'cloud-computing', 'Manfaat cloud'],
        ['Bandwidth Tips', 'bandwidth-tips', 'Kelola bandwidth'],
        ['Router Setup', 'router-setup', 'Setup router'],
        ['WiFi Coverage', 'wifi-coverage', 'Perluas WiFi'],
        ['ISP Comparison', 'isp-comparison', 'Pilih ISP'],
        ['Fiber Optic', 'fiber-optic', 'Fiber advantage'],
        ['Network Security', 'network-security', 'Amankan network']
    ];
    articles.forEach(([title, slug, desc], i) => {
        insertArticle.run(`art_${Date.now()}_${i}`, title, slug, desc);
        console.log(`  ✅ ${title}`);
    });

    // Press Releases
    console.log('\n📥 Press Releases...');
    const insertPR = db.prepare(`INSERT INTO press_releases (document_id, title, slug, description, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`);
    const prs = [
        ['Paket Baru 2024', 'paket-baru-2024', 'Peluncuran paket'],
        ['Ekspansi 10 Kota', 'ekspansi-kota', 'Perluasan layanan'],
        ['Partnership Disney+', 'partnership-disney', 'Kolaborasi streaming'],
        ['Award ISP Terbaik', 'award-isp', 'Penghargaan industri'],
        ['Upgrade Network', 'upgrade-network', 'Peningkatan jaringan'],
        ['CSR Program', 'csr-program', 'Tanggung jawab sosial'],
        ['Fiber Technology', 'fiber-tech', 'Inovasi fiber'],
        ['24/7 Support', 'support-247', 'Customer service']
    ];
    prs.forEach(([title, slug, desc], i) => {
        insertPR.run(`pr_${Date.now()}_${i}`, title, slug, desc);
        console.log(`  ✅ ${title}`);
    });

    // Banners
    console.log('\n📥 Banners...');
    db.prepare(`INSERT INTO national_banners (document_id, alt_name, list_number, created_at, updated_at, published_at, locale) VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'), null)`).run(`nb_${Date.now()}`, 'Promo Nasional', 1);
    console.log('  ✅ National Banner');

    db.prepare(`INSERT INTO regional_banners (document_id, alt_name, created_at, updated_at, published_at, locale) VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'), null)`).run(`rb_${Date.now()}_1`, 'Banner Jakarta');
    db.prepare(`INSERT INTO regional_banners (document_id, alt_name, created_at, updated_at, published_at, locale) VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'), null)`).run(`rb_${Date.now()}_2`, 'Banner Surabaya');
    console.log('  ✅ Regional Banners (2)');

    console.log('\n🎉 COMPLETE DATABASE SUMMARY:');
    const counts = {
        'Products': db.prepare('SELECT COUNT(*) as c FROM products').get().c,
        'Articles': db.prepare('SELECT COUNT(*) as c FROM articles').get().c,
        'Press Releases': db.prepare('SELECT COUNT(*) as c FROM press_releases').get().c,
        'National Banners': db.prepare('SELECT COUNT(*) as c FROM national_banners').get().c,
        'Regional Banners': db.prepare('SELECT COUNT(*) as c FROM regional_banners').get().c,
        'Product Benefits': db.prepare('SELECT COUNT(*) as c FROM product_benefits').get().c,
        'Authors': db.prepare('SELECT COUNT(*) as c FROM authors').get().c,
        'Categories': db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
        'Regionals': db.prepare('SELECT COUNT(*) as c FROM regionals').get().c,
        'Product Categories': db.prepare('SELECT COUNT(*) as c FROM product_categories').get().c,
        'Testimonials': db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c
    };

    let total = 0;
    Object.entries(counts).forEach(([name, count]) => {
        console.log(`  ${name}: ${count}`);
        total += count;
    });

    console.log(`\n✨ GRAND TOTAL: ${total}/63 entries`);
    console.log('\n🚀 Ready to use! Restart: pm2 restart idplay_cms');

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
