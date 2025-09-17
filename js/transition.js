// Handle smooth page transitions
let isTransitioning = false;
let touchStartY = 0;
let lastWheelTime = 0;
const WHEEL_TIMEOUT = 1500; // Time between wheel events

// Define the page sequence for navigation
const pageSequence = [
  'main.html',
  'courses.html',
  'keyfeatures.html',
  'ourteam.html'  // Add your third page here
];

// Helper function to get current page index in sequence
function getCurrentPageIndex() {
  const currentPath = window.location.pathname;
  return pageSequence.findIndex(page => currentPath.includes(page));
}

// Helper function to get next/previous page based on direction
function getTargetPage(direction) {
  const currentIndex = getCurrentPageIndex();
  
  if (direction === 'down') {
    // Move forward in sequence if not at the end
    return currentIndex < pageSequence.length - 1 ? pageSequence[currentIndex + 1] : null;
  } else {
    // Move backward in sequence if not at the beginning
    return currentIndex > 0 ? pageSequence[currentIndex - 1] : null;
  }
}

function createPageContainer() {
  if (!document.querySelector('.page-container')) {
    const container = document.createElement('div');
    container.className = 'page-container';
    
    // Move body content to container
    while (document.body.firstChild) {
      container.appendChild(document.body.firstChild);
    }
    
    document.body.appendChild(container);
  }
}

function wrapPageContent() {
  if (!document.querySelector('.page-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';
    
    const container = document.querySelector('.page-container');
    while (container.firstChild) {
      wrapper.appendChild(container.firstChild);
    }
    
    container.appendChild(wrapper);
  }
}

async function preloadPage(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc;
  } catch (error) {
    console.error('Error preloading page:', error);
    return null;
  }
}

async function triggerTransition(targetPage, direction) {
  // Prevent transition if no target page or already transitioning
  if (!targetPage || isTransitioning) return;
  isTransitioning = true;
  
  // Preload the target page
  const preloadedPage = await preloadPage(targetPage);
  if (!preloadedPage) {
    isTransitioning = false;
    return;
  }
  
  const currentWrapper = document.querySelector('.page-wrapper');
  const container = document.querySelector('.page-container');
  
  // Create preload container
  const preloadContainer = document.createElement('div');
  preloadContainer.className = 'preload-container';
  
  // Create new wrapper for target page
  const newWrapper = document.createElement('div');
  newWrapper.className = 'page-wrapper';
  newWrapper.style.transform = direction === 'up' ? 'translateX(-100%)' : 'translateX(100%)';
  
  // Copy content from preloaded page
  const content = preloadedPage.querySelector('body').children;
  newWrapper.append(...content);
  
  // Add to DOM
  preloadContainer.appendChild(newWrapper);
  container.appendChild(preloadContainer);
  
  // Force reflow
  void preloadContainer.offsetWidth;
  
  // Start transition
  document.body.classList.add('transitioning');
  preloadContainer.style.visibility = 'visible';
  preloadContainer.style.left = '0';
  
  currentWrapper.classList.add(direction === 'up' ? 'slide-out-right' : 'slide-out-left');
  newWrapper.style.transform = 'translateX(0)';
  
  // After transition completes
  setTimeout(() => {
    window.location.href = targetPage;
  }, );
}

function handleWheel(event) {
  const currentTime = Date.now();
  if (currentTime - lastWheelTime < WHEEL_TIMEOUT) return;
  lastWheelTime = currentTime;

  // Determine direction and get target page
  const direction = event.deltaY > 0 ? 'down' : 'up';
  const targetPage = getTargetPage(direction);
  
  // Trigger transition if target page exists
  if (targetPage) {
    triggerTransition(targetPage, direction);
  }
}

function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  if (!touchStartY) return;
  
  const touchEndY = event.touches[0].clientY;
  const deltaY = touchStartY - touchEndY;
  
  // Threshold for swipe detection
  if (Math.abs(deltaY) > 80) {
    const direction = deltaY > 0 ? 'down' : 'up';
    const targetPage = getTargetPage(direction);
    
    // Trigger transition if target page exists
    if (targetPage) {
      triggerTransition(targetPage, direction);
    }
  }
  
  touchStartY = null;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  createPageContainer();
  wrapPageContent();
  
  // Add event listeners
  window.addEventListener('wheel', handleWheel, { passive: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  
  // Remove transitioning class
  document.body.classList.remove('transitioning');
});