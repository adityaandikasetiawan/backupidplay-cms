const https = require('https');
const http = require('http');

const SOURCE_URL = 'https://incredible-miracle-c428705dcb.strapiapp.com';
const DEST_URL = 'http://127.0.0.1:3032';
const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

// Mapping of old documentIds to new documentIds
const idMapping = {
    regionals: {},
    'product-categories': {},
    'product-benefits': {},
    products: {},
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
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
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
    console.log(`\nDeleting all from ${endpoint}...`);
    const existing = await fetchJSON(`${DEST_URL}/api/${endpoint}?pagination[pageSize]=100`);

    if (!existing.data || existing.data.length === 0) {
        console.log(`  No items to delete`);
        return;
    }

    let deleted = 0;
    for (const item of existing.data) {
        const result = await deleteFromDest(endpoint, item.documentId);
        if (result.status === 200 || result.status === 204) {
            deleted++;
        }
    }
    console.log(`  Deleted ${deleted} items`);
}

async function migrateEndpointWithMapping(endpoint, cleanFn) {
    console.log(`\n=== Migrating ${endpoint} ===`);

    const sourceData = await fetchJSON(`${SOURCE_URL}/api/${endpoint}?populate=*&pagination[pageSize]=100`);
    console.log(`Found ${sourceData.data?.length || 0} items in source`);

    let success = 0;
    for (const item of sourceData.data || []) {
        const cleanedData = cleanFn(item);
        const result = await postToDest(endpoint, cleanedData);

        if (result.status === 200 || result.status === 201) {
            success++;
            // Store mapping
            if (idMapping[endpoint]) {
                idMapping[endpoint][item.documentId] = result.data?.data?.documentId;
            }
        } else {
            console.log(`  Error: ${JSON.stringify(result.data).substring(0, 100)}`);
        }
    }
    console.log(`  Success: ${success}`);
}

async function migrateProducts() {
    console.log(`\n=== Migrating products with relations ===`);

    const sourceData = await fetchJSON(`${SOURCE_URL}/api/products?populate=*&pagination[pageSize]=100`);
    console.log(`Found ${sourceData.data?.length || 0} products in source`);

    let success = 0;
    for (const item of sourceData.data || []) {
        // Get regional documentIds from mapping
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
            console.log(`  Created: ${item.productName}`);
        } else {
            console.log(`  Error for ${item.productName}: ${JSON.stringify(result.data).substring(0, 150)}`);
        }
    }
    console.log(`  Total success: ${success}`);
}

async function main() {
    console.log('=== Starting Clean Migration ===');

    // Step 1: Delete existing data (in reverse order of dependencies)
    console.log('\n--- STEP 1: Deleting existing data ---');
    await deleteAllFromEndpoint('products');
    await deleteAllFromEndpoint('testimonials');
    await deleteAllFromEndpoint('national-banners');
    await deleteAllFromEndpoint('regional-banners');
    await deleteAllFromEndpoint('product-benefits');
    await deleteAllFromEndpoint('product-categories');
    await deleteAllFromEndpoint('regionals');
    await deleteAllFromEndpoint('categories');
    await deleteAllFromEndpoint('authors');

    // Step 2: Migrate base entities first
    console.log('\n--- STEP 2: Migrating base entities ---');

    await migrateEndpointWithMapping('regionals', (item) => ({
        region: item.region
    }));

    await migrateEndpointWithMapping('product-categories', (item) => ({
        name: item.name,
        terms: item.terms
    }));

    await migrateEndpointWithMapping('product-benefits', (item) => ({
        name: item.name,
        type: item.type
    }));

    // Step 3: Migrate products with relations
    console.log('\n--- STEP 3: Migrating products with relations ---');
    await migrateProducts();

    // Step 4: Migrate other content
    console.log('\n--- STEP 4: Migrating other content ---');

    await migrateEndpointWithMapping('testimonials', (item) => ({
        name: item.name,
        quote: item.quote,
        job: item.job,
        rating: item.rating
    }));

    await migrateEndpointWithMapping('national-banners', (item) => ({
        altname: item.altname,
        listNumber: item.listNumber
    }));

    await migrateEndpointWithMapping('categories', (item) => ({
        name: item.name,
        slug: item.slug,
        description: item.description
    }));

    await migrateEndpointWithMapping('authors', (item) => ({
        name: item.name,
        email: item.email
    }));

    console.log('\n=== Migration Complete ===');
    console.log('ID Mappings:', JSON.stringify(idMapping, null, 2));
}

main().catch(console.error);
