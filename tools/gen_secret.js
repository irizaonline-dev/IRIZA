const fs = require('fs');
const crypto = require('crypto');
const s = crypto.randomBytes(48).toString('hex');
console.log(s);
fs.writeFileSync('.jwt_secret', s);
