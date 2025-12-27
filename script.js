// Datos iniciales
let courses = [
    {
        id: 1,
        title: "React Avanzado: Patrones y Mejores Prácticas",
        description: "Domina React con patrones avanzados, optimización de rendimiento y arquitectura escalable para aplicaciones empresariales.",
        category: "programacion",
        platform: "Udemy",
        link: "https://www.udemy.com/course/react-avanzado",
        certificate: true,
        active: true
    },
    {
        id: 2,
        title: "Machine Learning con Python",
        description: "Curso completo de Machine Learning aplicado usando Python, Scikit-Learn y TensorFlow para proyectos reales.",
        category: "data-science",
        platform: "Coursera",
        link: "https://www.coursera.org/learn/machine-learning",
        certificate: true,
        active: true
    },
    {
        id: 3,
        title: "Diseño UX/UI Profesional",
        description: "Aprende diseño de interfaces y experiencia de usuario desde cero hasta nivel profesional con Figma.",
        category: "diseño",
        platform: "Platzi",
        link: "https://platzi.com/cursos/diseno-ux-ui",
        certificate: true,
        active: true
    },
    {
        id: 4,
        title: "Finanzas Personales y Inversiones",
        description: "Gestiona tus finanzas, crea un plan de inversión y construye patrimonio con estrategias probadas.",
        category: "finanzas",
        platform: "EdX",
        link: "https://www.edx.org/course/finanzas-personales",
        certificate: true,
        active: true
    },
    {
        id: 5,
        title: "Marketing Digital Avanzado",
        description: "Estrategias avanzadas de marketing digital, SEO, publicidad en redes sociales y análisis de datos.",
        category: "marketing",
        platform: "Udemy",
        link: "https://www.udemy.com/course/marketing-digital-avanzado",
        certificate: true,
        active: true
    },
    {
        id: 6,
        title: "Desarrollo Web Full Stack",
        description: "Conviértete en desarrollador Full Stack aprendiendo HTML, CSS, JavaScript, Node.js y bases de datos.",
        category: "programacion",
        platform: "Coursera",
        link: "https://www.coursera.org/learn/full-stack-web-development",
        certificate: true,
        active: true
    }
];

let categories = [
    { id: "todos", name: "Todos", displayName: "Todos" },
    { id: "programacion", name: "Programación", displayName: "Programación" },
    { id: "data-science", name: "Data Science", displayName: "Data Science" },
    { id: "diseño", name: "Diseño", displayName: "Diseño" },
    { id: "finanzas", name: "Finanzas", displayName: "Finanzas" },
    { id: "marketing", name: "Marketing", displayName: "Marketing" }
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFilters();
    renderCourses();
    initAdmin();
    initModal();
    updateLogoPreview();
    updateHeroLogo();
    
    // Update total courses count
    totalCoursesElement.textContent = courses.filter(course => course.active).length;
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

function renderCourses() {
    coursesGrid.innerHTML = '';
    
    // Filter courses based on category and search
    let filteredCourses = courses.filter(course => course.active);
    
    if (currentCategory !== 'todos') {
        filteredCourses = filteredCourses.filter(course => course.category === currentCategory);
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
        const category = categories.find(cat => cat.id === course.category);
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
                ${course.certificate ? 
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
    const category = categories.find(cat => cat.id === course.category);
    
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
                    <strong>Certificado:</strong> ${course.certificate ? 'Sí incluido' : 'No incluido'}
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
                    ${course.certificate ? 
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
            } else if (tabId === 'categories-tab') {
                renderCategoriesList();
            }
        });
    });
    
    // Populate category select for new course
    populateCategorySelect();
    
    // Add course form
    addCourseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewCourse();
    });
    
    // Add category
    addCategoryBtn.addEventListener('click', addNewCategory);
    
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
    renderCategoriesList();
}

