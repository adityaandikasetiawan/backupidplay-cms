const https = require('https');
const http = require('http');

const SOURCE_URL = 'https://incredible-miracle-c428705dcb.strapiapp.com';
const DEST_URL = 'http://127.0.0.1:3032';
const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

// API endpoints to migrate
const ENDPOINTS = [
    'regionals',
    'product-categories',
    'product-benefits',
    'products',
    'testimonials',
    'national-banners',
    'articles',
    'authors',
    'categories',
    'press-releases',
    'regional-banners'
];

// Fetch data from source
async function fetchFromSource(endpoint) {
    return new Promise((resolve, reject) => {
        https.get(`${SOURCE_URL}/api/${endpoint}?populate=*&pagination[pageSize]=100`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.data || []);
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', reject);
    });
}

// Post data to destination
async function postToDestination(endpoint, data) {
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
                resolve({ status: res.statusCode, data: responseData });
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Clean data for import (remove id, documentId, timestamps)
function cleanDataForImport(item, endpoint) {
    const { id, documentId, createdAt, updatedAt, publishedAt, ...rest } = item;

    // Handle relations - extract IDs or clean objects
    const cleaned = {};
    for (const [key, value] of Object.entries(rest)) {
        if (value === null || value === undefined) {
            continue;
        }
        if (Array.isArray(value)) {
            // Skip relation arrays for now (will need separate handling)
            continue;
        }
        if (typeof value === 'object' && value.id) {
            // Skip nested objects (relations)
            continue;
        }
        cleaned[key] = value;
    }

    return cleaned;
}

async function migrateEndpoint(endpoint) {
    console.log(`\n=== Migrating ${endpoint} ===`);

    try {
        const sourceData = await fetchFromSource(endpoint);
        console.log(`Found ${sourceData.length} items in source`);

        let successCount = 0;
        let errorCount = 0;

        for (const item of sourceData) {
            const cleanedData = cleanDataForImport(item, endpoint);

            try {
                const result = await postToDestination(endpoint, cleanedData);
                if (result.status === 200 || result.status === 201) {
                    successCount++;
                } else {
                    errorCount++;
                    console.log(`  Error: ${result.status} - ${result.data.substring(0, 100)}`);
                }
            } catch (e) {
                errorCount++;
                console.log(`  Error posting: ${e.message}`);
            }
        }

        console.log(`  Success: ${successCount}, Errors: ${errorCount}`);
        return { endpoint, success: successCount, errors: errorCount };

    } catch (e) {
        console.log(`  Failed to fetch: ${e.message}`);
        return { endpoint, success: 0, errors: -1 };
    }
}

async function main() {
    console.log('=== Starting Full Migration ===');
    console.log(`Source: ${SOURCE_URL}`);
    console.log(`Destination: ${DEST_URL}`);

    const results = [];

    for (const endpoint of ENDPOINTS) {
        const result = await migrateEndpoint(endpoint);
        results.push(result);
    }

    console.log('\n=== Migration Summary ===');
    for (const r of results) {
        console.log(`${r.endpoint}: ${r.success} success, ${r.errors} errors`);
    }
}

main().catch(console.error);
