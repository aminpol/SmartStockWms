const fs = require("fs");
const content = `PORT=3000
DATABASE_URL=postgresql://smartstockwms_user:DUl8OhDE7tpn7LmLVV50IeDpnodRVyCz@dpg-d4ojpai4d50c738ujosg-a.oregon-postgres.render.com/smartstockwms
`;
fs.writeFileSync(".env", content, "utf8");
console.log(".env file written successfully in UTF-8");
