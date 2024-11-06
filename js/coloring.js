// coloring.js

document.addEventListener('DOMContentLoaded', () => {
  const fillCanvas = document.getElementById('fillLayer');
  const outlineCanvas = document.getElementById('outlineLayer');

  // Initialize contexts
  const fillCtx = fillCanvas.getContext('2d', { willReadFrequently: true });
  const outlineCtx = outlineCanvas.getContext('2d');

  const colorButtons = document.querySelectorAll('.color-button');
  const undoButton = document.getElementById('undoButton');
  const resetButton = document.getElementById('resetButton');
  const saveButton = document.getElementById('saveButton');
  const returnButton = document.getElementById('returnButton');

  let currentColor = '#FF6633'; // Default color
  let isFloodFilling = false;
  let actionHistory = [];
  let redoHistory = [];
  let floodFillQueue = []; // Queue to handle flood fill requests

  // Limit action history to prevent memory leaks
  const MAX_HISTORY = 20;

  // Initialize Web Worker
  let floodFillWorker;
  try {
    floodFillWorker = new Worker('js/floodFillWorker.js');
  } catch (error) {
    console.error('Failed to initialize Web Worker:', error);
    alert('An error occurred while loading the coloring tool. Please try again later.');
    return;
  }

  // Handle messages from the worker
  floodFillWorker.onmessage = function(e) {
    if (e.data.error) {
      console.error('Worker Error:', e.data.error);
      alert('An error occurred during the coloring process. Please try again.');
      isFloodFilling = false;
      return;
    }

    // Reconstruct ImageData from the returned buffer
    const modifiedData = new Uint8ClampedArray(e.data.imageDataBuffer);
    const imageData = new ImageData(modifiedData, fillCanvas.width, fillCanvas.height);
    fillCtx.putImageData(imageData, 0, 0);

    // Save action to history for Undo functionality
    actionHistory.push(fillCtx.getImageData(0, 0, fillCanvas.width, fillCanvas.height));

    // Limit the action history to prevent memory leaks
    if (actionHistory.length > MAX_HISTORY) {
      actionHistory.shift(); // Remove the oldest action
    }

    // Clear redo history as new action is taken
    redoHistory = [];

    // Unlock flood fill and process next in queue if available
    isFloodFilling = false;
    if (floodFillQueue.length > 0) {
      const nextFill = floodFillQueue.shift();
      applyColor(nextFill.x, nextFill.y);
    }
  };

  floodFillWorker.onerror = function(e) {
    console.error('Worker encountered an error:', e.message);
    alert('An unexpected error occurred during the coloring process.');
    isFloodFilling = false;
  };

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const imageName = urlParams.get('image');

  if (!category || !imageName) {
    alert('Invalid parameters. Redirecting to home page.');
    window.location.href = 'index.html';
  }

  // Load Images
  const fillImage = new Image();
  const outlineImage = new Image();

  fillImage.src = `images/${category}/${imageName}.png`;
  outlineImage.src = `images/${category}/${imageName}_trans.png`;

  let imagesLoaded = 0;

  fillImage.onload = () => {
    fillCtx.drawImage(fillImage, 0, 0, fillCanvas.width, fillCanvas.height);
    imagesLoaded++;
    if (imagesLoaded === 2) {
      initializeCanvas();
    }
  };

  fillImage.onerror = () => {
    alert('Failed to load fill image. Please check the image path.');
  };

  outlineImage.onload = () => {
    outlineCtx.drawImage(outlineImage, 0, 0, outlineCanvas.width, outlineCanvas.height);
    imagesLoaded++;
    if (imagesLoaded === 2) {
      initializeCanvas();
    }
  };

  outlineImage.onerror = () => {
    alert('Failed to load outline image. Please check the image path.');
  };

  function initializeCanvas() {
    // Initialize action history with the initial state
    const initialState = fillCtx.getImageData(0, 0, fillCanvas.width, fillCanvas.height);
    actionHistory.push(initialState);

    // Enable canvas interactions after images are loaded
    fillCanvas.style.pointerEvents = 'auto';
  }

  // Color Selection
  colorButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentColor = button.getAttribute('data-color');

      // Highlight selected color
      colorButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });
  });

  // Initialize first color as selected
  if (colorButtons.length > 0) {
    colorButtons[0].classList.add('selected');
  }

  // Mouse Events
  fillCanvas.addEventListener('mousedown', (e) => {
    if (isFloodFilling) {
      // Queue the flood fill request
      const { x, y } = getCanvasCoordinates(e);
      floodFillQueue.push({ x, y });
      return;
    }
    const { x, y } = getCanvasCoordinates(e);
    applyColor(x, y);
  });

  // Touch Events
  fillCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isFloodFilling) {
      // Queue the flood fill request
      if (e.touches.length > 0) {
        const { x, y } = getTouchCanvasCoordinates(e);
        floodFillQueue.push({ x, y });
      }
      return;
    }
    if (e.touches.length > 0) {
      const { x, y } = getTouchCanvasCoordinates(e);
      applyColor(x, y);
    }
  }, { passive: false });

  // Function to get mouse coordinates relative to the canvas
  function getCanvasCoordinates(event) {
    const rect = fillCanvas.getBoundingClientRect();
    const scaleX = fillCanvas.width / rect.width;
    const scaleY = fillCanvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    return { x, y };
  }

  // Function to get touch coordinates relative to the canvas
  function getTouchCanvasCoordinates(event) {
    const rect = fillCanvas.getBoundingClientRect();
    const scaleX = fillCanvas.width / rect.width;
    const scaleY = fillCanvas.height / rect.height;
    const touch = event.touches[0];
    const x = Math.floor((touch.clientX - rect.left) * scaleX);
    const y = Math.floor((touch.clientY - rect.top) * scaleY);
    return { x, y };
  }

  // Apply Color using Web Worker with Locking Mechanism
  function applyColor(x, y) {
    if (isFloodFilling) {
      // Queue the flood fill request
      floodFillQueue.push({ x, y });
      return;
    }

    isFloodFilling = true;

    const imageData = fillCtx.getImageData(0, 0, fillCanvas.width, fillCanvas.height);

    // Convert fillColor to an array
    const fillColorArray = hexToRgbArray(currentColor);

    // Send data to Web Worker using transferable objects
    floodFillWorker.postMessage({
      imageDataBuffer: imageData.data.buffer,
      x: x,
      y: y,
      fillColor: fillColorArray,
      threshold: 45, // Adjusted threshold for precise color matching
      width: fillCanvas.width,
      height: fillCanvas.height
    }, [imageData.data.buffer]);
  }

  // Helper Functions

  // Convert Hex to RGB Array
  function hexToRgbArray(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 255]; // Include alpha value
  }

  // Control Buttons Functionality

  // Undo Button
  undoButton.addEventListener('click', () => {
    if (actionHistory.length > 1) { // Keep at least the initial state
      redoHistory.push(actionHistory.pop());
      const previousState = actionHistory[actionHistory.length - 1];
      fillCtx.putImageData(previousState, 0, 0);
    }
  });

  // Reset Button: Removed Confirmation Prompt
  resetButton.addEventListener('click', () => {
    fillCtx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);
    fillCtx.drawImage(fillImage, 0, 0, fillCanvas.width, fillCanvas.height);
    actionHistory = [];
    const initialState = fillCtx.getImageData(0, 0, fillCanvas.width, fillCanvas.height);
    actionHistory.push(initialState);
    redoHistory = [];
    isFloodFilling = false; // Unlock any ongoing flood fill
    floodFillQueue = []; // Clear the queue
  });

  // Save Button
  saveButton.addEventListener('click', () => {
    // Merge fill and outline layers
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = fillCanvas.width;
    mergedCanvas.height = fillCanvas.height;
    const mergedCtx = mergedCanvas.getContext('2d');

    mergedCtx.drawImage(fillCanvas, 0, 0, fillCanvas.width, fillCanvas.height);
    mergedCtx.drawImage(outlineCanvas, 0, 0, outlineCanvas.width, outlineCanvas.height);

    const link = document.createElement('a');
    link.download = `${imageName}_colored.png`;
    link.href = mergedCanvas.toDataURL();
    link.click();
  });

  // Return to Landing Page Button
  returnButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});
