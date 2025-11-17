// Enhanced hero page interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Add sparkle effect on section hover
    function createSparkle(e) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        document.body.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
    }
    
    // Add sparkle CSS if not already present
    if (!document.querySelector('#sparkle-styles')) {
        const sparkleStyles = document.createElement('style');
        sparkleStyles.id = 'sparkle-styles';
        sparkleStyles.textContent = `
            .sparkle {
                position: fixed;
                width: 6px;
                height: 6px;
                background: linear-gradient(45deg, #FFD700, #FFA500);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: sparkleAnim 1s ease-out forwards;
            }
            
            @keyframes sparkleAnim {
                0% {
                    opacity: 1;
                    transform: scale(0) rotate(0deg);
                }
                50% {
                    opacity: 1;
                    transform: scale(1) rotate(180deg);
                }
                100% {
                    opacity: 0;
                    transform: scale(0) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(sparkleStyles);
    }
    
    // Add sparkle effect to hero sections
    const heroSections = document.querySelectorAll('.hero-section');
    heroSections.forEach(section => {
        section.addEventListener('mousemove', createSparkle);
    });
    
    // Progressive reveal animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all hero sections
    heroSections.forEach(section => {
        observer.observe(section);
    });
    
    // Add typing sound effect simulation (visual feedback)
    const titles = document.querySelectorAll('.hero-section h1');
    titles.forEach(title => {
        title.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'typewriter 2s steps(40) forwards';
            }, 10);
        });
    });
    
    // Floating emoji animation trigger
    const floatingIcons = document.querySelectorAll('.floating-icon');
    floatingIcons.forEach(icon => {
        setInterval(() => {
            icon.style.animation = 'none';
            setTimeout(() => {
                icon.style.animation = 'float 3s ease-in-out infinite';
            }, 10);
        }, 6000);
    });
    
    // Add subtle parallax effect
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroHeading = document.querySelector('#hero-heading');
        if (heroHeading) {
            heroHeading.style.transform = `translateY(${scrolled * 0.2}px)`;
        }
    });
    
    // Random color shift for section icons on click
    const sectionIcons = document.querySelectorAll('.section-icon');
    const colors = ['🌟', '✨', '💫', '⭐', '🎯', '🚀', '💡', '🎨'];
    
    sectionIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const originalContent = this.textContent;
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.textContent = randomColor;
            
            setTimeout(() => {
                this.textContent = originalContent;
            }, 1500);
        });
    });
    
    // Add greeting time awareness
    const greetingSection = document.querySelector('.greeting-section h1');
    if (greetingSection) {
        const hour = new Date().getHours();
        let greeting = 'Hello!';
        
        if (hour < 12) greeting = 'Good morning!';
        else if (hour < 18) greeting = 'Good afternoon!';
        else greeting = 'Good evening!';
        
        // Update greeting based on time of day
        greetingSection.innerHTML = greetingSection.innerHTML.replace('Hello!', greeting);
    }
});
