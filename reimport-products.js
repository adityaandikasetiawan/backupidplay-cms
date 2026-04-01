const http = require('http');
const fs = require('fs');

const API_TOKEN = 'c99cf604d98ce3b61d3ac77bbf43c7e91181943214f3b3fae88256639e93cbd8b5b3d1da25b3edb393ca07f40a4faef81c8213c2976aa0d36b4162b17b4fd238792bf55eb58742e315fe6e59b4857d3d0ebc687f39b333c5886923f6018a6ad492438970129ea11d222d585228782c34ea97739eef0b757c3054f36df22269d3';

// Mapping from Cloud documentIDs to Local documentIDs
const regionMapping = {
    'r8bna2vipc26wfzgjc57qq4s': 't2fixe9g9cpnji2ppfk7wvlk',  // BANTEN
    'x8wj05809ep28a13kn85x2g0': 'chm88z9facmlm7mdp9l572sj',  // JABAR
    'e5kkvih5yx4rxsa9dv54gxy3': 'tf1cp5f1gxcxd8mn3ko6ii8a',  // JABODETABEK
    'qckcx0707oyga775of1cv4g7': 'dnuvl1u5snkfo4a6sxem3eeg',  // JATENG
    'k74urqtjo7yzufhrrb6t74zd': 'i60us4ka8dtq0x7mku1r75sm',  // JATIMBALINUSRA
    'an6r8g66tkxdl1ym0e4ebgwv': 'pdwx09aji6rmh0b0qgmrmwrd',  // KALIMANTAN
    'brbucifnrc9bqh2p4ruoz1yg': 'y8e4tpv0ng0rx806jbigw4pf'   // SULAWESI
};

async function fetchLocal(path) {
    return new Promise(resolve => {
        http.get({ hostname: '127.0.0.1', port: 3032, path, headers: { Authorization: `Bearer ${API_TOKEN}` } }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ data: [] }); } });
        }).on('error', () => resolve({ data: [] }));
    });
}

async function deleteProduct(docId) {
    return new Promise(resolve => {
        const req = http.request({ hostname: '127.0.0.1', port: 3032, path: `/api/products/${docId}`, method: 'DELETE', headers: { Authorization: `Bearer ${API_TOKEN}` } }, res => {
            res.on('data', () => { }); res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', () => resolve(0)); req.end();
    });
}

async function createProduct(data) {
    return new Promise(resolve => {
        const pd = JSON.stringify({ data });
        const req = http.request({ hostname: '127.0.0.1', port: 3032, path: '/api/products', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(pd), Authorization: `Bearer ${API_TOKEN}` } }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, data: d }));
        });
        req.on('error', () => resolve({ status: 0 })); req.write(pd); req.end();
    });
}

async function main() {
    console.log('=== Re-importing Products with Regional Relations ===\n');

    // Delete existing products
    console.log('Step 1: Deleting existing products...');
    const existing = await fetchLocal('/api/products?pagination[pageSize]=100');
    for (const p of (existing.data || [])) {
        await deleteProduct(p.documentId);
        console.log(`  Deleted: ${p.productName}`);
    }

    // Read source data
    console.log('\nStep 2: Reading source data...');
    const sourceProducts = JSON.parse(fs.readFileSync('/tmp/products.json')).data || [];
    console.log(`  Found ${sourceProducts.length} products to import`);

    // Create products with relations
    console.log('\nStep 3: Creating products with regional relations...');
    for (const p of sourceProducts) {
        const localRegionalIds = (p.regionals || [])
            .map(r => regionMapping[r.documentId])
            .filter(Boolean);

        const result = await createProduct({
            productCode: p.productCode,
            productName: p.productName,
            finalSpeedInMbps: p.finalSpeedInMbps,
            originalSpeedInMbps: p.originalSpeedInMbps,
            originalPrice: p.originalPrice,
            promoPrice: p.promoPrice,
            billingCycle: p.billingCycle,
            priceHint: p.priceHint,
            regionals: localRegionalIds
        });

        const status = result.status === 200 || result.status === 201 ? '✓' : '✗';
        console.log(`  ${status} ${p.productName} (regionals: ${localRegionalIds.length})`);
    }

    console.log('\n=== DONE ===');
}

main().catch(console.error);
