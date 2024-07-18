const { execSync } = require('child_process');

const latestTag = execSync('git describe --tags --abbrev=0').toString().trim();;
console.log('latest git tag:', latestTag);

const packageJsonPath = "../package.json";
const packageJson = require(packageJsonPath);

packageJson["version"] = latestTag;
// console.log('packageJson:\r\n', JSON.stringify(packageJson, null, 4));

const fs = require("fs");
fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 4));

console.log('rewrite version successfully');
