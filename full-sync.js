const https = require('https');
const http = require('http');

const SOURCE_URL = 'https://incredible-miracle-c428705dcb.strapiapp.com';
const DEST_URL = 'http://127.0.0.1:3032';
const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

// ALL endpoints to sync
const ENDPOINTS_TO_DELETE = [
    'products',
    'testimonials',
    'national-banners',
    'regional-banners',
    'articles',
    'press-releases',
    'product-benefits',
    'product-categories',
    'regionals',
    'categories',
    'authors'
];

// Mapping for relations
const idMapping = {
    regionals: {},
    'product-categories': {},
    'product-benefits': {},
};

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ data: [] });
                }
            });
        }).on('error', reject);
    });
}

async function deleteFromDest(endpoint, documentId) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${DEST_URL}/api/${endpoint}/${documentId}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function postToDest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ data });
        const url = new URL(`${DEST_URL}/api/${endpoint}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${API_TOKEN}`
            }
        };
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(responseData) });
                } catch {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function deleteAllFromEndpoint(endpoint) {
    console.log(`Deleting ${endpoint}...`);
    let totalDeleted = 0;

    // Keep deleting until no more items
    while (true) {
        const existing = await fetchJSON(`${DEST_URL}/api/${endpoint}?pagination[pageSize]=100`);
        if (!existing.data || existing.data.length === 0) break;

        for (const item of existing.data) {
            await deleteFromDest(endpoint, item.documentId);
            totalDeleted++;
        }
    }
    console.log(`  Deleted ${totalDeleted} items`);
}

async function migrateSimple(endpoint, cleanFn, storeMapping = false) {
    console.log(`\nMigrating ${endpoint}...`);
    const sourceData = await fetchJSON(`${SOURCE_URL}/api/${endpoint}?populate=*&pagination[pageSize]=100`);

    let success = 0;
    for (const item of sourceData.data || []) {
        const cleanedData = cleanFn(item);
        const result = await postToDest(endpoint, cleanedData);

        if (result.status === 200 || result.status === 201) {
            success++;
            if (storeMapping && idMapping[endpoint]) {
                idMapping[endpoint][item.documentId] = result.data?.data?.documentId;
            }
        } else {
            console.log(`  Error: ${JSON.stringify(result.data).substring(0, 80)}`);
        }
    }
    console.log(`  Success: ${success}/${sourceData.data?.length || 0}`);
}

async function migrateProductsWithRelations() {
    console.log(`\nMigrating products with relations...`);
    const sourceData = await fetchJSON(`${SOURCE_URL}/api/products?populate=*&pagination[pageSize]=100`);

    let success = 0;
    for (const item of sourceData.data || []) {
        const regionalDocIds = (item.regionals || []).map(r => idMapping.regionals[r.documentId]).filter(Boolean);
        const categoryDocIds = (item.productCategories || []).map(c => idMapping['product-categories'][c.documentId]).filter(Boolean);
        const benefitDocIds = (item.benefits || []).map(b => idMapping['product-benefits'][b.documentId]).filter(Boolean);

        const productData = {
            productCode: item.productCode,
            productName: item.productName,
            finalSpeedInMbps: item.finalSpeedInMbps,
            originalSpeedInMbps: item.originalSpeedInMbps,
            originalPrice: item.originalPrice,
            promoPrice: item.promoPrice,
            billingCycle: item.billingCycle,
            priceHint: item.priceHint,
            regionals: regionalDocIds,
            productCategories: categoryDocIds,
            benefits: benefitDocIds
        };

        const result = await postToDest('products', productData);
        if (result.status === 200 || result.status === 201) {
            success++;
            console.log(`  ✓ ${item.productName}`);
        } else {
            console.log(`  ✗ ${item.productName}: ${JSON.stringify(result.data).substring(0, 80)}`);
        }
    }
    console.log(`  Total: ${success}/${sourceData.data?.length || 0}`);
}

async function main() {
    console.log('========================================');
    console.log('  FULL SYNC: Strapi Cloud → Local CMS');
    console.log('========================================\n');

    // STEP 1: Delete ALL existing data
    console.log('--- STEP 1: Deleting ALL existing data ---\n');
    for (const endpoint of ENDPOINTS_TO_DELETE) {
        await deleteAllFromEndpoint(endpoint);
    }

    // STEP 2: Migrate base entities (order matters for relations)
    console.log('\n--- STEP 2: Migrating base entities ---');

    await migrateSimple('regionals', (item) => ({ region: item.region }), true);
    await migrateSimple('product-categories', (item) => ({ name: item.name, terms: item.terms }), true);
    await migrateSimple('product-benefits', (item) => ({ name: item.name, type: item.type }), true);
    await migrateSimple('categories', (item) => ({ name: item.name, slug: item.slug, description: item.description }));
    await migrateSimple('authors', (item) => ({ name: item.name, email: item.email }));

    // STEP 3: Migrate products with relations
    console.log('\n--- STEP 3: Migrating products with relations ---');
    await migrateProductsWithRelations();

    // STEP 4: Migrate other content
    console.log('\n--- STEP 4: Migrating other content ---');

    await migrateSimple('testimonials', (item) => ({
        name: item.name, quote: item.quote, job: item.job, rating: item.rating
    }));

    await migrateSimple('national-banners', (item) => ({
        altname: item.altname, listNumber: item.listNumber
    }));

    await migrateSimple('regional-banners', (item) => ({
        altname: item.altname, listNumber: item.listNumber
    }));

    console.log('\n========================================');
    console.log('  SYNC COMPLETE!');
    console.log('========================================');
    console.log('\nID Mappings:', JSON.stringify(idMapping, null, 2));
}

main().catch(console.error);