function renderAdminCourses() {
    adminCoursesList.innerHTML = '';
    
    courses.forEach(course => {
        const category = categories.find(cat => cat.id === course.category);
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-course-item';
        courseItem.innerHTML = `
            <div class="admin-course-header">
                <div class="admin-course-title">${course.title}</div>
                <div class="admin-course-actions">
                    <button class="action-btn toggle" data-id="${course.id}">
                        ${course.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="action-btn edit" data-id="${course.id}">Editar</button>
                    <button class="action-btn delete" data-id="${course.id}">Eliminar</button>
                </div>
            </div>
            <div class="admin-course-details">
                <div><strong>Categoría:</strong> <span class="category-display">${category.displayName}</span></div>
                <div><strong>Plataforma:</strong> ${course.platform}</div>
                <div><strong>Certificado:</strong> ${course.certificate ? 'Sí' : 'No'}</div>
                <div><strong>Estado:</strong> ${course.active ? 'Activo' : 'Inactivo'}</div>
            </div>
        `;
        adminCoursesList.appendChild(courseItem);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.admin-course-actions .action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = parseInt(this.dataset.id);
            const course = courses.find(c => c.id === courseId);
            
            if (this.classList.contains('toggle')) {
                toggleCourseStatus(courseId);
            } else if (this.classList.contains('edit')) {
                editCourse(course);
            } else if (this.classList.contains('delete')) {
                deleteCourse(courseId);
            }
        });
    });
}

function populateCategorySelect() {
    newCourseCategory.innerHTML = '<option value="">Seleccionar categoría</option>';
    categories.filter(cat => cat.id !== 'todos').forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.displayName;
        newCourseCategory.appendChild(option);
    });
}

function addNewCourse() {
    const title = document.getElementById('new-course-title').value;
    const platform = document.getElementById('new-course-platform').value;
    const category = document.getElementById('new-course-category').value;
    const link = document.getElementById('new-course-link').value;
    const description = document.getElementById('new-course-description').value;
    const certificate = document.getElementById('new-course-certificate').checked;
    
    if (!title || !platform || !category || !link || !description) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    const newCourse = {
        id: courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1,
        title,
        description,
        category,
        platform,
        link,
        certificate,
        active: true
    };
    
    courses.push(newCourse);
    renderCourses();
    renderAdminCourses();
    
    // Reset form
    addCourseForm.reset();
    document.getElementById('new-course-certificate').checked = true;
    
    // Update total courses count
    totalCoursesElement.textContent = courses.filter(course => course.active).length;
    
    // Switch to courses tab
    document.querySelector('[data-tab="courses-tab"]').click();
    
    alert('Curso agregado exitosamente!');
}

function toggleCourseStatus(courseId) {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex !== -1) {
        courses[courseIndex].active = !courses[courseIndex].active;
        renderCourses();
        renderAdminCourses();
        
        // Update total courses count
        totalCoursesElement.textContent = courses.filter(course => course.active).length;
        
        alert(`Curso ${courses[courseIndex].active ? 'activado' : 'desactivado'} exitosamente.`);
    }
}

function editCourse(course) {
    // For simplicity, we'll just pre-fill the add course form
    document.getElementById('new-course-title').value = course.title;
    document.getElementById('new-course-platform').value = course.platform;
    document.getElementById('new-course-category').value = course.category;
    document.getElementById('new-course-link').value = course.link;
    document.getElementById('new-course-description').value = course.description;
    document.getElementById('new-course-certificate').checked = course.certificate;
    
    // Switch to add course tab
    document.querySelector('[data-tab="add-course-tab"]').click();
    
    alert('Los datos del curso se han cargado en el formulario. Modifícalos y haz clic en "Agregar Curso" para actualizar (esto creará un nuevo curso en la demo).');
}

function deleteCourse(courseId) {
    if (confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.')) {
        courses = courses.filter(c => c.id !== courseId);
        renderCourses();
        renderAdminCourses();
        
        // Update total courses count
        totalCoursesElement.textContent = courses.filter(course => course.active).length;
        
        alert('Curso eliminado exitosamente.');
    }
}

