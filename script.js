// =============== CONFIGURACIÓN GOOGLE SHEETS ===============
const GOOGLE_SHEETS_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ';
const SHEET_NAME = 'recetas';
const GOOGLE_SHEETS_CSV_URL = `https://docs.google.com/spreadsheets/d/1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ/edit?gid=1201005628#gid=1201005628`;

// Variables globales
let recipes = [];
let categories = [
    { id: "todos", name: "Todos", displayName: "Todas las Recetas" },
    { id: "postres", name: "Postres", displayName: "Postres" },
    { id: "comidas-saladas", name: "Comidas Saladas", displayName: "Comidas Saladas" },
    { id: "bebidas", name: "Bebidas", displayName: "Bebidas" },
    { id: "sopas-y-cremas", name: "Sopas y Cremas", displayName: "Sopas y Cremas" },
    { id: "reposteria", name: "Repostería", displayName: "Repostería" }
];
let currentCategory = "todos";
let searchQuery = "";

// =============== INICIALIZACIÓN ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍳 Zona Total Recetas - Iniciando...');
    
    // Inicializar elementos de la interfaz
    initNavigation();
    initSearch();
    initModal();
    initAdmin();
    initCategories();
    
    // Cargar recetas desde Google Sheets
    loadRecipesFromGoogleSheets();
    
    // Configurar botón de reintento
    const retryBtn = document.getElementById('retry-load-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadRecipesFromGoogleSheets();
        });
    }
});

// =============== FUNCIONES DE INICIALIZACIÓN ===============
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                // Actualizar clase activa
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderRecipes();
            updateRecipeCounts();
        });
    }
}

function initModal() {
    const modalClose = document.getElementById('modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const recipeModal = document.getElementById('recipe-modal');
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (recipeModal) {
        recipeModal.addEventListener('click', (e) => {
            if (e.target === recipeModal) closeModal();
        });
    }
}

function initCategories() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            currentCategory = category;
            
            // Actualizar botones de filtro
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
            
            renderRecipes();
            updateRecipeCounts();
            
            // Scroll a recetas
            document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function initAdmin() {
    // Botón Admin
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-overlay').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            loadAdminRecipes();
        });
    }
    
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            // Credenciales de prueba
            if (username === 'chef' && password === 'recetas123') {
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                loadAdminRecipes();
                loadEditRecipeSelect();
            } else {
                alert('Credenciales incorrectas. Usa: chef / recetas123');
            }
        });
    }
    
    // Botón mostrar credenciales
    const showCredsBtn = document.getElementById('show-creds-btn');
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', () => {
            const loginHint = document.getElementById('login-hint');
            if (loginHint) {
                loginHint.classList.toggle('active');
                showCredsBtn.textContent = loginHint.classList.contains('active') ? 
                    'Ocultar Credenciales' : 'Mostrar Credenciales';
            }
        });
    }
    
    // Cancelar login
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', () => {
            document.getElementById('admin-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
            const loginHint = document.getElementById('login-hint');
            if (loginHint) loginHint.classList.remove('active');
            const showCredsBtn = document.getElementById('show-creds-btn');
            if (showCredsBtn) showCredsBtn.textContent = 'Mostrar Credenciales';
        });
    }
    
    // Tabs Admin
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Actualizar botones
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar contenido
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Cargar datos si es necesario
            if (tabId === 'recipes-tab') {
                loadAdminRecipes();
            } else if (tabId === 'edit-recipe-tab') {
                loadEditRecipeSelect();
            }
        });
    });
    
    // Agregar receta (en memoria para demo)
    const addRecipeForm = document.getElementById('add-recipe-form');
    if (addRecipeForm) {
        addRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewRecipe();
        });
    }
    
    // Editar receta (en memoria para demo)
    const editRecipeSelect = document.getElementById('edit-recipe-select');
    if (editRecipeSelect) {
        editRecipeSelect.addEventListener('change', function() {
            const recipeId = parseInt(this.value);
            if (recipeId) {
                loadRecipeForEditing(recipeId);
            } else {
                document.getElementById('edit-recipe-form').style.display = 'none';
            }
        });
    }
    
    // Guardar edición (en memoria para demo)
    const editRecipeForm = document.getElementById('edit-recipe-form');
    if (editRecipeForm) {
        editRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditedRecipe();
        });
    }
    
    // Cancelar edición
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            document.getElementById('edit-recipe-form').style.display = 'none';
            document.getElementById('edit-recipe-select').value = '';
            document.getElementById('edit-form-status').innerHTML = '';
        });
    }
    
    // Eliminar receta (en memoria para demo)
    const deleteRecipeBtn = document.getElementById('delete-recipe-btn');
    if (deleteRecipeBtn) {
        deleteRecipeBtn.addEventListener('click', () => {
            const recipeId = parseInt(document.getElementById('edit-recipe-select').value);
            if (recipeId && confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
                deleteRecipe(recipeId);
            }
        });
    }
}

