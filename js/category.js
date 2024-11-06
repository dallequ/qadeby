// category.js

document.addEventListener('DOMContentLoaded', () => {
  // Handle "Back to Categories" button
  const backButton = document.getElementById('back-button');
  backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  const animalsContainer = document.getElementById('animals');
  const imageGrid = animalsContainer.querySelector('.image-grid');

  // Clear the image grid to start fresh
  imageGrid.innerHTML = '';

  // Keep track of already added image names to avoid duplicates
  const addedImages = new Set();

  // Specify the maximum number of images to check
  const totalImages = 100; // Adjust this number based on your needs

  for (let i = 1; i <= totalImages; i++) {
    const imgSrc = `images/animals/animal${i}_index.png`;
    const imageName = `animal${i}`;

    if (!addedImages.has(imageName)) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = `Animal ${i}`;
      img.dataset.category = 'animals';
      img.dataset.image = imageName;
      img.classList.add('category-image');

      // Set onload and onerror handlers
      img.onload = () => {
        // Append the image to the grid after it successfully loads
        imageGrid.appendChild(img);
        addedImages.add(imageName);

        // Attach event listeners to the newly created image
        attachImageEventListeners(img);
      };

      img.onerror = () => {
        // If the image fails to load, we won't display it
        console.log(`Image ${imgSrc} failed to load and will not be displayed.`);
      };
    }
  }

  // Function to attach event listeners to an image
  function attachImageEventListeners(img) {
    // Attach event listener for navigation
    img.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation(); // Stop the click from bubbling up
      const category = img.getAttribute('data-category');
      const imageName = img.getAttribute('data-image');

      if (category && imageName) {
        window.location.href = `coloring.html?category=${category}&image=${imageName}`;
      } else {
        console.error('Missing category or image name for navigation.');
      }
    });

    img.addEventListener('mouseover', () => {
      const imageName = img.getAttribute('data-image');
      img.title = imageName;
      img.style.outline = '3px solid red'; // Highlight image on hover
    });

    img.addEventListener('mouseout', () => {
      img.style.outline = 'none'; // Remove highlight when not hovering
    });
  }
});
