const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const size = 1024;
const outputDir = path.join(__dirname, "..", "assets", "images");
const colors = {
  green: [23, 58, 43],
  lime: [212, 244, 91],
  cream: [248, 250, 239],
  hole: [23, 58, 43],
  white: [255, 255, 255],
};

function createCanvas(background) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      setPixel(png, x, y, background);
    }
  }
  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  png.data[offset] = color[0];
  png.data[offset + 1] = color[1];
  png.data[offset + 2] = color[2];
  png.data[offset + 3] = color[3] ?? 255;
}

function circle(png, cx, cy, radius, color) {
  const radiusSquared = radius * radius;
  for (
    let y = Math.max(0, Math.floor(cy - radius));
    y <= Math.min(size - 1, Math.ceil(cy + radius));
    y += 1
  ) {
    for (
      let x = Math.max(0, Math.floor(cx - radius));
      x <= Math.min(size - 1, Math.ceil(cx + radius));
      x += 1
    ) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radiusSquared)
        setPixel(png, x, y, color);
    }
  }
}

function polygon(png, points, color) {
  const minX = Math.max(
    0,
    Math.floor(Math.min(...points.map((point) => point[0]))),
  );
  const maxX = Math.min(
    size - 1,
    Math.ceil(Math.max(...points.map((point) => point[0]))),
  );
  const minY = Math.max(
    0,
    Math.floor(Math.min(...points.map((point) => point[1]))),
  );
  const maxY = Math.min(
    size - 1,
    Math.ceil(Math.max(...points.map((point) => point[1]))),
  );

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        const intersects =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
      }
      if (inside) setPixel(png, x, y, color);
    }
  }
}

function drawMark(png, monochrome = false) {
  const paddle = monochrome ? colors.white : colors.cream;
  const ball = monochrome ? colors.white : colors.lime;
  const cutout = monochrome ? [0, 0, 0, 0] : colors.green;

  polygon(
    png,
    [
      [570, 506],
      [690, 433],
      [886, 771],
      [767, 840],
    ],
    paddle,
  );
  circle(png, 819, 805, 66, paddle);
  circle(png, 390, 409, 248, ball);
  circle(png, 292, 335, 27, cutout);
  circle(png, 426, 287, 25, cutout);
  circle(png, 504, 401, 28, cutout);
  circle(png, 339, 461, 24, cutout);
  circle(png, 444, 529, 27, cutout);
  circle(png, 250, 527, 20, cutout);
}

fs.mkdirSync(outputDir, { recursive: true });
const icon = createCanvas([...colors.green, 255]);
drawMark(icon);
icon
  .pack()
  .pipe(fs.createWriteStream(path.join(outputDir, "pickle-scorer-icon.png")));

const splash = createCanvas([0, 0, 0, 0]);
drawMark(splash);
splash
  .pack()
  .pipe(fs.createWriteStream(path.join(outputDir, "pickle-scorer-splash.png")));

const monochrome = createCanvas([0, 0, 0, 0]);
drawMark(monochrome, true);
monochrome
  .pack()
  .pipe(
    fs.createWriteStream(path.join(outputDir, "pickle-scorer-monochrome.png")),
  );