function renderCategoriesList() {
    categoriesList.innerHTML = '';
    
    categories.filter(cat => cat.id !== 'todos').forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${category.displayName}
            <div class="category-actions">
                <button class="action-btn edit" data-category="${category.id}">Editar</button>
                <button class="action-btn delete" data-category="${category.id}">Eliminar</button>
            </div>
        `;
        categoriesList.appendChild(li);
    });
    
    // Add event listeners to category buttons
    document.querySelectorAll('.category-actions .action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            
            if (this.classList.contains('edit')) {
                editCategory(categoryId);
            } else if (this.classList.contains('delete')) {
                deleteCategory(categoryId);
            }
        });
    });
}

function addNewCategory() {
    const categoryName = newCategoryInput.value.trim();
    
    if (!categoryName) {
        alert('Por favor ingresa un nombre para la categoría.');
        return;
    }
    
    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
        alert('Esta categoría ya existe.');
        return;
    }
    
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    
    categories.push({
        id: categoryId,
        name: categoryName,
        displayName: displayName
    });
    
    // Update category select in add course form
    populateCategorySelect();
    
    // Clear input
    newCategoryInput.value = '';
    
    // Re-render categories list
    renderCategoriesList();
    
    alert('Categoría agregada exitosamente.');
}

function editCategory(categoryId) {
    const newName = prompt('Ingresa el nuevo nombre para la categoría:');
    
    if (newName && newName.trim()) {
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex !== -1) {
            categories[categoryIndex].name = newName.trim();
            categories[categoryIndex].displayName = newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1);
            
            // Update category select
            populateCategorySelect();
            
            // Re-render categories list
            renderCategoriesList();
            
            alert('Categoría actualizada exitosamente.');
        }
    }
}

function deleteCategory(categoryId) {
    if (categoryId === 'todos') {
        alert('No se puede eliminar la categoría "Todos".');
        return;
    }
    
    // Check if category is being used by any course
    const categoryInUse = courses.some(course => course.category === categoryId);
    
    if (categoryInUse) {
        alert('No se puede eliminar esta categoría porque hay cursos asignados a ella.');
        return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
        categories = categories.filter(cat => cat.id !== categoryId);
        
        // Update category select
        populateCategorySelect();
        
        // Re-render categories list
        renderCategoriesList();
        
        alert('Categoría eliminada exitosamente.');
    }
}

// Branding Functions
function updateLogoPreview() {
    const url = logoUrlInput.value.trim();
    
    if (url) {
        logoPreviewImg.src = url;
        logoPreviewImg.classList.add('active');
        defaultLogoText.style.display = 'none';
        
        // Handle image loading errors
        logoPreviewImg.onerror = function() {
            logoPreviewImg.classList.remove('active');
            defaultLogoText.style.display = 'block';
            defaultLogoText.textContent = 'Error al cargar la imagen';
        };
    } else {
        logoPreviewImg.classList.remove('active');
        defaultLogoText.style.display = 'block';
        defaultLogoText.textContent = 'Logo predeterminado';
    }
}

function saveLogo() {
    const url = logoUrlInput.value.trim();
    
    if (url) {
        // Validate URL
        try {
            new URL(url);
            customLogoUrl = url;
            localStorage.setItem('customLogoUrl', url);
            updateHeroLogo();
            alert('Logo guardado exitosamente. Recarga la página para ver los cambios en todas partes.');
        } catch (e) {
            alert('Por favor ingresa una URL válida.');
        }
    } else {
        alert('Por favor ingresa una URL para el logo.');
    }
}

function resetLogo() {
    customLogoUrl = "";
    localStorage.removeItem('customLogoUrl');
    logoUrlInput.value = "";
    updateLogoPreview();
    updateHeroLogo();
    alert('Logo restablecido al predeterminado.');
}

function updateHeroLogo() {
    if (customLogoUrl) {
        heroLogoImg.src = customLogoUrl;
        heroLogoImg.classList.add('active');
        document.querySelector('.hero-logo-default').style.display = 'none';
        
        // Handle image loading errors
        heroLogoImg.onerror = function() {
            heroLogoImg.classList.remove('active');
            document.querySelector('.hero-logo-default').style.display = 'flex';
        };
    } else {
        heroLogoImg.classList.remove('active');
        document.querySelector('.hero-logo-default').style.display = 'flex';
    }
}

// Close admin panel with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adminOverlay.style.display === 'flex') {
        closeAdminPanel();
    }
});