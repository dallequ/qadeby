// landing.js

document.addEventListener('DOMContentLoaded', () => {
  // Select all "Click for More" buttons
  const moreButtons = document.querySelectorAll('.more-button');

  moreButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the category from data-category attribute
      const category = button.getAttribute('data-category');
      
      // Navigate to the respective category page
      // e.g., 'animals.html' or 'food.html'
      window.location.href = `${category}.html`;
    });
  });

  // Select all images within categories
  const categoryImages = document.querySelectorAll('.image-grid img');

  categoryImages.forEach(img => {
    img.addEventListener('click', () => {
      const category = img.getAttribute('data-category');
      const imageName = img.getAttribute('data-image');

      // Navigate to coloring.html with URL parameters
      window.location.href = `coloring.html?category=${category}&image=${imageName}`;
    });
  });
});
