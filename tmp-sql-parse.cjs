const { Parser } = require('node-sql-parser');
const p = new Parser();
const sql = `ALTER TABLE \`collection\`
  ADD CONSTRAINT \`fkc_user_creates_collection\` FOREIGN KEY (\`fk_user_creates\`) REFERENCES \`user\` (\`pk_username\`) ON DELETE CASCADE ON UPDATE CASCADE;`;
const ast = p.astify(sql, { database: 'MySQL' });
console.log(JSON.stringify(ast,null,2));
