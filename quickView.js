// src/scripts/quickView.js v2.1.7

(function() {
  console.log('Quick View script initialized');

  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript;
    const scriptUrl = new URL(scriptTag.src);
    const storeId = scriptUrl.searchParams.get('storeId');
    return storeId ? storeId.split('?')[0] : null;
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || 'ar'; // Default to Arabic if not found
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

  // Add Analytics object
  const QuickViewStats = {
    async trackEvent(eventType, data) {
      try {
        console.log('Starting Quick View stats tracking for event:', eventType);
        
        const timestamp = new Date();
        const month = timestamp.toISOString().slice(0, 7);
  
        const eventData = {
          storeId,
          eventType,
          timestamp: timestamp.toISOString(),
          month,
          ...data
        };
  
        console.log('Sending Quick View stats data:', eventData);
  
        const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/trackQuickViewStats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });
  
        const responseData = await response.json();
        console.log('Quick View stats response:', responseData);
  
        if (!response.ok) {
          throw new Error(`Quick View stats tracking failed: ${responseData.error || response.statusText}`);
        }
  
      } catch (error) {
        console.error('Quick View stats tracking error:', error);
      }
    }
  };

  async function fetchProductData(productId) {
    console.log('Fetching product data for ID:', productId);
    const url = `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getProductData?storeId=${storeId}&productId=${productId}`;
    
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
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
  
    // Main image display
    const mainImageContainer = document.createElement('div');
    mainImageContainer.style.cssText = `
      width: 100%;
      height: 400px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      background: #f8f8f8;
      @media (max-width: 768px) {
        height: 300px;
      }
    `;
  
    const mainImage = document.createElement('img');
    if (images && images.length > 0) {
      mainImage.src = images[0].url;
      mainImage.alt = images[0].alt_text || 'Product Image';
    } else {
      mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image+Available';
      mainImage.alt = 'No Image Available';
    }
    mainImage.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    `;
    mainImageContainer.appendChild(mainImage);
  
    // Create thumbnails only if there are multiple images
    if (images && images.length > 1) {
      const thumbnailsContainer = document.createElement('div');
      thumbnailsContainer.style.cssText = `
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 4px;
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
          display: none;
        }
        justify-content: center;
        flex-wrap: wrap;
      `;
  
      images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.style.cssText = `
          flex: 0 0 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid ${index === 0 ? '#4CAF50' : 'transparent'};
          transition: all 0.3s ease;
          background: #f8f8f8;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          @media (max-width: 768px) {
            flex: 0 0 70px;
            height: 70px;
          }
        `;
  
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = image.thumbnail;
        thumbnailImg.alt = image.alt_text || `Product Image ${index + 1}`;
        thumbnailImg.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        `;
  
        thumbnail.appendChild(thumbnailImg);
        thumbnail.addEventListener('click', () => {
          mainImage.src = image.url;
          thumbnailsContainer.querySelectorAll('div').forEach(thumb => {
            thumb.style.border = '2px solid transparent';
          });
          thumbnail.style.border = '2px solid #4CAF50';
        });
  
        thumbnailsContainer.appendChild(thumbnail);
      });
  
      galleryContainer.appendChild(thumbnailsContainer);
    }
  
    galleryContainer.insertBefore(mainImageContainer, galleryContainer.firstChild);
    return galleryContainer;
  }

  function createVariantsSection(productData) {
    const currentLang = getCurrentLanguage();
    const variantsContainer = document.createElement('div');
    variantsContainer.className = 'quick-view-variants';
    variantsContainer.style.cssText = `
      margin-top: 15px;
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
  
    if (productData.variants && productData.variants.length > 0) {
      // Get unique variants and their values
      const variantAttributes = new Map();
      
      productData.variants.forEach(variant => {
        if (variant.attributes && variant.attributes.length > 0) {
          variant.attributes.forEach(attr => {
            if (!variantAttributes.has(attr.name)) {
              variantAttributes.set(attr.name, {
                name: attr.name,
                slug: attr.slug,
                values: new Set()
              });
            }
            variantAttributes.get(attr.name).values.add(attr.value[currentLang]);
          });
        }
      });
  
      // Create variant selectors
      variantAttributes.forEach(attr => {
        const variantGroup = document.createElement('div');
        variantGroup.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 8px;
        `;
  
        const label = document.createElement('label');
        label.textContent = currentLang === 'ar' ? attr.slug : attr.name;
        label.style.cssText = `
          font-weight: 600;
          color: #333;
          font-size: 14px;
          ${currentLang === 'ar' ? 'text-align: right;' : 'text-align: left;'}
        `;
  
        const select = document.createElement('select');
        select.className = 'variant-select';
        select.style.cssText = `
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: white;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          &:hover {
            border-color: #4CAF50;
          }
          &:focus {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
          }
        `;
  
        const placeholderText = currentLang === 'ar' ? `اختر ${attr.slug}` : `Select ${attr.name}`;
        
        let optionsHTML = `<option value="">${placeholderText}</option>`;
        
        Array.from(attr.values).forEach(value => {
          optionsHTML += `<option value="${value}">${value}</option>`;
        });
        
        select.innerHTML = optionsHTML;
  
        select.addEventListener('change', () => {
          console.log('Selected:', attr.name, select.value);
          updateSelectedVariant(productData);
        });
  
        variantGroup.appendChild(label);
        variantGroup.appendChild(select);
        variantsContainer.appendChild(variantGroup);
      });
    }
  
    return variantsContainer;
  }

  function createQuantitySelector(currentLang) {
    const quantityContainer = document.createElement('div');
    quantityContainer.style.cssText = `
      margin: 15px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
  
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = currentLang === 'ar' ? 'الكمية:' : 'Quantity:';
    quantityLabel.style.cssText = `
      font-weight: 600;
      color: #333;
      font-size: 14px;
      ${currentLang === 'ar' ? 'text-align: right;' : 'text-align: left;'}
    `;
  
    const quantityWrapper = document.createElement('div');
    quantityWrapper.style.cssText = `
      display: flex;
      align-items: center;
      max-width: 140px;
      ${currentLang === 'ar' ? 'margin-right: 0;' : 'margin-left: 0;'}
    `;
  
    const buttonStyles = `
      width: 40px;
      height: 40px;
      border: 1px solid #e2e8f0;
      background: white;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      transition: all 0.3s ease;
      &:hover {
        background: #f8f9fa;
        color: #4CAF50;
      }
      &:active {
        background: #e9ecef;
      }
    `;
  
    // Decrease button
    const decreaseBtn = document.createElement('button');
    decreaseBtn.type = 'button';
    decreaseBtn.textContent = '-';
    decreaseBtn.style.cssText = `
      ${buttonStyles}
      border-radius: ${currentLang === 'ar' ? '0 8px 8px 0' : '8px 0 0 8px'};
    `;
  
    // Quantity input
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.name = 'quantity';
    quantityInput.id = 'product-quantity';
    quantityInput.min = '1';
    quantityInput.value = '1';
    quantityInput.style.cssText = `
      width: 60px;
      height: 40px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      border-left: 0;
      border-right: 0;
      text-align: center;
      font-size: 14px;
      color: #333;
      -moz-appearance: textfield;
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      &:focus {
        outline: none;
        border-color: #4CAF50;
      }
    `;
  
    // Increase button
    const increaseBtn = document.createElement('button');
    increaseBtn.type = 'button';
    increaseBtn.textContent = '+';
    increaseBtn.style.cssText = `
      ${buttonStyles}
      border-radius: ${currentLang === 'ar' ? '8px 0 0 8px' : '0 8px 8px 0'};
    `;
  
    // Add event listeners
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
  
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      quantityInput.value = currentValue + 1;
    });
  
    // Validate input
    quantityInput.addEventListener('input', () => {
      let value = parseInt(quantityInput.value);
      if (isNaN(value) || value < 1) {
        quantityInput.value = 1;
      }
    });
  
    quantityInput.addEventListener('blur', () => {
      if (quantityInput.value === '') {
        quantityInput.value = 1;
      }
    });
  
    if (currentLang === 'ar') {
      quantityWrapper.appendChild(increaseBtn);
      quantityWrapper.appendChild(quantityInput);
      quantityWrapper.appendChild(decreaseBtn);
    } else {
      quantityWrapper.appendChild(decreaseBtn);
      quantityWrapper.appendChild(quantityInput);
      quantityWrapper.appendChild(increaseBtn);
    }
    
    quantityContainer.appendChild(quantityLabel);
    quantityContainer.appendChild(quantityWrapper);
  
    return quantityContainer;
  }

  function updateSelectedVariant(productData) {
    const form = document.getElementById('product-form');
    if (!form) {
      console.error('Product form not found');
      return;
    }

    const currentLang = getCurrentLanguage();
    const selectedValues = {};

    // Get all selected values
    form.querySelectorAll('.variant-select').forEach(select => {
      if (select.value) {
        const labelText = select.previousElementSibling.textContent;
        selectedValues[labelText] = select.value;
      }
    });

    console.log('Selected values:', selectedValues);

    // Find matching variant
    const selectedVariant = productData.variants.find(variant => {
      return variant.attributes.every(attr => {
        const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
        return selectedValues[attrLabel] === attr.value[currentLang];
      });
    });

    console.log('Found variant:', selectedVariant);

    if (selectedVariant) {
      // Update product ID input
      let productIdInput = form.querySelector('input[name="product_id"]');
      if (!productIdInput) {
        productIdInput = document.createElement('input');
        productIdInput.type = 'hidden';
        productIdInput.name = 'product_id';
        form.appendChild(productIdInput);
      }
      productIdInput.value = selectedVariant.id;
      console.log('Updated product ID to:', selectedVariant.id);

      // Update price display
      const priceElement = form.querySelector('#product-price');
      const oldPriceElement = form.querySelector('#product-old-price');
      
      if (priceElement) {
        if (selectedVariant.formatted_sale_price) {
          priceElement.textContent = selectedVariant.formatted_sale_price;
          if (oldPriceElement) {
            oldPriceElement.textContent = selectedVariant.formatted_price;
            oldPriceElement.style.display = 'block';
          }
        } else {
          priceElement.textContent = selectedVariant.formatted_price;
          if (oldPriceElement) {
            oldPriceElement.style.display = 'none';
          }
        }
      }

      // Update add to cart button
      const addToCartBtn = form.querySelector('.add-to-cart-btn');
      if (addToCartBtn) {
        if (!selectedVariant.unavailable) {
          addToCartBtn.disabled = false;
          addToCartBtn.classList.remove('disabled');
          addToCartBtn.style.opacity = '1';
        } else {
          addToCartBtn.disabled = true;
          addToCartBtn.classList.add('disabled');
          addToCartBtn.style.opacity = '0.5';
        }
      }
    }
  }

  async function handleAddToCart(productData) {
    const currentLang = getCurrentLanguage();
    const form = document.getElementById('product-form');
    
    // Get the quantity value
    const quantityInput = form.querySelector('#product-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    if (isNaN(quantity) || quantity < 1) {
      const message = currentLang === 'ar' 
        ? 'الرجاء إدخال كمية صحيحة'
        : 'Please enter a valid quantity';
      alert(message);
      return;
    }
  
    // Check if product has variants
    if (productData.variants && productData.variants.length > 0) {
      console.log('Product has variants:', productData.variants);
      
      // Get all variant selections
      const selectedVariants = {};
      const missingSelections = [];
      
      form.querySelectorAll('.variant-select').forEach(select => {
        const labelText = select.previousElementSibling.textContent;
        if (!select.value) {
          missingSelections.push(labelText);
        }
        selectedVariants[labelText] = select.value;
      });
  
      // Check if all variants are selected
      if (missingSelections.length > 0) {
        const message = currentLang === 'ar' 
          ? `الرجاء اختيار ${missingSelections.join(', ')}`
          : `Please select ${missingSelections.join(', ')}`;
        alert(message);
        return;
      }
  
      console.log('Selected variants:', selectedVariants);
  
      // Find the matching variant
      const selectedVariant = productData.variants.find(variant => {
        return variant.attributes.every(attr => {
          const attrLabel = currentLang === 'ar' ? attr.slug : attr.name;
          return selectedVariants[attrLabel] === attr.value[currentLang];
        });
      });
  
      if (!selectedVariant) {
        console.error('No matching variant found');
        console.log('Selected combinations:', selectedVariants);
        const message = currentLang === 'ar' 
          ? 'هذا المنتج غير متوفر بالمواصفات المختارة'
          : 'This product variant is not available';
        alert(message);
        return;
      }
  
      console.log('Found matching variant:', selectedVariant);
      
      // Update product ID to selected variant ID
      const productIdInput = form.querySelector('input[name="product_id"]');
      if (productIdInput) {
        productIdInput.value = selectedVariant.id;
        console.log('Updated product ID to variant ID:', selectedVariant.id);
      }
    }
  
    // Ensure required hidden inputs exist and are populated
    let productIdInput = form.querySelector('input[name="product_id"]');
    if (!productIdInput) {
      productIdInput = document.createElement('input');
      productIdInput.type = 'hidden';
      productIdInput.name = 'product_id';
      form.appendChild(productIdInput);
    }
    
    // Update quantity in form
    let formQuantityInput = form.querySelector('input[name="quantity"]');
    if (!formQuantityInput) {
      formQuantityInput = document.createElement('input');
      formQuantityInput.type = 'hidden';
      formQuantityInput.name = 'quantity';
      form.appendChild(formQuantityInput);
    }
    formQuantityInput.value = quantity;
  
    // Show loading spinner
    const loadingSpinners = document.querySelectorAll('.add-to-cart-progress');
    loadingSpinners.forEach(spinner => spinner.classList.remove('d-none'));
  
    // Get the form data
    const formData = new FormData(form);
    console.log('Form data being submitted:', {
      product_id: formData.get('product_id'),
      quantity: formData.get('quantity')
    });
  
    // Call Zid's cart function
    try {
      zid.store.cart.addProduct({ 
        formId: 'product-form',
        data: {
          product_id: formData.get('product_id'),
          quantity: formData.get('quantity')
        }
      })
      .then(async function (response) {
        console.log('Add to cart response:', response);
        if (response.status === 'success') {
          // Track successful cart addition
          try {
            await QuickViewStats.trackEvent('cart_add', {
              productId: formData.get('product_id'),
              quantity: parseInt(formData.get('quantity')),
              productName: typeof productData.name === 'object' ? 
                productData.name[currentLang] : 
                productData.name
            });
          } catch (trackingError) {
            console.warn('Quick View stats tracking error:', trackingError);
          }
  
          if (typeof setCartBadge === 'function') {
            setCartBadge(response.data.cart.products_count);
          }
          // Close modal immediately without alert
          const modal = document.querySelector('.quick-view-modal');
          if (modal) {
            modal.remove();
          }
        } else {
          console.error('Add to cart failed:', response);
          const errorMessage = currentLang === 'ar' 
            ? response.data.message || 'فشل إضافة المنتج إلى السلة'
            : response.data.message || 'Failed to add product to cart';
          alert(errorMessage);
        }
      })
      .catch(function(error) {
        console.error('Error adding to cart:', error);
        const errorMessage = currentLang === 'ar' 
          ? 'حدث خطأ أثناء إضافة المنتج إلى السلة'
          : 'Error occurred while adding product to cart';
        alert(errorMessage);
      })
      .finally(function() {
        // Hide loading spinner
        loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
      });
    } catch (error) {
      console.error('Critical error in add to cart:', error);
      loadingSpinners.forEach(spinner => spinner.classList.add('d-none'));
    }
  }


  async function displayQuickViewModal(productData) {
    const currentLang = getCurrentLanguage();
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
      padding: 16px;
    `;
  
    const content = document.createElement('div');
    content.className = 'quick-view-content';
    content.style.cssText = `
      background-color: white;
      border-radius: 16px;
      max-width: 1000px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: row;
      @media (max-width: 768px) {
        flex-direction: column;
        max-height: 85vh;
      }
    `;
  
    // Create form (maintaining existing functionality)
    const form = document.createElement('form');
    form.id = 'product-form';
    form.style.cssText = `
      display: flex;
      width: 100%;
      @media (max-width: 768px) {
        flex-direction: column;
      }
    `;
  
    // Left section - Gallery
    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
      flex: 1;
      padding: 24px;
      border-right: 1px solid #eee;
      @media (max-width: 768px) {
        border-right: none;
        border-bottom: 1px solid #eee;
        padding: 16px;
      }
    `;
    leftSection.appendChild(createImageGallery(productData.images));
  
    // Right section - Product Info
    const rightSection = document.createElement('div');
    rightSection.style.cssText = `
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      @media (max-width: 768px) {
        padding: 16px;
      }
    `;
  
    // Product Title
    const title = document.createElement('h2');
    title.textContent = productData.name[currentLang] || productData.name;
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      color: #333;
      font-weight: 600;
      ${currentLang === 'ar' ? 'text-align: right;' : 'text-align: left;'}
    `;
  
    // Price display
    const priceContainer = document.createElement('div');
    priceContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      ${currentLang === 'ar' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;
  
    const currentPrice = document.createElement('span');
    currentPrice.id = 'product-price';
    currentPrice.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      color: #4CAF50;
    `;
  
    const oldPrice = document.createElement('span');
    oldPrice.id = 'product-old-price';
    oldPrice.style.cssText = `
      text-decoration: line-through;
      color: #999;
      font-size: 18px;
      display: none;
    `;
  
    priceContainer.appendChild(currentPrice);
    priceContainer.appendChild(oldPrice);
  
    // Add elements to right section
    rightSection.appendChild(title);
    rightSection.appendChild(priceContainer);
  
    // Add variants if available
    if (productData.variants && productData.variants.length > 0) {
      const variantsSection = createVariantsSection(productData);
      variantsSection.style.marginTop = '20px';
      rightSection.appendChild(variantsSection);
    }
  
    // Add quantity selector
    const quantitySelector = createQuantitySelector(currentLang);
    rightSection.appendChild(quantitySelector);
  
    // Add description
    if (productData.description && productData.description[currentLang]) {
      const description = document.createElement('p');
      description.style.cssText = `
        margin: 20px 0;
        line-height: 1.6;
        color: #666;
        ${currentLang === 'ar' ? 'text-align: right;' : 'text-align: left;'}
      `;
      description.textContent = productData.description[currentLang];
      rightSection.appendChild(description);
    }
  
    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: auto;
      ${currentLang === 'ar' ? 'flex-direction: row-reverse;' : ''}
    `;
  
    // Add to Cart button
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = currentLang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart';
    addToCartBtn.className = 'add-to-cart-btn';
    addToCartBtn.type = 'button';
    addToCartBtn.style.cssText = `
      flex: 1;
      padding: 14px 24px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      &:hover {
        background-color: #45a049;
      }
    `;
  
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = currentLang === 'ar' ? 'إغلاق' : 'Close';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      padding: 14px 24px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      &:hover {
        background-color: #da190b;
      }
    `;
  
    // Event handlers
    addToCartBtn.addEventListener('click', () => handleAddToCart(productData));
    closeBtn.addEventListener('click', () => modal.remove());
  
    buttonsContainer.appendChild(closeBtn);
    buttonsContainer.appendChild(addToCartBtn);
    rightSection.appendChild(buttonsContainer);
  
    // Add sections to form
    form.appendChild(leftSection);
    form.appendChild(rightSection);
  
    // Add form to content
    content.appendChild(form);
    modal.appendChild(content);
  
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  
    document.body.appendChild(modal);
    
    // Initialize price display
    if (productData.selected_product) {
      updateSelectedVariant(productData);
    } else {
      currentPrice.textContent = productData.formatted_price || productData.price;
    }

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

  function addQuickViewButtons() {
    console.log('Adding Quick View buttons');
    const productCards = document.querySelectorAll('.product-item.position-relative');
    console.log('Found product cards:', productCards.length);
    
    productCards.forEach(card => {
      if (card.querySelector('.quick-view-btn')) {
        console.log('Quick View button already exists for a product, skipping');
        return;
      }

      // Get product ID from data-wishlist-id
      const productId = card.querySelector('[data-wishlist-id]')?.getAttribute('data-wishlist-id');
      
      if (productId) {
        console.log('Found product ID:', productId);
        
        // Find the button container - it's the div with text-align: center
        const buttonContainer = card.querySelector('div[style*="text-align: center"]');
if (buttonContainer) {
  // Update the button container styles to ensure horizontal alignment
  buttonContainer.className = 'hmstudio-buttons-container';  // Add this class
buttonContainer.style.cssText = `
    text-align: center;
    display: inline-flex;  
    align-items: center;
    justify-content: center;
    gap: 5px;
`;

  const button = document.createElement('button');
  button.className = 'quick-view-btn';
  button.style.cssText = `
    width: 35px;
    height: 35px;
    padding: 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #ffffff;
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: inline-flex;  /* Changed to inline-flex */
    align-items: center;
    justify-content: center;
    vertical-align: middle;  /* Added this */
  `;

          // Add eye icon using SVG
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
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

          // Insert before the first button in the container
          const firstButton = buttonContainer.querySelector('a, button');
          if (firstButton) {
            buttonContainer.insertBefore(button, firstButton);
          } else {
            buttonContainer.appendChild(button);
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
