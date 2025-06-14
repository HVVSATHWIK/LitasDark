/**
 * ModernUI Controller - Enhanced UI functionality
 */

export class ModernUIController {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupModernFeatures();
    this.setupAnimations();
    this.setupResponsiveDesign();
    
    this.isInitialized = true;
    console.log('ModernUI Controller initialized');
  }

  setupModernFeatures() {
    // Enhanced button interactions
    this.setupButtonEffects();
    
    // Modern form enhancements
    this.setupFormEnhancements();
    
    // Advanced tooltips
    this.setupTooltips();
  }

  setupButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      // Add ripple effect
      button.addEventListener('click', (e) => {
        this.createRippleEffect(e, button);
      });
      
      // Enhanced hover states
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '';
      });
    });
  }

  createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  setupFormEnhancements() {
    // Enhanced file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
      this.enhanceFileInput(input);
    });
    
    // Enhanced range inputs
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    
    rangeInputs.forEach(input => {
      this.enhanceRangeInput(input);
    });
  }

  enhanceFileInput(input) {
    // Add drag and drop visual feedback
    const parent = input.closest('.form-group') || input.parentElement;
    
    if (parent) {
      parent.addEventListener('dragover', (e) => {
        e.preventDefault();
        parent.classList.add('drag-over');
      });
      
      parent.addEventListener('dragleave', () => {
        parent.classList.remove('drag-over');
      });
      
      parent.addEventListener('drop', (e) => {
        e.preventDefault();
        parent.classList.remove('drag-over');
      });
    }
  }

  enhanceRangeInput(input) {
    // Add visual enhancements to range inputs
    input.addEventListener('input', () => {
      const value = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.background = `linear-gradient(to right, #6200ea 0%, #6200ea ${value}%, #ddd ${value}%, #ddd 100%)`;
    });
    
    // Trigger initial styling
    input.dispatchEvent(new Event('input'));
  }

  setupTooltips() {
    // Add tooltips to elements with title attributes
    const elementsWithTitles = document.querySelectorAll('[title]');
    
    elementsWithTitles.forEach(element => {
      this.addTooltip(element);
    });
  }

  addTooltip(element) {
    const title = element.getAttribute('title');
    if (!title) return;
    
    // Remove default title to prevent browser tooltip
    element.removeAttribute('title');
    element.setAttribute('data-tooltip', title);
    
    let tooltip = null;
    
    element.addEventListener('mouseenter', () => {
      tooltip = document.createElement('div');
      tooltip.className = 'modern-tooltip';
      tooltip.textContent = title;
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      `;
      
      document.body.appendChild(tooltip);
      
      // Position tooltip
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
      
      // Fade in
      setTimeout(() => {
        if (tooltip) tooltip.style.opacity = '1';
      }, 10);
    });
    
    element.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
          tooltip = null;
        }, 200);
      }
    });
  }

  setupAnimations() {
    // Add CSS animations dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .fade-in-up {
        animation: fadeInUp 0.5s ease-out;
      }
      
      .drag-over {
        border-color: #6200ea !important;
        background-color: rgba(98, 0, 234, 0.05) !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Apply animations to cards
    this.animateCards();
  }

  animateCards() {
    const cards = document.querySelectorAll('.card');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
        }
      });
    }, {
      threshold: 0.1
    });
    
    cards.forEach(card => {
      observer.observe(card);
    });
  }

  setupResponsiveDesign() {
    // Enhanced mobile interactions
    this.setupMobileOptimizations();
    
    // Responsive navigation
    this.setupResponsiveNavigation();
  }

  setupMobileOptimizations() {
    // Touch-friendly interactions
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
      
      // Enhanced touch feedback
      const touchElements = document.querySelectorAll('.btn, .tab-button, .thumbnail');
      
      touchElements.forEach(element => {
        element.addEventListener('touchstart', () => {
          element.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', () => {
          setTimeout(() => {
            element.style.transform = '';
          }, 150);
        });
      });
    }
  }

  setupResponsiveNavigation() {
    // Handle responsive tab navigation
    const tabContainer = document.querySelector('[role="tablist"]');
    
    if (tabContainer) {
      // Add scroll indicators for mobile
      this.addScrollIndicators(tabContainer);
    }
  }

  addScrollIndicators(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tab-scroll-wrapper';
    wrapper.style.cssText = `
      position: relative;
      overflow: hidden;
    `;
    
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    
    // Add scroll indicators
    const leftIndicator = this.createScrollIndicator('left');
    const rightIndicator = this.createScrollIndicator('right');
    
    wrapper.appendChild(leftIndicator);
    wrapper.appendChild(rightIndicator);
    
    // Update indicators on scroll
    container.addEventListener('scroll', () => {
      this.updateScrollIndicators(container, leftIndicator, rightIndicator);
    });
    
    // Initial update
    this.updateScrollIndicators(container, leftIndicator, rightIndicator);
  }

  createScrollIndicator(direction) {
    const indicator = document.createElement('div');
    indicator.className = `scroll-indicator scroll-indicator-${direction}`;
    indicator.style.cssText = `
      position: absolute;
      top: 0;
      ${direction}: 0;
      width: 20px;
      height: 100%;
      background: linear-gradient(to ${direction === 'left' ? 'right' : 'left'}, rgba(255,255,255,0.8), transparent);
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    
    return indicator;
  }

  updateScrollIndicators(container, leftIndicator, rightIndicator) {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    leftIndicator.style.opacity = scrollLeft > 0 ? '1' : '0';
    rightIndicator.style.opacity = scrollLeft < scrollWidth - clientWidth ? '1' : '0';
  }

  enhanceAccessibility() {
    // Add ARIA labels and roles where missing
    this.addMissingAriaLabels();
    
    // Enhance keyboard navigation
    this.enhanceKeyboardNavigation();
    
    // Add focus indicators
    this.addFocusIndicators();
  }

  addMissingAriaLabels() {
    // Add labels to unlabeled interactive elements
    const interactiveElements = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    
    interactiveElements.forEach(element => {
      const text = element.textContent.trim();
      if (text) {
        element.setAttribute('aria-label', text);
      }
    });
  }

  enhanceKeyboardNavigation() {
    // Improve tab order and keyboard interactions
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
            e.preventDefault();
            element.click();
          }
        }
      });
    });
  }

  addFocusIndicators() {
    // Add visible focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .btn:focus,
      .form-input:focus,
      .tab-button:focus {
        outline: 2px solid #6200ea;
        outline-offset: 2px;
      }
      
      .btn:focus:not(:focus-visible) {
        outline: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Utility methods
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      border-radius: 4px;
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  updateProgress(percentage, message) {
    // Enhanced progress indication
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage);
      
      if (message) {
        progressBar.setAttribute('aria-valuetext', message);
      }
    }
  }
}

// Export for use in other modules
export default ModernUIController;