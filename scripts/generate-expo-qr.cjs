const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const qrPackageRoot = path.dirname(
  require.resolve("qrcode-terminal/package.json"),
);
const QRCode = require(path.join(qrPackageRoot, "vendor/QRCode"));
const QRErrorCorrectLevel = require(
  path.join(qrPackageRoot, "vendor/QRCode/QRErrorCorrectLevel"),
);

const detectedHost = Object.values(os.networkInterfaces())
  .flat()
  .find(
    (address) => address && address.family === "IPv4" && !address.internal,
  )?.address;
const host = process.env.EXPO_DEV_HOST || detectedHost || "localhost";
const port = process.env.EXPO_DEV_PORT || "8081";
const target = process.env.EXPO_DEV_URL || `exp://${host}:${port}`;
const output = path.join(__dirname, "..", "expo-go-qr.svg");
const quietZone = 4;
const moduleSize = 12;
const qr = new QRCode(-1, QRErrorCorrectLevel.M);

qr.addData(target);
qr.make();

const count = qr.getModuleCount();
const size = (count + quietZone * 2) * moduleSize;
const modules = [];

for (let row = 0; row < count; row += 1) {
  for (let column = 0; column < count; column += 1) {
    if (qr.isDark(row, column)) {
      modules.push(
        `<rect x="${(column + quietZone) * moduleSize}" y="${(row + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}"/>`,
      );
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${modules.join("")}</g></svg>`;
fs.writeFileSync(output, svg);
console.log(output);
