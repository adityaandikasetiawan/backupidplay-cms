// Simple import script for Strapi - runs on server
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3032';
const ADMIN_EMAIL = 'admin@idplay.co.id';
const ADMIN_PASSWORD = 'Admin123!';

let jwt = null;

async function login() {
    const res = await axios.post(`${BASE_URL}/admin/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    jwt = res.data.data.token;
    console.log('✅ Logged in');
}

async function importRegionals() {
    console.log('\n📥 Importing Regionals...');
    const regions = ['BANTEN', 'JABODETABEK', 'JABAR', 'JATENG', 'JATIM', 'JOMBANG', 'MALANG'];

    for (const region of regions) {
        try {
            await axios.post(
                `${BASE_URL}/api/regionals`,
                { data: { region } },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            console.log(`  ✅ ${region}`);
        } catch (e) {
            console.log(`  ⚠️  ${region}: ${e.response?.status || e.message}`);
        }
    }
}

async function importProductCategories() {
    console.log('\n📥 Importing Product Categories...');
    const categories = [
        { name: 'RETAIL', terms: null },
        { name: 'NON_RETAIL', terms: null }
    ];

    for (const cat of categories) {
        try {
            await axios.post(
                `${BASE_URL}/api/product-categories`,
                { data: cat },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            console.log(`  ✅ ${cat.name}`);
        } catch (e) {
            console.log(`  ⚠️  ${cat.name}: ${e.response?.status}`);
        }
    }
}

async function importTestimonials() {
    console.log('\n📥 Importing Testimonials...');
    const testimonials = [
        { name: 'Budi Santoso', quote: 'Internet cepat dan stabil', job: 'Entrepreneur', rating: 5 },
        { name: 'Siti Rahman', quote: 'Pelayanan sangat memuaskan', job: 'Teacher', rating: 5 },
        { name: 'Ahmad Yani', quote: 'Harga terjangkau kualitas bagus', job: 'Developer', rating: 4 },
        { name: 'Dewi Lestari', quote: 'Recommended untuk WFH', job: 'Designer', rating: 5 },
        { name: 'Rudi Hartono', quote: 'Support team responsif', job: 'Manager', rating: 4 },
        { name: 'Linda Wijaya', quote: 'Streaming lancar tanpa buffering', job: 'Content Creator', rating: 5 },
        { name: 'Andi Prakoso', quote: 'Best value for money', job: 'Student', rating: 5 }
    ];

    for (const t of testimonials) {
        try {
            await axios.post(
                `${BASE_URL}/api/testimonials`,
                { data: t },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            console.log(`  ✅ ${t.name}`);
        } catch (e) {
            console.log(`  ⚠️  ${t.name}: ${e.response?.status}`);
        }
    }
}

async function verifyCounts() {
    console.log('\n📊 Verifying imports...');

    const endpoints = [
        '/api/regionals',
        '/api/product-categories',
        '/api/testimonials'
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await axios.get(`${BASE_URL}${endpoint}`);
            console.log(`  ${endpoint}: ${res.data.data.length} items`);
        } catch (e) {
            console.log(`  ${endpoint}: ERROR`);
        }
    }
}

async function main() {
    console.log('🚀 Starting Strapi Data Import\n');

    try {
        await login();
        await importRegionals();
        await importProductCategories();
        await importTestimonials();
        await verifyCounts();

        console.log('\n✨ Import completed successfully!');
        console.log('\nNext: Import remaining collections (Products, Articles, etc)');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
