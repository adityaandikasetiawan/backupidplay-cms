// Direct data insertion using Strapi's internal services
// Run this inside Strapi directory with: node direct-populate.js

const strapi = require('@strapi/strapi');

async function main() {
    console.log('🚀 Starting direct data population...\n');

    const app = await strapi().load();
    await app.start();

    try {
        // Import Regionals
        console.log('📥 Creating Regionals...');
        const regions = ['BANTEN', 'JABODETABEK', 'JABAR', 'JATENG', 'JATIM', 'JOMBANG', 'MALANG'];

        for (const region of regions) {
            await strapi.entityService.create('api::regional.regional', {
                data: { region, publishedAt: new Date() }
            });
            console.log(`  ✅ ${region}`);
        }

        // Import Product Categories
        console.log('\n📥 Creating Product Categories...');
        const categories = [
            { name: 'RETAIL' },
            { name: 'NON_RETAIL' }
        ];

        for (const cat of categories) {
            await strapi.entityService.create('api::product-category.product-category', {
                data: { ...cat, publishedAt: new Date() }
            });
            console.log(`  ✅ ${cat.name}`);
        }

        // Import Testimonials
        console.log('\n📥 Creating Testimonials...');
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
            await strapi.entityService.create('api::testimonial.testimonial', {
                data: { ...t, publishedAt: new Date() }
            });
            console.log(`  ✅ ${t.name}`);
        }

        console.log('\n✨ Data population completed!');
        console.log('\nVerifying...');

        // Verify counts
        const regionalCount = await strapi.entityService.count('api::regional.regional');
        const categoryCount = await strapi.entityService.count('api::product-category.product-category');
        const testimonialCount = await strapi.entityService.count('api::testimonial.testimonial');

        console.log(`  Regionals: ${regionalCount}`);
        console.log(`  Product Categories: ${categoryCount}`);
        console.log(`  Testimonials: ${testimonialCount}`);

        console.log('\n🎉 Success! Test APIs:');
        console.log('  - curl http://127.0.0.1:3032/api/regionals');
        console.log('  - curl http://127.0.0.1:3032/api/testimonials');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await app.destroy();
        process.exit(0);
    }
}

main();
