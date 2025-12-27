// Configuración de Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJpv1h9XBYo7gJPLBx4U_1IiRkf0v-y2W2Z_o-O3V67aPSqAzvBdAomO7SPy-dVSYw3cyUwD3C0oVJ/pub?output=csv';

// Variables globales
let courses = [];
let categories = [
    { id: "todos", name: "Todos", displayName: "Todos" }
];
let currentCategory = "todos";
let searchQuery = "";
let customLogoUrl = localStorage.getItem('customLogoUrl') || "";

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const coursesGrid = document.getElementById('courses-grid');
const filterButtons = document.getElementById('filter-buttons');
const searchInput = document.getElementById('search-input');
const totalCoursesElement = document.getElementById('total-courses');
const adminAccessBtn = document.getElementById('admin-access-btn');
const adminOverlay = document.getElementById('admin-overlay');
const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const cancelLoginBtn = document.getElementById('cancel-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const showCredsBtn = document.getElementById('show-creds-btn');
const loginHint = document.getElementById('login-hint');
const courseModal = document.getElementById('course-modal');
const modalClose = document.getElementById('modal-close');
const closeModalBtn = document.getElementById('close-modal-btn');
const enrollBtn = document.getElementById('enroll-btn');
const modalCourseTitle = document.getElementById('modal-course-title');
const modalCourseContent = document.getElementById('modal-course-content');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const adminCoursesList = document.getElementById('admin-courses-list');
const addCourseForm = document.getElementById('add-course-form');
const newCourseCategory = document.getElementById('new-course-category');
const categoriesList = document.getElementById('categories-list');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const logoUrlInput = document.getElementById('logo-url');
const logoPreviewImg = document.getElementById('logo-preview-img');
const defaultLogoText = document.getElementById('default-logo-text');
const saveLogoBtn = document.getElementById('save-logo-btn');
const resetLogoBtn = document.getElementById('reset-logo-btn');
const heroLogoImg = document.getElementById('hero-logo-img');
const loadingCourses = document.getElementById('loading-courses');
const errorCourses = document.getElementById('error-courses');
const errorMessage = document.getElementById('error-message');
const retryLoadBtn = document.getElementById('retry-load-btn');
const formStatus = document.getElementById('form-status');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    initAdmin();
    initModal();
    updateLogoPreview();
    updateHeroLogo();
    
    // Cargar datos iniciales desde Google Sheets
    loadCoursesFromGoogleSheets();
    
    // Setup retry button
    if (retryLoadBtn) {
        retryLoadBtn.addEventListener('click', loadCoursesFromGoogleSheets);
    }
});

// Navigation
function initNavigation() {
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Set active nav link based on scroll position
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Courses and Filters
function initFilters() {
    // Create filter buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCourses();
        });
        filterButtons.appendChild(button);
    });
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCourses();
    });
}

// Funciones para Google Sheets
async function loadCoursesFromGoogleSheets() {
    try {
        // Mostrar estado de carga
        showLoading(true);
        hideError();
        
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCourses`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            courses = data.courses;
            
            // Extraer categorías únicas de los cursos
            updateCategoriesFromCourses();
            
            // Actualizar filtros
            updateFilterButtons();
            
            // Renderizar cursos
            renderCourses();
            
            // Actualizar contador
            totalCoursesElement.textContent = courses.filter(course => course.active).length;
            
            // Si estamos en el panel admin, actualizar la lista
            if (adminPanel.style.display === 'block') {
                renderAdminCourses();
            }
        } else {
            throw new Error(data.message || 'Error al cargar los cursos');
        }
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showError(`No se pudieron cargar los cursos: ${error.message}. Asegúrate de que el Google Apps Script esté configurado correctamente.`);
    } finally {
        showLoading(false);
    }
}

function updateCategoriesFromCourses() {
    // Obtener categorías únicas de los cursos
    const uniqueCategories = [...new Set(courses.map(course => course.category))];
    
    // Agregar nuevas categorías a la lista
    uniqueCategories.forEach(catName => {
        if (!categories.find(cat => cat.id === catName.toLowerCase())) {
            const displayName = catName.charAt(0).toUpperCase() + catName.slice(1);
            categories.push({
                id: catName.toLowerCase(),
                name: catName,
                displayName: displayName
            });
        }
    });
    
    // Ordenar categorías alfabéticamente (excepto "todos")
    categories.sort((a, b) => {
        if (a.id === 'todos') return -1;
        if (b.id === 'todos') return 1;
        return a.displayName.localeCompare(b.displayName);
    });
}

function updateFilterButtons() {
    // Limpiar botones existentes
    filterButtons.innerHTML = '';
    
    // Crear nuevos botones
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${category.id === currentCategory ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCourses();
        });
        filterButtons.appendChild(button);
    });
}

function renderCourses() {
    coursesGrid.innerHTML = '';
    
    // Filter courses based on category and search
    let filteredCourses = courses.filter(course => course.active === 'TRUE' || course.active === true);
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => 
            course.category.toLowerCase() === currentCategory
        );
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(course => 
            course.title.toLowerCase().includes(searchQuery) ||
            course.description.toLowerCase().includes(searchQuery) ||
            course.platform.toLowerCase().includes(searchQuery)
        );
    }
    
    // Render course cards
    filteredCourses.forEach(course => {
        const category = categories.find(cat => cat.id === course.category.toLowerCase()) || 
                        { displayName: course.category };
        const courseCard = createCourseCard(course, category);
        coursesGrid.appendChild(courseCard);
    });
    
    // If no courses found
    if (filteredCourses.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--primary-gold); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se encontraron cursos</h3>
                <p style="color: var(--text-secondary);">Intenta con otra categoría o término de búsqueda</p>
            </div>
        `;
        coursesGrid.appendChild(noResults);
    }
}

