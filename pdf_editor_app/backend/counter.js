const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "count.txt");

function getCount() {
  if (!fs.existsSync(FILE)) return 0;
  return parseInt(fs.readFileSync(FILE, "utf8"), 10) || 0;
}

function incrementCounter() {
  const count = getCount() + 1;
  fs.writeFileSync(FILE, count.toString(), "utf8");
}

module.exports = { getCount, incrementCounter };