// =============== FUNCIONES PARA GOOGLE SHEETS ===============
async function loadRecipesFromGoogleSheets() {
    try {
        showLoading(true);
        
        console.log('📥 Intentando cargar recetas desde:', GOOGLE_SHEETS_CSV_URL);
        
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('✅ CSV descargado, tamaño:', csvText.length, 'caracteres');
        
        recipes = parseCSV(csvText);
        
        console.log(`✅ Cargadas ${recipes.length} recetas desde Google Sheets`);
        
        // Actualizar la interfaz
        renderFilters();
        renderRecipes();
        updateRecipeCounts();
        updateTotalRecipes();
        
        showLoading(false);
        return recipes;
    } catch (error) {
        console.error('❌ Error cargando recetas:', error);
        showError(`No se pudieron cargar las recetas: ${error.message}`);
        showLoading(false);
        
        // Mostrar datos de ejemplo si hay error
        loadSampleRecipes();
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const recipes = [];
    
    // Verificar si hay datos
    if (lines.length <= 1) {
        console.log('⚠️ El CSV está vacío o solo tiene encabezados');
        return recipes;
    }
    
    console.log('📊 Total de líneas en CSV:', lines.length);
    
    // Saltar la primera línea (encabezados)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            // Parsear línea CSV (manejar comas dentro de comillas)
            const values = parseCSVLine(line);
            
            console.log(`Línea ${i}:`, values);
            
            // Verificar que tenemos suficientes valores
            if (values.length >= 10) {
                const recipe = {
                    id: parseInt(values[0]) || i,
                    title: values[1]?.trim() || `Receta ${i}`,
                    description: values[2]?.trim() || 'Descripción no disponible',
                    category: values[3]?.trim() || 'Postres',
                    image: values[4]?.trim() || getDefaultImage(values[3]?.trim()),
                    time: values[5]?.trim() || '30 min',
                    portions: parseInt(values[6]) || 4,
                    difficulty: values[7]?.trim() || 'Media',
                    ingredients: values[8]?.trim().replace(/↵/g, '\n') || 'Ingredientes no especificados',
                    instructions: values[9]?.trim().replace(/↵/g, '\n') || 'Instrucciones no disponibles'
                };
                
                // Solo agregar si tiene título
                if (recipe.title && recipe.title !== 'Receta sin título') {
                    recipes.push(recipe);
                    console.log(`✓ Receta agregada: ${recipe.title}`);
                }
            } else {
                console.log(`✗ Línea ${i} ignorada: solo ${values.length} valores`);
            }
        } catch (error) {
            console.error(`Error parseando línea ${i}:`, error);
        }
    }
    
    return recipes;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Saltar la siguiente comilla
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current); // Último valor
    return values;
}

function getDefaultImage(category) {
    const defaultImages = {
        'Postres': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e',
        'Comidas Saladas': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
        'Bebidas': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
        'Sopas y Cremas': 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
        'Repostería': 'https://images.unsplash.com/photo-1555507036-ab794f27d2e9'
    };
    
    return defaultImages[category] || 'https://images.unsplash.com/photo-1565958011703-44f9829ba187';
}