function createCourseCard(course, category) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    courseCard.innerHTML = `
        <div class="course-image">
            <i class="fas fa-laptop-code"></i>
        </div>
        <div class="course-content">
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
                ${course.certificate === 'TRUE' || course.certificate === true ? 
                    '<div class="certificate-badge"><i class="fas fa-certificate"></i> Certificado</div>' : 
                    ''
                }
            </div>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <span class="course-category">${category.displayName}</span>
                <span class="course-platform">${course.platform}</span>
            </div>
            <div class="course-actions">
                <button class="btn btn-small btn-primary view-course-btn" data-id="${course.id}">
                    Ver Detalles
                </button>
                <a href="${course.link}" target="_blank" class="btn btn-small btn-secondary">
                    Ir al Curso
                </a>
            </div>
        </div>
    `;
    
    // Add event listener for view course button
    courseCard.querySelector('.view-course-btn').addEventListener('click', () => {
        openCourseModal(course);
    });
    
    return courseCard;
}

// Estados de UI
function showLoading(show) {
    if (loadingCourses) {
        loadingCourses.style.display = show ? 'block' : 'none';
    }
    if (coursesGrid) {
        coursesGrid.style.display = show ? 'none' : 'grid';
    }
}

function showError(message) {
    if (errorCourses && errorMessage) {
        errorMessage.textContent = message;
        errorCourses.style.display = 'block';
        coursesGrid.style.display = 'none';
    }
}

function hideError() {
    if (errorCourses) {
        errorCourses.style.display = 'none';
        coursesGrid.style.display = 'grid';
    }
}

// Modal Functions
function initModal() {
    // Close modal buttons
    modalClose.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    enrollBtn.addEventListener('click', () => {
        alert('¡Inscripción exitosa! Serás redirigido al curso.');
        closeModal();
    });
    
    // Close modal when clicking outside
    courseModal.addEventListener('click', (e) => {
        if (e.target === courseModal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && courseModal.style.display === 'flex') {
            closeModal();
        }
    });
}

function openCourseModal(course) {
    const category = categories.find(cat => cat.id === course.category.toLowerCase()) || 
                    { displayName: course.category };
    
    modalCourseTitle.textContent = course.title;
    modalCourseContent.innerHTML = `
        <div class="course-details">
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Plataforma:</strong> ${course.platform}
                </div>
                <div class="detail-item">
                    <strong>Categoría:</strong> ${category.displayName}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Certificado:</strong> ${(course.certificate === 'TRUE' || course.certificate === true) ? 'Sí incluido' : 'No incluido'}
                </div>
                <div class="detail-item">
                    <strong>Acceso:</strong> 24/7 desde cualquier dispositivo
                </div>
            </div>
            
            <div class="course-embed">
                <div class="text-content">
                    <h4>Descripción Completa</h4>
                    <p>${course.description}</p>
                    <p>Este curso incluye contenido actualizado, ejercicios prácticos, proyectos reales y soporte continuo para garantizar tu aprendizaje efectivo.</p>
                    ${(course.certificate === 'TRUE' || course.certificate === true) ? 
                        '<p><i class="fas fa-certificate"></i> Al completar el curso recibirás un certificado digital verificable que podrás añadir a tu currículum y perfil profesional.</p>' : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    courseModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    courseModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Admin Functions
function initAdmin() {
    // Admin access button
    adminAccessBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAdminPanel();
    });
    
    // Login form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        // Simple authentication (for demo purposes only)
        if (username === 'admin' && password === 'admin123') {
            loginSuccess();
        } else {
            alert('Credenciales incorrectas. Intenta nuevamente.');
        }
    });
    
    // Cancel login
    cancelLoginBtn.addEventListener('click', () => {
        closeAdminPanel();
    });
    
    // Show credentials button
    showCredsBtn.addEventListener('click', () => {
        loginHint.classList.toggle('active');
        showCredsBtn.textContent = loginHint.classList.contains('active') ? 
            'Ocultar Credenciales' : 'Mostrar Credenciales';
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        adminLogin.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
        loginHint.classList.remove('active');
        showCredsBtn.textContent = 'Mostrar Credenciales';
    });
    
    // Admin tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Load data for specific tabs
            if (tabId === 'courses-tab') {
                renderAdminCourses();
            }
        });
    });
    
    // Populate category select for new course
    populateCategorySelect();
    
    // Add course form
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewCourseToGoogleSheets();
    });
    
    // Branding
    logoUrlInput.addEventListener('input', updateLogoPreview);
    saveLogoBtn.addEventListener('click', saveLogo);
    resetLogoBtn.addEventListener('click', resetLogo);
}

function openAdminPanel() {
    adminOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    adminOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function loginSuccess() {
    adminLogin.style.display = 'none';
    adminPanel.style.display = 'block';
    renderAdminCourses();
    populateCategorySelect();
}

function renderAdminCourses() {
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const category = categories.find(cat => cat.id === course.category.toLowerCase()) || 
                        { displayName: course.category };
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${course.title}</div>
                <div class="admin-course-actions">
                    <button class="action-btn view" data-id="${course.id}">
                        Ver
                    </button>
                    <button class="action-btn delete" data-id="${course.id}">Eliminar</button>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> <span class="category-display">${category.displayName}</span></div>
                <div><strong>Plataforma:</strong> ${course.platform}</div>
                <div><strong>Certificado:</strong> ${(course.certificate === 'TRUE' || course.certificate === true) ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${(course.active
