// Animated Logo Script for Quarto Navbar
document.addEventListener('DOMContentLoaded', function() {
  // Find the navbar title element
  const navbarTitle = document.querySelector('.navbar-title');
  
  if (navbarTitle) {
    // Add our custom class
    navbarTitle.classList.add('animated-logo-container');
    
    // Create the SVG element
    const svgHTML = `
      <svg class="animated-logo" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
        <g class="logo-circle">
          <circle cx="50" cy="50" r="35" fill="none" stroke="#1976d2" stroke-width="10"/>
        </g>
        <g class="logo-m">
          <text x="27" y="67" font-size="50" font-weight="600" fill="#1976d2">M</text>
        </g>
        <g class="text-olaf">
          <text x="27" y="70" font-size="44" font-weight="600" fill="#1976d2">laf</text>
        </g>
        <g class="text-eneses">
          <text x="27" y="70" font-size="44" font-weight="600" fill="#1976d2">eneses</text>
        </g>
      </svg>
    `;
    
    // Replace the content
    navbarTitle.innerHTML = svgHTML;
  }
});
