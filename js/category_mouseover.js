// Revised category.js

document.addEventListener('DOMContentLoaded', () => {
  // Handle "Back to Categories" button
  const backButton = document.getElementById('back-button');
  backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  const animalsContainer = document.getElementById('animals');
  const imageGrid = animalsContainer.querySelector('.image-grid');

  // Specify the number of images (you mentioned 65 total)
  const totalImages = 65;

  for (let i = 1; i <= totalImages; i++) {
    const img = document.createElement('img');
    img.src = `images/animals/animal${i}_index.png`;
    img.alt = `Animal ${i}`;
    img.dataset.category = 'animals';
    img.dataset.image = `animal${i}`;
    img.classList.add('category-image');

    // Attach event listener for navigation
    img.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation(); // Stop the click from bubbling up
      const category = img.getAttribute('data-category');
      const imageName = img.getAttribute('data-image');

      console.log(`Image clicked: category=${category}, imageName=${imageName}`);

      if (category && imageName) {
        window.location.href = `coloring.html?category=${category}&image=${imageName}`;
      } else {
        console.error('Invalid category or image name for:', img);
      }
    });

    img.addEventListener('mouseover', () => {
      console.log(`Mouse over: ${img.alt}`);
    });

    img.addEventListener('error', () => {
      console.error(`Image failed to load: ${img.src}`);
    });

    imageGrid.appendChild(img);
  }
});