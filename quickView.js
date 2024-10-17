// src/scripts/quickView.js

(function() {
  let config = {
    quickViewEnabled: false,
    quickViewStyle: 'right'
  };

  function fetchConfig() {
    const managerId = document.body.getAttribute('data-manager-id');
    if (!managerId) {
      console.error('Manager ID not found');
      return;
    }

    fetch(`https://8f13-41-141-105-37.ngrok-free.app/getQuickViewConfig?managerId=${managerId}`)
      .then(response => response.json())
      .then(newConfig => {
        config = newConfig;
        applyConfig();
      })
      .catch(error => console.error('Failed to fetch quick view config:', error));
  }

  function applyConfig() {
    if (!config.quickViewEnabled) {
      removeQuickViewButtons();
      return;
    }
    addQuickViewButtons();
  }

  function addQuickViewButtons() {
    // Adjust these selectors based on Zid's actual HTML structure
    const productCards = document.querySelectorAll('.add-to-cart-button, .add-to-cart, .d-flex flex-column justify-content-start, .btn btn-primary product-card-add-to-cart, .a.btn.btn-primary.product-card-add-to-cart');
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) return; // Skip if button already exists

      const button = document.createElement('button');
      button.className = 'quick-view-btn';
      button.textContent = 'Quick View';
      button.style.cssText = `
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
      `;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = card.querySelector('[data-product-id]').getAttribute('data-product-id');
        openQuickView(productId);
      });

      // Adjust this selector based on Zid's actual HTML structure
      const addToCartBtn = card.querySelector('.add-to-cart-button, .add-to-cart, .d-flex flex-column justify-content-start, .btn btn-primary product-card-add-to-cart, .a.btn.btn-primary.product-card-add-to-cart');
      if (addToCartBtn) {
        if (config.quickViewStyle === 'left') {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
        } else {
          addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
        }
      } else {
        card.appendChild(button);
      }
    });
  }

  function removeQuickViewButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    quickViewButtons.forEach(button => button.remove());
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
    modal.style.cssText = `
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.4);
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div class="quick-view-content" style="background-color: #fefefe; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px;">
        <h2>${productData.name}</h2>
        <img src="${productData.image}" alt="${productData.name}" style="max-width: 100%; height: auto;">
        <p>${productData.description}</p>
        <p>Price: ${productData.price}</p>
        <button class="add-to-cart-btn" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Add to Cart</button>
        <button class="close-modal-btn" style="background-color: #f44336; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;">Close</button>
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

  // Fetch config and apply on page load
  fetchConfig();

  // Reapply config when the page content changes (e.g., for infinite scroll or AJAX updates)
  const observer = new MutationObserver(() => {
    fetchConfig();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose necessary functions
  window.HMStudioQuickView = {
    refreshConfig: fetchConfig,
    openQuickView: openQuickView
  };
})();
