// src/scripts/quickView.js

window.HMStudioQuickView = (function() {
  // Check if the script has already been initialized
  if (window.HMStudioQuickViewInitialized) return window.HMStudioQuickView;
  window.HMStudioQuickViewInitialized = true;

  function addQuickViewButtons() {
    const productCards = document.querySelectorAll('.product-card'); // Adjust selector based on Zid's HTML structure
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return; // Skip if button already exists

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickView(card.dataset.productId); // Assume product ID is stored in data attribute
      });

      const addToCartBtn = card.querySelector('.add-to-cart-btn'); // Adjust selector based on Zid's HTML structure
      addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
    });
  }

  async function openQuickView(productId) {
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      console.error('Failed to open quick view:', error);
    }
  }

  async function fetchProductData(productId) {
    const response = await fetch(`https://api.zid.sa/v1/products/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch product data');
    return response.json();
  }

  function displayQuickViewModal(productData) {
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-content">
        <h2>${productData.name}</h2>
        <img src="${productData.image}" alt="${productData.name}">
        <p>${productData.description}</p>
        <p>Price: ${productData.price}</p>
        <button class="add-to-cart-btn">Add to Cart</button>
        <button class="close-modal-btn">Close</button>
      </div>
    `;

    modal.querySelector('.add-to-cart-btn').addEventListener('click', () => addToCart(productData.id));
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());

    document.body.appendChild(modal);
  }

  function addToCart(productId) {
    // TODO: Implement add to cart functionality
    console.log('Adding product to cart:', productId);
  }

  // Run the script
  addQuickViewButtons();

  // Re-run the script when the page content changes (e.g., infinite scroll)
  const observer = new MutationObserver(addQuickViewButtons);
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose public methods
  return {
    openQuickView: openQuickView,
    addToCart: addToCart
  };
})();