function loadSampleRecipes() {
    recipes = [
        {
            id: 1,
            title: "Tarta de Chocolate Intenso",
            description: "Una tarta de chocolate rica y cremosa con base de galleta",
            category: "Postres",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
            time: "1 hora 30 min",
            portions: 8,
            difficulty: "Media",
            ingredients: "- 200g de galletas de chocolate\n- 100g de mantequilla derretida\n- 300g de chocolate negro\n- 200ml de nata para montar\n- 3 huevos\n- 100g de azúcar\n- 1 cucharadita de esencia de vainilla",
            instructions: "1. Triturar las galletas y mezclar con la mantequilla derretida.\n2. Forrar un molde con esta mezcla y reservar en frío.\n3. Derretir el chocolate al baño maría.\n4. Montar la nata y reservar.\n5. Batir los huevos con el azúcar hasta que blanqueen.\n6. Mezclar el chocolate derretido con los huevos batidos.\n7. Incorporar la nata montada con movimientos envolventes.\n8. Verter sobre la base de galleta y refrigerar 4 horas.\n9. Decorar con virutas de chocolate antes de servir."
        },
        {
            id: 2,
            title: "Pasta Carbonara Auténtica",
            description: "La clásica pasta carbonara italiana con huevo, panceta y queso pecorino.",
            category: "Comidas Saladas",
            image: "https://images.unsplash.com/photo-1612874742237-6526221588e3",
            time: "30 min",
            portions: 4,
            difficulty: "Fácil",
            ingredients: "- 400g de spaghetti\n- 200g de panceta o guanciale\n- 4 yemas de huevo\n- 100g de queso pecorino rallado\n- Pimienta negra recién molida\n- Sal",
            instructions: "1. Cocer la pasta en agua con sal según instrucciones del paquete.\n2. Dorar la panceta en una sartén sin aceite.\n3. Batir las yemas con el queso pecorino y mucha pimienta.\n4. Escurrir la pasta y mezclar inmediatamente con la panceta y su grasa.\n5. Retirar del fuego y agregar la mezcla de huevo revolviendo rápido.\n6. Servir inmediatamente con más queso y pimienta por encima."
        }
    ];
    
    renderFilters();
    renderRecipes();
    updateRecipeCounts();
    updateTotalRecipes();
}

// =============== FUNCIONES DE INTERFAZ ===============
function showLoading(show) {
    const loadingElement = document.getElementById('loading-recipes');
    const errorElement = document.getElementById('error-recipes');
    const recipesGrid = document.getElementById('recipes-grid');
    
    if (loadingElement) loadingElement.style.display = show ? 'block' : 'none';
    if (errorElement) errorElement.style.display = 'none';
    if (recipesGrid) recipesGrid.style.display = show ? 'none' : 'grid';
}

function showError(message) {
    const errorElement = document.getElementById('error-recipes');
    const errorMessage = document.getElementById('error-message');
    
    if (errorElement) errorElement.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
}

// =============== RENDERIZAR RECETAS ===============
function renderFilters() {
    const filterButtons = document.getElementById('filter-buttons');
    if (!filterButtons) return;
    
    filterButtons.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `filter-btn ${currentCategory === category.id ? 'active' : ''}`;
        button.textContent = category.displayName;
        button.dataset.category = category.id;
        
        button.addEventListener('click', () => {
            currentCategory = category.id;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            renderRecipes();
            updateRecipeCounts();
        });
        
        filterButtons.appendChild(button);
    });
}

function renderRecipes() {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;
    
    // Filtrar recetas
    let filteredRecipes = [...recipes];
    
    if (currentCategory !== 'todos') {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const catId = recipe.category.toLowerCase().replace(/ /g, '-');
            return catId === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const searchText = [
                recipe.title || '',
                recipe.description || '',
                recipe.category || '',
                recipe.ingredients || '',
                recipe.instructions || ''
            ].join(' ').toLowerCase();
            
            return searchText.includes(searchQuery);
        });
    }
    
    // Limpiar grid
    recipesGrid.innerHTML = '';
    
    // Si no hay recetas
    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-utensil-spoon" style="font-size: 4rem; color: var(--primary-gold); margin-bottom: 20px; opacity: 0.7;"></i>
                <h3 style="color: var(--text-color); margin-bottom: 15px;">No se encontraron recetas</h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px;">
                    ${searchQuery ? 'Prueba con otros términos de búsqueda.' : 'No hay recetas disponibles en esta categoría.'}
                </p>
                ${searchQuery ? 
                    '<button onclick="clearSearch()" class="btn btn-primary" style="margin: 10px;">Limpiar búsqueda</button>' : 
                    ''
                }
                <button onclick="loadRecipesFromGoogleSheets()" class="btn btn-secondary" style="margin: 10px;">
                    <i class="fas fa-redo"></i> Recargar recetas
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar cada receta
    filteredRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesGrid.appendChild(recipeCard);
    });
}

