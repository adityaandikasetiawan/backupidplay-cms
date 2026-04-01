const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables in database:');
tables.forEach(t => console.log(t.name));

// Check for any article-related data
const articleTables = tables.filter(t => t.name.toLowerCase().includes('article'));
console.log('\\n\\nArticle-related tables:');
articleTables.forEach(t => {
  console.log('\\n--- ' + t.name + ' ---');
  const count = db.prepare('SELECT COUNT(*) as cnt FROM ' + t.name).get();
  console.log('Count:', count.cnt);
  if (count.cnt > 0 && count.cnt <= 20) {
    const rows = db.prepare('SELECT * FROM ' + t.name).all();
    rows.forEach(r => console.log(JSON.stringify(r)));
  }
});

db.close();
