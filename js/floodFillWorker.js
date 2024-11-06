// floodFillWorker.js

/**
 * Flood Fill Worker
 * 
 * This Web Worker performs a scanline flood fill algorithm on image data.
 * It receives image data and flood fill parameters, processes the fill, and
 * sends back the modified image data to the main thread.
 * 
 * @message {Object} e.data - The data sent from the main thread.
 * @property {ArrayBuffer} imageDataBuffer - The buffer of the image data.
 * @property {number} x - The x-coordinate where the fill starts.
 * @property {number} y - The y-coordinate where the fill starts.
 * @property {Array} fillColor - The RGBA color to fill with.
 * @property {number} threshold - The color matching threshold.
 * @property {number} width - The width of the image.
 * @property {number} height - The height of the image.
 */

self.onmessage = function(e) {
  const { imageDataBuffer, x, y, fillColor, threshold, width, height } = e.data;

  // Directly use the buffer without creating ImageData to avoid copies
  const data = new Uint8ClampedArray(imageDataBuffer);

  const startPos = (y * width + x) * 4;
  const startColor = [
    data[startPos],
    data[startPos + 1],
    data[startPos + 2],
    data[startPos + 3]
  ];

  // If the start color matches the fill color within threshold, exit
  if (colorsMatch(startColor, fillColor, threshold)) {
    // Transfer back the original buffer
    self.postMessage({ imageDataBuffer: data.buffer }, [data.buffer]);
    return;
  }

  const pixelStack = [[x, y]];

  while (pixelStack.length > 0) {
    // Change from const to let to allow reassignment
    let [currentX, currentY] = pixelStack.pop();
    let currentPos = (currentY * width + currentX) * 4;

    // Move up as long as the color matches and we're within bounds
    while (
      currentY >= 0 &&
      colorsMatch(getPixelColor(data, currentX, currentY, width), startColor, threshold)
    ) {
      currentY--;
      currentPos -= width * 4;
    }

    // Move back down to the last matching pixel
    currentY++;
    currentPos += width * 4;

    let reachLeft = false;
    let reachRight = false;

    // Fill the pixels and check neighboring pixels
    while (
      currentY < height &&
      colorsMatch(getPixelColor(data, currentX, currentY, width), startColor, threshold)
    ) {
      // Fill the pixel with the fill color
      data[currentPos] = fillColor[0];
      data[currentPos + 1] = fillColor[1];
      data[currentPos + 2] = fillColor[2];
      data[currentPos + 3] = fillColor[3];

      // Check the pixel to the left
      if (currentX > 0) {
        if (
          colorsMatch(getPixelColor(data, currentX - 1, currentY, width), startColor, threshold)
        ) {
          if (!reachLeft) {
            pixelStack.push([currentX - 1, currentY]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      // Check the pixel to the right
      if (currentX < width - 1) {
        if (
          colorsMatch(getPixelColor(data, currentX + 1, currentY, width), startColor, threshold)
        ) {
          if (!reachRight) {
            pixelStack.push([currentX + 1, currentY]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      // Move to the next row
      currentY++;
      currentPos += width * 4;
    }
  }

  // Send back the modified buffer
  self.postMessage({ imageDataBuffer: data.buffer }, [data.buffer]);
};

/**
 * Retrieves the color of a pixel at (x, y).
 */
function getPixelColor(data, x, y, width) {
  const pos = (y * width + x) * 4;
  return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
}

/**
 * Determines if two colors match within a specified threshold.
 */
function colorsMatch(color1, color2, threshold) {
  const dr = color1[0] - color2[0];
  const dg = color1[1] - color2[1];
  const db = color1[2] - color2[2];
  const da = color1[3] - color2[3];
  const distance = Math.sqrt(dr * dr + dg * dg + db * db + da * da);
  return distance <= threshold;
}