function createRecipeCard(recipe) {
    const recipeCard = document.createElement('div');
    recipeCard.className = 'recipe-card';
    
    // Clase de dificultad para estilos
    const difficultyClass = recipe.difficulty.toLowerCase().replace(/[áéíóú]/g, function(match) {
        const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
        return map[match];
    });
    
    // HTML con imagen
    recipeCard.innerHTML = `
        <div class="recipe-image">
            <img src="${recipe.image}" alt="${recipe.title}" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJNb250c2VycmF0IiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+JXtyZWNpcGUudGl0bGV9PC90ZXh0Pjwvc3ZnPg='; this.style.objectFit='contain'; this.style.padding='20px'">
        </div>
        <div class="recipe-content">
            <div class="recipe-header">
                <h3 class="recipe-title">${recipe.title}</h3>
                <span class="recipe-difficulty ${difficultyClass}">${recipe.difficulty}</span>
            </div>
            <p class="recipe-description">${recipe.description}</p>
            <div class="recipe-meta">
                <span class="recipe-category">${recipe.category}</span>
                <span class="recipe-time"><i class="fas fa-clock"></i> ${recipe.time}</span>
            </div>
            <div class="recipe-actions">
                <button class="view-recipe-btn" data-id="${recipe.id}">
                    <i class="fas fa-book-open"></i> Ver Receta
                </button>
                <span><i class="fas fa-user-friends"></i> ${recipe.portions} personas</span>
            </div>
        </div>
    `;
    
    // Evento para abrir el modal
    recipeCard.querySelector('.view-recipe-btn').addEventListener('click', () => {
        openRecipeModal(recipe);
    });
    
    return recipeCard;
}

function updateRecipeCounts() {
    // Actualizar contadores por categoría
    categories.forEach(category => {
        if (category.id !== 'todos') {
            const countElement = document.getElementById(`count-${category.id}`);
            if (countElement) {
                const count = recipes.filter(recipe => {
                    const catId = recipe.category.toLowerCase().replace(/ /g, '-');
                    return catId === category.id;
                }).length;
                countElement.textContent = `${count} ${count === 1 ? 'receta' : 'recetas'}`;
            }
        }
    });
}

function updateTotalRecipes() {
    const totalRecipesElement = document.getElementById('total-recipes');
    if (totalRecipesElement) {
        totalRecipesElement.textContent = recipes.length;
    }
}

// =============== MODAL DE RECETA ===============
function openRecipeModal(recipe) {
    const recipeModal = document.getElementById('recipe-modal');
    const modalRecipeTitle = document.getElementById('modal-recipe-title');
    const modalRecipeContent = document.getElementById('modal-recipe-content');
    
    if (!recipeModal || !modalRecipeTitle || !modalRecipeContent) return;
    
    modalRecipeTitle.textContent = recipe.title;
    
    // Clase de dificultad
    const difficultyClass = recipe.difficulty.toLowerCase().replace(/[áéíóú]/g, function(match) {
        const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
        return map[match];
    });
    
    // Construir contenido del modal
    let modalHTML = `
        <div class="recipe-modal-details">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                    <div style="font-weight: 500; color: var(--text-color);">${recipe.category}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Tiempo</div>
                    <div style="font-weight: 500; color: var(--text-color);">${recipe.time}</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Porciones</div>
                    <div style="font-weight: 500; color: var(--text-color);">${recipe.portions} personas</div>
                </div>
                <div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Dificultad</div>
                    <div style="font-weight: 500; color: var(--text-color);">
                        <span class="recipe-difficulty ${difficultyClass}">${recipe.difficulty}</span>
                    </div>
                </div>
            </div>
            
            ${recipe.image ? `
            <div style="margin: 30px 0; text-align: center;">
                <img src="${recipe.image}" alt="${recipe.title}" 
                     style="max-width: 100%; max-height: 300px; border-radius: 10px; object-fit: cover;"
                     onerror="this.onerror=null; this.style.display='none'">
            </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 30px;">
                <div>
                    <h4 style="color: var(--primary-gold); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-gold);">
                        <i class="fas fa-shopping-basket"></i> Ingredientes
                    </h4>
                    <div style="background-color: var(--dark-gray); padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8; border: 1px solid var(--medium-gray);">
                        ${recipe.ingredients}
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--gold-light); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--gold-light);">
                        <i class="fas fa-list-ol"></i> Instrucciones
                    </h4>
                    <div style="background-color: var(--dark-gray); padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8; border: 1px solid var(--medium-gray);">
                        ${recipe.instructions}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: rgba(212, 175, 55, 0.05); border-radius: 10px; border-left: 4px solid var(--primary-gold);">
                <h5 style="color: var(--primary-gold); margin-bottom: 10px;">
                    <i class="fas fa-lightbulb"></i> Consejos
                </h5>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    • Esta receta es perfecta para ${recipe.portions} personas.<br>
                    • Puedes ajustar los ingredientes según tus preferencias.<br>
                    • Si te sobra, puedes guardarla en refrigeración por 2-3 días.
                </p>
            </div>
        </div>
    `;
    
    modalRecipeContent.innerHTML = modalHTML;
    recipeModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const recipeModal = document.getElementById('recipe-modal');
    if (recipeModal) {
        recipeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// =============== FUNCIONES ADMIN (DEMO - EN MEMORIA) ===============
function loadAdminRecipes() {
    const adminRecipesList = document.getElementById('admin-recipes-list');
    if (!adminRecipesList) return;
    
    adminRecipesList.innerHTML = '';
    
    if (recipes.length === 0) {
        adminRecipesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay recetas disponibles.</p>';
        return;
    }
    
    recipes.forEach(recipe => {
        const recipeItem = document.createElement('div');
        recipeItem.className = 'admin-recipe-item';
        recipeItem.innerHTML = `
            <div class="admin-recipe-header">
                <div class="admin-recipe-title">${recipe.title}</div>
                <div class="admin-recipe-actions">
                    <button class="action-btn edit" onclick="editRecipe(${recipe.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete" onclick="deleteRecipePrompt(${recipe.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
            <div class="admin-recipe-details">
                <div><strong>Categoría:</strong> ${recipe.category}</div>
                <div><strong>Tiempo:</strong> ${recipe.time}</div>
                <div><strong>Porciones:</strong> ${recipe.portions}</div>
                <div><strong>Dificultad:</strong> ${recipe.difficulty}</div>
            </div>
        `;
        adminRecipesList.appendChild(recipeItem);
    });
}

function loadEditRecipeSelect() {
    const editRecipeSelect = document.getElementById('edit-recipe-select');
    if (!editRecipeSelect) return;
    
    editRecipeSelect.innerHTML = '<option value="">Seleccionar receta para editar</option>';
    
    recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.title} (${recipe.category})`;
        editRecipeSelect.appendChild(option);
    });
}

