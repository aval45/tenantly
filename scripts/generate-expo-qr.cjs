const fs = require("node:fs");
const QRCode = require("C:/tenantly-expo-go/node_modules/qrcode-terminal/vendor/QRCode");
const QRErrorCorrectLevel = require("C:/tenantly-expo-go/node_modules/qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel");

const target = "exp://172.20.10.2:8081";
const output = "C:/tenantly/expo-go-qr.svg";
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
