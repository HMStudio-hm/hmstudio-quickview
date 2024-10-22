// src/scripts/quickView.js v1.5.0

(function() {
  console.log('Quick View script initialized');

  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript;
    const scriptUrl = new URL(scriptTag.src);
    const storeId = scriptUrl.searchParams.get('storeId');
    return storeId ? storeId.split('?')[0] : null;
  }

  const storeId = getStoreIdFromUrl();
  if (!storeId) {
    console.error('Store ID not found in script URL');
    return;
  }

  const config = {
    ...window.HMStudioQuickViewConfig,
    storeId: storeId
  };

  console.log('Quick View config:', config);

  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${config.storeId}&productId=${productId}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch product data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Received product data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching product data:', error);
      throw error;
    }
  }

  function createImageGallery(images) {
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'quick-view-gallery';
    galleryContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    `;

    // Main image display
    const mainImageContainer = document.createElement('div');
    mainImageContainer.style.cssText = `
      width: 100%;
      height: 300px;
      overflow: hidden;
      border-radius: 8px;
      position: relative;
    `;

    const mainImage = document.createElement('img');
    mainImage.src = images[0]?.url || 'placeholder-url';
    mainImage.alt = 'Product Image';
    mainImage.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;
    mainImageContainer.appendChild(mainImage);

    // Thumbnails container
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 5px 0;
    `;

    images.forEach((image, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = image.url;
      thumbnail.alt = `Product Image ${index + 1}`;
      thumbnail.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid ${index === 0 ? '#4CAF50' : 'transparent'};
      `;

      thumbnail.addEventListener('click', () => {
        mainImage.src = image.url;
        // Update thumbnail borders
        thumbnailsContainer.querySelectorAll('img').forEach(thumb => {
          thumb.style.border = '2px solid transparent';
        });
        thumbnail.style.border = '2px solid #4CAF50';
      });

      thumbnailsContainer.appendChild(thumbnail);
    });

    galleryContainer.appendChild(mainImageContainer);
    galleryContainer.appendChild(thumbnailsContainer);
    return galleryContainer;
  }

  function createAttributesSection(attributes) {
    const attributesContainer = document.createElement('div');
    attributesContainer.className = 'quick-view-attributes';
    attributesContainer.style.cssText = `
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 15px;
    `;

    if (attributes && attributes.length > 0) {
      const title = document.createElement('h3');
      title.textContent = 'Product Attributes';
      title.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 1.1em;
        color: #333;
      `;
      attributesContainer.appendChild(title);

      const attributesList = document.createElement('div');
      attributesList.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
      `;

      attributes.forEach(attr => {
        const attrItem = document.createElement('div');
        attrItem.style.cssText = `
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
        `;
        attrItem.innerHTML = `
          <strong style="color: #666;">${attr.name.en || attr.name}:</strong>
          <span style="margin-left: 5px;">${attr.value.en || attr.value}</span>
        `;
        attributesList.appendChild(attrItem);
      });

      attributesContainer.appendChild(attributesList);
    }

    return attributesContainer;
  }

  function displayQuickViewModal(productData) {
    console.log('Displaying Quick View modal for product:', productData);
    
    const existingModal = document.querySelector('.quick-view-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const content = document.createElement('div');
    content.className = 'quick-view-content';
    content.style.cssText = `
      background-color: white;
      padding: 25px;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;

    // Create and append the title
    const title = document.createElement('h2');
    title.textContent = productData.name.en || productData.name;
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 1.5em;
      color: #333;
    `;
    content.appendChild(title);

    // Create and append the image gallery
    const gallery = createImageGallery(productData.images);
    content.appendChild(gallery);

    // Create product details section
    const details = document.createElement('div');
    details.style.cssText = `
      margin-top: 20px;
    `;

    // Add price
    const price = document.createElement('p');
    price.style.cssText = `
      font-size: 1.3em;
      font-weight: bold;
      color: #4CAF50;
      margin: 10px 0;
    `;
    price.textContent = `Price: ${productData.price}`;
    details.appendChild(price);

    // Add description
    if (productData.description) {
      const description = document.createElement('p');
      description.style.cssText = `
        margin: 15px 0;
        line-height: 1.5;
        color: #666;
      `;
      description.textContent = productData.description.en || productData.description;
      details.appendChild(description);
    }

    content.appendChild(details);

    // Add attributes section
    const attributes = createAttributesSection(productData.attributes);
    content.appendChild(attributes);

    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    `;

    // Add to Cart button
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = 'Add to Cart';
    addToCartBtn.style.cssText = `
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    `;
    addToCartBtn.addEventListener('mouseover', () => {
      addToCartBtn.style.backgroundColor = '#45a049';
    });
    addToCartBtn.addEventListener('mouseout', () => {
      addToCartBtn.style.backgroundColor = '#4CAF50';
    });
    addToCartBtn.addEventListener('click', () => {
      console.log('Add to Cart clicked');
      addToCart(productData.id);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    `;
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.backgroundColor = '#da190b';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.backgroundColor = '#f44336';
    });
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    buttonsContainer.appendChild(addToCartBtn);
    buttonsContainer.appendChild(closeBtn);
    content.appendChild(buttonsContainer);

    modal.appendChild(content);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
    console.log('Quick View modal added to DOM');
  }

  async function openQuickView(productId) {
    console.log('Opening Quick View for product ID:', productId);
    try {
      const productData = await fetchProductData(productId);
      displayQuickViewModal(productData);
    } catch (error) {
      console.error('Failed to open quick view:', error);
    }
  }

  function addToCart(productId) {
    console.log('Adding product to cart:', productId);
    // TODO: Implement actual add to cart functionality
  }

  function addQuickViewButtons() {
    console.log('Adding Quick View buttons');
    const productCards = document.querySelectorAll('.product-item.position-relative');
    console.log('Found product cards:', productCards.length);
    
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) {
        console.log('Quick View button already exists for a product, skipping');
        return;
      }

      const addToCartBtn = card.querySelector('.product-card-add-to-cart');
      if (addToCartBtn) {
        const onClickAttr = addToCartBtn.getAttribute('onClick');
        const match = onClickAttr.match(/'([^']+)'/);
        if (match) {
          const productId = match[1];

          const button = document.createElement('button');
          button.className = 'quick-view-btn';
          button.textContent = 'Quick View';
          button.style.cssText = `
            padding: 8px 16px;
            margin: 0 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #ffffff;
            cursor: pointer;
            transition: background-color 0.3s ease;
          `;

          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#f0f0f0';
          });

          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#ffffff';
          });

          button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Quick View button clicked for product ID:', productId);
            openQuickView(productId);
          });

          if (config.quickViewStyle === 'left') {
            addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
          } else {
            addToCartBtn.parentNode.insertBefore(button, addToCartBtn.nextSibling);
          }
        }
      }
    });
  }

  // Initial setup
  console.log('Running initial setup');
  addQuickViewButtons();

  // Re-apply Quick View buttons when the page content changes
  const observer = new MutationObserver(() => {
    console.log('Page content changed, re-applying Quick View buttons');
    addQuickViewButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('MutationObserver set up');

  // Expose necessary functions
  window.HMStudioQuickView = {
    openQuickView: openQuickView
  };
  console.log('HMStudioQuickView object exposed to window');
})();
