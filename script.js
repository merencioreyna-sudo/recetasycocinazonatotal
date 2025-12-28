// =============== CONFIGURACIÓN GOOGLE SHEETS ===============
const GOOGLE_SHEETS_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ';
const SHEET_NAME = 'recetas'; // Nombre de la hoja
const GOOGLE_SHEETS_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

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

// =============== FUNCIONES PARA GOOGLE SHEETS ===============
async function loadRecipesFromGoogleSheets() {
    try {
        showLoading(true);
        
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
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
    
    // Saltar la primera línea (encabezados)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parsear línea CSV (manejar comas dentro de comillas)
        const values = parseCSVLine(line);
        
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
            if (recipe.title !== 'Receta sin título') {
                recipes.push(recipe);
            }
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
        }
    ];
    
    renderFilters();
    renderRecipes();
    updateRecipeCounts();
    updateTotalRecipes();
}

// =============== INICIALIZACIÓN ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍳 Zona Total Recetas - Iniciando...');
    
    // Menú móvil
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
            });
        });
    }

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderRecipes();
            updateRecipeCounts();
        });
    }

    // Configurar modal
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

    // Configurar Admin
    setupAdmin();
    
    // Categorías click
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
    
    // Cargar recetas desde Google Sheets
    loadRecipesFromGoogleSheets();
    
    // Botón de reintento
    const retryBtn = document.getElementById('retry-load-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadRecipesFromGoogleSheets();
        });
    }
});

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
                <i class="fas fa-utensil-spoon" style="font-size: 4rem; color: var(--primary-orange); margin-bottom: 20px; opacity: 0.7;"></i>
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
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOGY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJQb3BwaW5zIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+${encodeURIComponent(recipe.title)}PC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0iUG9wcGlucyIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg='; this.style.objectFit='contain'; this.style.padding='20px'">
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
                    <h4 style="color: var(--primary-green); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-green);">
                        <i class="fas fa-shopping-basket"></i> Ingredientes
                    </h4>
                    <div style="background-color: var(--light-gray); padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8;">
                        ${recipe.ingredients}
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary-orange); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-orange);">
                        <i class="fas fa-list-ol"></i> Instrucciones
                    </h4>
                    <div style="background-color: var(--light-gray); padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8;">
                        ${recipe.instructions}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: rgba(46, 139, 87, 0.05); border-radius: 10px; border-left: 4px solid var(--primary-green);">
                <h5 style="color: var(--primary-green); margin-bottom: 10px;">
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

// =============== ADMIN (solo lectura ahora) ===============
function setupAdmin() {
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
    
    // Login (simplificado - solo para mostrar)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Acceso directo para demo
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            loadAdminRecipes();
            loadEditRecipeSelect();
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
    
    // Tabs (solo mostrar)
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
            
            // Mostrar mensaje informativo
            if (tabId === 'add-recipe-tab' || tabId === 'edit-recipe-tab') {
                showAdminMessage('Para agregar o editar recetas, debes hacerlo directamente en Google Sheets.', 'info');
            }
        });
    });
}

function loadAdminRecipes() {
    const adminRecipesList = document.getElementById('admin-recipes-list');
    if (!adminRecipesList) return;
    
    adminRecipesList.innerHTML = '';
    
    if (recipes.length === 0) {
        adminRecipesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-utensil-spoon" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No hay recetas cargadas desde Google Sheets.</p>
                <button onclick="loadRecipesFromGoogleSheets()" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Cargar Recetas
                </button>
            </div>
        `;
        return;
    }
    
    recipes.forEach(recipe => {
        const recipeItem = document.createElement('div');
        recipeItem.className = 'admin-recipe-item';
        recipeItem.innerHTML = `
            <div class="admin-recipe-header">
                <div class="admin-recipe-title">${recipe.title}</div>
                <div class="admin-recipe-actions">
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">
                        <i class="fas fa-database"></i> Desde Google Sheets
                    </span>
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
    
    editRecipeSelect.innerHTML = '<option value="">Las recetas se editan directamente en Google Sheets</option>';
    
    // Deshabilitar formularios de edición
    document.getElementById('add-recipe-form').innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--primary-orange); margin-bottom: 20px;"></i>
            <h4 style="margin-bottom: 15px;">Edición Directa en Google Sheets</h4>
            <p>Para agregar nuevas recetas, edita directamente tu Google Sheets:</p>
            <p style="margin: 20px 0; font-family: monospace; background: var(--light-gray); padding: 10px; border-radius: 5px;">
                ${GOOGLE_SHEETS_CSV_URL}
            </p>
            <a href="https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit" 
               target="_blank" 
               class="btn btn-primary">
                <i class="fas fa-external-link-alt"></i> Abrir Google Sheets
            </a>
        </div>
    `;
    
    document.getElementById('edit-recipe-form').innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fas fa-info-circle" style="font-size: 3rem; color: var(--primary-green); margin-bottom: 20px;"></i>
            <h4 style="margin-bottom: 15px;">Modo Solo Lectura</h4>
            <p>Las recetas se cargan automáticamente desde Google Sheets.</p>
            <p>Para editar recetas, modifícalas directamente en tu hoja de cálculo.</p>
            <div style="margin: 20px 0; padding: 15px; background: var(--light-gray); border-radius: 5px;">
                <p><strong>Instrucciones:</strong></p>
                <p>1. Abre tu Google Sheets</p>
                <p>2. Agrega nuevas filas con el formato correcto</p>
                <p>3. La web se actualizará automáticamente</p>
            </div>
        </div>
    `;
}

function showAdminMessage(message, type) {
    const formStatus = document.getElementById('form-status');
    const editFormStatus = document.getElementById('edit-form-status');
    
    const color = type === 'info' ? 'var(--primary-orange)' : 
                  type === 'success' ? 'var(--primary-green)' : 'var(--accent-red)';
    const icon = type === 'info' ? 'fa-info-circle' : 
                 type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    const html = `
        <div style="padding: 15px; background-color: rgba(255, 127, 80, 0.1); 
                    border-radius: 5px; border-left: 4px solid ${color}; color: ${color};">
            <i class="fas ${icon}" style="margin-right: 10px;"></i>
            ${message}
        </div>
    `;
    
    if (formStatus) formStatus.innerHTML = html;
    if (editFormStatus) editFormStatus.innerHTML = html;
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
window.loadRecipesFromGoogleSheets = loadRecipesFromGoogleSheets;

// Para depuración
window.getRecipes = () => recipes;
window.getGoogleSheetsURL = () => GOOGLE_SHEETS_CSV_URL;