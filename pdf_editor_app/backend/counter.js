const fs = require("fs");

const FILE = "count.txt";

function getCount() {
  if (!fs.existsSync(FILE)) return 0;
  return parseInt(fs.readFileSync(FILE));
}

function incrementCounter() {
  let count = getCount();
  count++;
  fs.writeFileSync(FILE, count.toString());
}

module.exports = { getCount, incrementCounter };