const fs = require('fs');
const http = require('http');

const DEST_URL = 'http://127.0.0.1:3032';
const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

const idMapping = { regionals: {}, 'product-categories': {}, 'product-benefits': {} };

function readJSON(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.log(`Error reading ${file}: ${e.message}`);
        return { data: [] };
    }
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

async function importFromFile(file, endpoint, cleanFn, storeMapping = false) {
    console.log(`\nImporting ${endpoint}...`);
    const json = readJSON(file);
    let success = 0;

    for (const item of (json.data || [])) {
        const result = await postItem(endpoint, cleanFn(item));
        if (result.status === 200 || result.status === 201) {
            success++;
            if (storeMapping && idMapping[endpoint]) {
                idMapping[endpoint][item.documentId] = result.data?.data?.documentId;
            }
            console.log(`  ✓ Created`);
        } else {
            console.log(`  ✗ Error: ${JSON.stringify(result.data).substring(0, 80)}`);
        }
    }
    console.log(`  Total: ${success}/${json.data?.length || 0}`);
}

async function importProducts() {
    console.log(`\nImporting products with relations...`);
    const json = readJSON('/tmp/products.json');
    let success = 0;

    for (const item of (json.data || [])) {
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
            console.log(`  ✗ ${item.productName}: ${JSON.stringify(result.data).substring(0, 80)}`);
        }
    }
    console.log(`  Total: ${success}/${json.data?.length || 0}`);
}

async function main() {
    console.log('='.repeat(50));
    console.log('  IMPORTING FROM JSON FILES');
    console.log('='.repeat(50));

    // Import base entities first
    await importFromFile('/tmp/regionals.json', 'regionals', (i) => ({ region: i.region }), true);
    await importFromFile('/tmp/product-categories.json', 'product-categories', (i) => ({ name: i.name, terms: i.terms }), true);
    await importFromFile('/tmp/product-benefits.json', 'product-benefits', (i) => ({ name: i.name, type: i.type }), true);

    // Import products with relations
    await importProducts();

    // Import other content
    await importFromFile('/tmp/testimonials.json', 'testimonials', (i) => ({ name: i.name, quote: i.quote, job: i.job, rating: i.rating }));
    await importFromFile('/tmp/national-banners.json', 'national-banners', (i) => ({ altname: i.altname, listNumber: i.listNumber }));

    console.log('\n' + '='.repeat(50));
    console.log('  IMPORT COMPLETE!');
    console.log('='.repeat(50));
    console.log('\nRegional mappings:', JSON.stringify(idMapping.regionals, null, 2));
}

main().catch(console.error);