function loadRecipeForEditing(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Llenar el formulario de edición
    document.getElementById('edit-recipe-title').value = recipe.title;
    document.getElementById('edit-recipe-category').value = recipe.category;
    document.getElementById('edit-recipe-image').value = recipe.image;
    document.getElementById('edit-recipe-time').value = recipe.time;
    document.getElementById('edit-recipe-portions').value = recipe.portions;
    document.getElementById('edit-recipe-difficulty').value = recipe.difficulty;
    document.getElementById('edit-recipe-ingredients').value = recipe.ingredients;
    document.getElementById('edit-recipe-instructions').value = recipe.instructions;
    
    // Mostrar formulario
    document.getElementById('edit-recipe-form').style.display = 'block';
    document.getElementById('edit-form-status').innerHTML = '';
}

function addNewRecipe() {
    const title = document.getElementById('new-recipe-title').value.trim();
    const category = document.getElementById('new-recipe-category').value;
    const image = document.getElementById('new-recipe-image').value.trim();
    const time = document.getElementById('new-recipe-time').value.trim();
    const portions = parseInt(document.getElementById('new-recipe-portions').value);
    const difficulty = document.getElementById('new-recipe-difficulty').value;
    const ingredients = document.getElementById('new-recipe-ingredients').value.trim();
    const instructions = document.getElementById('new-recipe-instructions').value.trim();
    
    // Validación básica
    if (!title || !category || !image || !time || !portions || !difficulty || !ingredients || !instructions) {
        showFormStatus('Por favor completa todos los campos obligatorios.', 'error');
        return;
    }
    
    // Crear nueva receta (en memoria para demo)
    const newRecipe = {
        id: recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1,
        title,
        description: `${title} - Una deliciosa receta de ${category.toLowerCase()}.`,
        category,
        image,
        time,
        portions,
        difficulty,
        ingredients,
        instructions
    };
    
    // Agregar a la lista en memoria
    recipes.push(newRecipe);
    
    // Mostrar éxito
    showFormStatus(`¡Receta "${title}" agregada exitosamente!`, 'success');
    
    // Limpiar formulario
    document.getElementById('add-recipe-form').reset();
    
    // Actualizar vistas
    renderRecipes();
    updateRecipeCounts();
    updateTotalRecipes();
    loadAdminRecipes();
    loadEditRecipeSelect();
    
    // Scroll a la nueva receta
    setTimeout(() => {
        document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

function saveEditedRecipe() {
    const recipeId = parseInt(document.getElementById('edit-recipe-select').value);
    const recipeIndex = recipes.findIndex(r => r.id === recipeId);
    
    if (recipeIndex === -1) {
        showEditFormStatus('Receta no encontrada.', 'error');
        return;
    }
    
    // Actualizar receta en memoria
    recipes[recipeIndex] = {
        ...recipes[recipeIndex],
        title: document.getElementById('edit-recipe-title').value.trim(),
        category: document.getElementById('edit-recipe-category').value,
        image: document.getElementById('edit-recipe-image').value.trim(),
        time: document.getElementById('edit-recipe-time').value.trim(),
        portions: parseInt(document.getElementById('edit-recipe-portions').value),
        difficulty: document.getElementById('edit-recipe-difficulty').value,
        ingredients: document.getElementById('edit-recipe-ingredients').value.trim(),
        instructions: document.getElementById('edit-recipe-instructions').value.trim()
    };
    
    // Mostrar éxito
    showEditFormStatus(`¡Receta "${recipes[recipeIndex].title}" actualizada exitosamente!`, 'success');
    
    // Actualizar vistas
    renderRecipes();
    updateRecipeCounts();
    loadAdminRecipes();
    loadEditRecipeSelect();
    
    // Resetear formulario de edición
    setTimeout(() => {
        document.getElementById('edit-recipe-form').style.display = 'none';
        document.getElementById('edit-recipe-select').value = '';
        document.getElementById('edit-form-status').innerHTML = '';
    }, 2000);
}

function deleteRecipe(recipeId) {
    const recipeIndex = recipes.findIndex(r => r.id === recipeId);
    
    if (recipeIndex === -1) {
        showEditFormStatus('Receta no encontrada.', 'error');
        return;
    }
    
    const recipeTitle = recipes[recipeIndex].title;
    
    // Eliminar receta en memoria
    recipes.splice(recipeIndex, 1);
    
    // Mostrar éxito
    showEditFormStatus(`¡Receta "${recipeTitle}" eliminada exitosamente!`, 'success');
    
    // Actualizar vistas
    renderRecipes();
    updateRecipeCounts();
    updateTotalRecipes();
    loadAdminRecipes();
    loadEditRecipeSelect();
    
    // Resetear formulario de edición
    setTimeout(() => {
        document.getElementById('edit-recipe-form').style.display = 'none';
        document.getElementById('edit-recipe-select').value = '';
        document.getElementById('edit-form-status').innerHTML = '';
    }, 2000);
}

function deleteRecipePrompt(recipeId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
        deleteRecipe(recipeId);
    }
}

function editRecipe(recipeId) {
    // Cambiar a pestaña de edición
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector('[data-tab="edit-recipe-tab"]').classList.add('active');
    document.getElementById('edit-recipe-tab').classList.add('active');
    
    // Seleccionar la receta
    document.getElementById('edit-recipe-select').value = recipeId;
    loadRecipeForEditing(recipeId);
}

function showFormStatus(message, type) {
    const statusElement = document.getElementById('form-status');
    if (!statusElement) return;
    
    const color = type === 'success' ? '#4CAF50' : '#ff6b6b';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    statusElement.innerHTML = `
        <div style="padding: 15px; background-color: ${type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 107, 107, 0.1)'}; 
                    border-radius: 5px; border-left: 4px solid ${color}; color: ${color};">
            <i class="fas ${icon}" style="margin-right: 10px;"></i>
            ${message}
        </div>
    `;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        statusElement.innerHTML = '';
    }, 5000);
}

function showEditFormStatus(message, type) {
    const statusElement = document.getElementById('edit-form-status');
    if (!statusElement) return;
    
    const color = type === 'success' ? '#4CAF50' : '#ff6b6b';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    statusElement.innerHTML = `
        <div style="padding: 15px; background-color: ${type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 107, 107, 0.1)'}; 
                    border-radius: 5px; border-left: 4px solid ${color}; color: ${color};">
            <i class="fas ${icon}" style="margin-right: 10px;"></i>
            ${message}
        </div>
    `;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        statusElement.innerHTML = '';
    }, 5000);
}

// =============== FUNCIONES GLOBALES ===============
window.clearSearch = function() {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    renderRecipes();
    updateRecipeCounts();
};

window.openRecipeModal = openRecipeModal;
window.closeModal = closeModal;
window.editRecipe = editRecipe;
window.deleteRecipePrompt = deleteRecipePrompt;
window.loadRecipesFromGoogleSheets = loadRecipesFromGoogleSheets;
