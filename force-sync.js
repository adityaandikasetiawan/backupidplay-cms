const https = require('https');
const http = require('http');

const SOURCE_URL = 'https://incredible-miracle-c428705dcb.strapiapp.com';
const DEST_URL = 'http://127.0.0.1:3032';
const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

const idMapping = { regionals: {}, 'product-categories': {}, 'product-benefits': {} };

async function fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (url.startsWith('https') ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: { ...headers, 'Authorization': `Bearer ${API_TOKEN}` }
        };

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { resolve({ data: [] }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function deleteItem(endpoint, documentId) {
    return new Promise((resolve) => {
        const url = new URL(`${DEST_URL}/api/${endpoint}/${documentId}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        };
        const req = http.request(options, (res) => {
            res.on('data', () => { });
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', () => resolve(0));
        req.end();
    });
}

async function postItem(endpoint, data) {
    return new Promise((resolve) => {
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
                try { resolve({ status: res.statusCode, data: JSON.parse(responseData) }); }
                catch { resolve({ status: res.statusCode, data: null }); }
            });
        });
        req.on('error', () => resolve({ status: 0, data: null }));
        req.write(postData);
        req.end();
    });
}

async function deleteAll(endpoint) {
    console.log(`Deleting all ${endpoint}...`);
    let total = 0;
    for (let i = 0; i < 5; i++) { // Multiple passes
        const data = await fetchJSON(`${DEST_URL}/api/${endpoint}?pagination[pageSize]=100`);
        if (!data.data || data.data.length === 0) break;
        for (const item of data.data) {
            await deleteItem(endpoint, item.documentId);
            total++;
        }
    }
    console.log(`  Deleted: ${total}`);
}

async function migrateWithMapping(endpoint, cleanFn) {
    console.log(`Migrating ${endpoint}...`);
    const sourceData = await fetchJSON(`${SOURCE_URL}/api/${endpoint}?populate=*&pagination[pageSize]=100`);
    let success = 0;

    for (const item of (sourceData.data || [])) {
        const result = await postItem(endpoint, cleanFn(item));
        if (result.status === 200 || result.status === 201) {
            success++;
            if (idMapping[endpoint]) {
                idMapping[endpoint][item.documentId] = result.data?.data?.documentId;
            }
        }
    }
    console.log(`  Success: ${success}/${sourceData.data?.length || 0}`);
}

async function migrateProducts() {
    console.log(`Migrating products with relations...`);
    const sourceData = await fetchJSON(`${SOURCE_URL}/api/products?populate=*&pagination[pageSize]=100`);
    let success = 0;

    for (const item of (sourceData.data || [])) {
        const regionalDocIds = (item.regionals || [])
            .map(r => idMapping.regionals[r.documentId])
            .filter(Boolean);
        const categoryDocIds = (item.productCategories || [])
            .map(c => idMapping['product-categories'][c.documentId])
            .filter(Boolean);
        const benefitDocIds = (item.benefits || [])
            .map(b => idMapping['product-benefits'][b.documentId])
            .filter(Boolean);

        const result = await postItem('products', {
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
        });

        if (result.status === 200 || result.status === 201) {
            success++;
            console.log(`  ✓ ${item.productName} (regionals: ${regionalDocIds.length})`);
        } else {
            console.log(`  ✗ ${item.productName}`);
        }
    }
    console.log(`  Total: ${success}/${sourceData.data?.length || 0}`);
}

async function main() {
    console.log('='.repeat(50));
    console.log('  FORCE SYNC ALL DATA');
    console.log('='.repeat(50));

    // Step 1: Delete everything (products first because of relations)
    console.log('\n--- STEP 1: Delete all existing data ---\n');
    await deleteAll('products');
    await deleteAll('testimonials');
    await deleteAll('national-banners');
    await deleteAll('regional-banners');
    await deleteAll('regionals');
    await deleteAll('product-categories');
    await deleteAll('product-benefits');
    await deleteAll('categories');
    await deleteAll('authors');

    // Step 2: Migrate base entities
    console.log('\n--- STEP 2: Migrate base entities ---\n');
    await migrateWithMapping('regionals', (i) => ({ region: i.region }));
    await migrateWithMapping('product-categories', (i) => ({ name: i.name, terms: i.terms }));
    await migrateWithMapping('product-benefits', (i) => ({ name: i.name, type: i.type }));
    await migrateWithMapping('categories', (i) => ({ name: i.name, slug: i.slug, description: i.description }));
    await migrateWithMapping('authors', (i) => ({ name: i.name, email: i.email }));

    // Step 3: Migrate products with relations
    console.log('\n--- STEP 3: Migrate products ---\n');
    await migrateProducts();

    // Step 4: Migrate other content
    console.log('\n--- STEP 4: Migrate other content ---\n');
    await migrateWithMapping('testimonials', (i) => ({ name: i.name, quote: i.quote, job: i.job, rating: i.rating }));
    await migrateWithMapping('national-banners', (i) => ({ altname: i.altname, listNumber: i.listNumber }));
    await migrateWithMapping('regional-banners', (i) => ({ altname: i.altname, listNumber: i.listNumber }));

    console.log('\n' + '='.repeat(50));
    console.log('  SYNC COMPLETE!');
    console.log('='.repeat(50));
    console.log('\nRegional mappings:', idMapping.regionals);
}

main().catch(console.error);
