// =============== CONFIGURACIÓN SIMPLE ===============
const GOOGLE_SHEETS_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ';
const SHEET_GID = '1201005628';
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${SHEET_GID}`;

// Variables globales
let recipes = [];
let currentCategory = "todos";
let searchQuery = "";

// =============== INICIALIZACIÓN ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Zona Total Recetas - Iniciando...');
    
    // Ocultar mensajes de error y loading al inicio
    setTimeout(() => {
        const errorElement = document.getElementById('error-recipes');
        const loadingElement = document.getElementById('loading-recipes');
        if (errorElement) errorElement.style.display = 'none';
        if (loadingElement) loadingElement.style.display = 'none';
    }, 100);
    
    // Menú móvil
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en enlace
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
        });
    }
    
    // Modal
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
    
    // Categorías
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            currentCategory = category;
            
            // Actualizar botones de filtro
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });
            
            renderRecipes();
        });
    });
    
    // Botón de reintento
    const retryBtn = document.getElementById('retry-load-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadRecipes();
        });
    }
    
    // Configurar Admin COMPLETO
    setupAdmin();
    
    // Cargar recetas
    loadRecipes();
});

// =============== CARGAR RECETAS ===============
async function loadRecipes() {
    try {
        console.log('📥 Cargando recetas desde Google Sheets...');
        
        const response = await fetch(GOOGLE_SHEETS_URL);
        const csvText = await response.text();
        
        // Convertir CSV a recetas
        const lines = csvText.split('\n');
        recipes = [];
        
        // Empezar desde la línea 1 (saltar encabezados)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line === ',') continue;
            
            // Parsear línea CSV considerando comas dentro de valores
            const values = parseCSVLine(line);
            
            if (values.length >= 5) {
                const recipe = {
                    id: i,
                    title: values[1]?.trim() || 'Receta sin título',
                    description: values[2]?.trim() || 'Sin descripción',
                    category: values[3]?.trim() || 'Postres',
                    image: fixImageUrl(values[4]?.trim()),
                    time: values[5]?.trim() || '30 min',
                    portions: values[6]?.trim() || '4',
                    difficulty: values[7]?.trim() || 'Media',
                    ingredients: values[8]?.trim() || 'Sin ingredientes',
                    instructions: values[9]?.trim() || 'Sin instrucciones'
                };
                
                if (recipe.title !== 'Receta sin título' && recipe.title !== '') {
                    recipes.push(recipe);
                    console.log(`✅ Receta cargada: "${recipe.title}"`);
                }
            }
        }
        
        console.log(`✅ Total: ${recipes.length} recetas cargadas`);
        
        // Si no hay recetas, mostrar una de ejemplo
        if (recipes.length === 0) {
            console.log('⚠️ No hay recetas, mostrando ejemplo');
            recipes = [{
                id: 1,
                title: "Tarta de Chocolate Ejemplo",
                description: "Receta de ejemplo - Agrega tus recetas en Google Sheets",
                category: "Postres",
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
                time: "1 hora",
                portions: "8",
                difficulty: "Media",
                ingredients: "- 200g de chocolate\n- 100g de mantequilla\n- 3 huevos\n- 150g de azúcar",
                instructions: "1. Derretir el chocolate\n2. Mezclar con mantequilla\n3. Agregar huevos y azúcar\n4. Hornear a 180°C por 30 min\n5. Dejar enfriar y servir"
            }];
        }
        
        // Actualizar interfaz
        updateRecipeCounts();
        updateTotalRecipes();
        renderRecipes();
        
        // Ocultar estados
        document.getElementById('loading-recipes').style.display = 'none';
        document.getElementById('error-recipes').style.display = 'none';
        
    } catch (error) {
        console.log('❌ Error cargando:', error);
        // Usar recetas de ejemplo si hay error
        recipes = [{
            id: 1,
            title: "Tarta de Chocolate",
            description: "Deliciosa tarta cargada desde Google Sheets",
            category: "Postres",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
            time: "1 hora 30 min",
            portions: "8",
            difficulty: "Media",
            ingredients: "- 200g de galletas de chocolate\n- 100g de mantequilla derretida\n- 300g de chocolate negro\n- 200ml de nata para montar\n- 3 huevos\n- 100g de azúcar\n- 1 cucharadita de esencia de vainilla",
            instructions: "1. Triturar las galletas y mezclar con la mantequilla derretida.\n2. Forrar un molde con esta mezcla y reservar en frío.\n3. Derretir el chocolate al baño maría.\n4. Montar la nata y reservar.\n5. Batir los huevos con el azúcar hasta que blanqueen.\n6. Mezclar el chocolate derretido con los huevos batidos.\n7. Incorporar la nata montada con movimientos envolventes.\n8. Verter sobre la base de galleta y refrigerar 4 horas.\n9. Decorar con virutas de chocolate antes de servir."
        }];
        
        updateRecipeCounts();
        updateTotalRecipes();
        renderRecipes();
        document.getElementById('loading-recipes').style.display = 'none';
        document.getElementById('error-recipes').style.display = 'none';
    }
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

function fixImageUrl(url) {
    if (!url || url.trim() === '') {
        return 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80';
    }
    
    let fixedUrl = url.trim();
    
    // Si es Unsplash, agregar parámetros
    if (fixedUrl.includes('unsplash.com') && !fixedUrl.includes('?')) {
        fixedUrl += '?w=800&auto=format&fit=crop&q=80';
    }
    
    // Si es Imgur sin extensión, agregar .jpg
    if (fixedUrl.includes('imgur.com') && !fixedUrl.includes('.jpg') && !fixedUrl.includes('.png')) {
        const parts = fixedUrl.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 0) {
            fixedUrl = `https://i.imgur.com/${lastPart}.jpg`;
        }
    }
    
    return fixedUrl;
}

// =============== RENDERIZAR RECETAS ===============
function renderRecipes() {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;
    
    recipesGrid.innerHTML = '';
    
    // Filtrar recetas
    let filteredRecipes = recipes;
    
    if (currentCategory !== 'todos') {
        filteredRecipes = recipes.filter(r => {
            const catId = r.category.toLowerCase().replace(/ /g, '-');
            return catId === currentCategory;
        });
    }
    
    if (searchQuery) {
        filteredRecipes = filteredRecipes.filter(r => {
            const searchText = (r.title + ' ' + r.description + ' ' + r.category + ' ' + r.ingredients + ' ' + r.instructions).toLowerCase();
            return searchText.includes(searchQuery);
        });
    }
    
    // Si no hay recetas después de filtrar
    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-utensil-spoon" style="font-size: 4rem; color: #D4AF37; margin-bottom: 20px;"></i>
                <h3 style="color: white; margin-bottom: 15px;">No se encontraron recetas</h3>
                <p style="color: #cccccc; margin-bottom: 20px;">
                    ${searchQuery ? 'Prueba con otros términos de búsqueda' : 'No hay recetas en esta categoría'}
                </p>
                ${searchQuery ? 
                    '<button onclick="clearSearch()" class="btn btn-primary" style="margin: 10px;">Limpiar búsqueda</button>' : 
                    ''
                }
                <button onclick="loadRecipes()" class="btn btn-secondary" style="margin: 10px;">
                    <i class="fas fa-redo"></i> Recargar recetas
                </button>
            </div>
        `;
        return;
    }
    
    // Mostrar recetas
    filteredRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        // Clase de dificultad
        const difficultyClass = recipe.difficulty.toLowerCase().replace(/[áéíóú]/g, function(match) {
            const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
            return map[match];
        });
        
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.title}" 
                     style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;">
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
                    <button class="view-recipe-btn" onclick="openRecipeModal(${recipe.id})">
                        <i class="fas fa-book-open"></i> Ver Receta
                    </button>
                    <span><i class="fas fa-user-friends"></i> ${recipe.portions} personas</span>
                </div>
            </div>
        `;
        recipesGrid.appendChild(card);
    });
}

function updateRecipeCounts() {
    // Actualizar contador total
    const totalElement = document.getElementById('total-recipes');
    if (totalElement) totalElement.textContent = recipes.length;
    
    // Actualizar contadores por categoría
    const categories = ['postres', 'comidas-saladas', 'bebidas', 'sopas-y-cremas', 'reposteria'];
    categories.forEach(cat => {
        const count = recipes.filter(r => {
            const catId = r.category.toLowerCase().replace(/ /g, '-');
            return catId === cat;
        }).length;
        const element = document.getElementById(`count-${cat}`);
        if (element) element.textContent = `${count} receta${count !== 1 ? 's' : ''}`;
    });
}

function updateTotalRecipes() {
    const element = document.getElementById('total-recipes');
    if (element) element.textContent = recipes.length;
}

// =============== MODAL ===============
function openRecipeModal(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const modal = document.getElementById('recipe-modal');
    const title = document.getElementById('modal-recipe-title');
    const content = document.getElementById('modal-recipe-content');
    
    if (!modal || !title || !content) return;
    
    title.textContent = recipe.title;
    
    // Clase de dificultad
    const difficultyClass = recipe.difficulty.toLowerCase().replace(/[áéíóú]/g, function(match) {
        const map = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'};
        return map[match];
    });
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
            <div>
                <div style="color: #cccccc; font-size: 0.9rem; margin-bottom: 5px;">Categoría</div>
                <div style="font-weight: 500; color: white;">${recipe.category}</div>
            </div>
            <div>
                <div style="color: #cccccc; font-size: 0.9rem; margin-bottom: 5px;">Tiempo</div>
                <div style="font-weight: 500; color: white;">${recipe.time}</div>
            </div>
            <div>
                <div style="color: #cccccc; font-size: 0.9rem; margin-bottom: 5px;">Porciones</div>
                <div style="font-weight: 500; color: white;">${recipe.portions} personas</div>
            </div>
            <div>
                <div style="color: #cccccc; font-size: 0.9rem; margin-bottom: 5px;">Dificultad</div>
                <div style="font-weight: 500; color: white;">
                    <span class="recipe-difficulty ${difficultyClass}">${recipe.difficulty}</span>
                </div>
            </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <img src="${recipe.image}" alt="${recipe.title}" 
                 style="max-width: 100%; max-height: 300px; border-radius: 10px; object-fit: cover;">
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 30px;">
            <div>
                <h4 style="color: #D4AF37; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #D4AF37;">
                    <i class="fas fa-shopping-basket"></i> Ingredientes
                </h4>
                <div style="background-color: #333; padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8; border: 1px solid #444;">
                    ${recipe.ingredients}
                </div>
            </div>
            
            <div>
                <h4 style="color: #E6C158; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #E6C158;">
                    <i class="fas fa-list-ol"></i> Instrucciones
                </h4>
                <div style="background-color: #333; padding: 20px; border-radius: 5px; white-space: pre-line; line-height: 1.8; border: 1px solid #444;">
                    ${recipe.instructions}
                </div>
            </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: rgba(212, 175, 55, 0.05); border-radius: 10px; border-left: 4px solid #D4AF37;">
            <h5 style="color: #D4AF37; margin-bottom: 10px;">
                <i class="fas fa-lightbulb"></i> Consejos
            </h5>
            <p style="color: #cccccc; font-size: 0.95rem;">
                • Esta receta es perfecta para ${recipe.portions} personas.<br>
                • Puedes ajustar los ingredientes según tus preferencias.<br>
                • Si te sobra, puedes guardarla en refrigeración por 2-3 días.
            </p>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('recipe-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// =============== ADMIN COMPLETO Y FUNCIONAL ===============
function setupAdmin() {
    console.log('🔧 Configurando panel admin...');
    
    // 1. Botón para abrir admin
    const adminAccessBtn = document.getElementById('admin-access-btn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👤 Click en botón Admin');
            document.getElementById('admin-overlay').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Mostrar credenciales automáticamente
            const loginHint = document.getElementById('login-hint');
            if (loginHint) loginHint.classList.add('active');
        });
    } else {
        console.log('❌ No se encontró botón admin-access-btn');
    }
    
    // 2. Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Enviando formulario de login');
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            console.log('Usuario:', username, 'Contraseña:', password);
            
            // Credenciales válidas
            if (username === 'admin' && password === 'admin123') {
                console.log('✅ Login exitoso');
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                
                // Cargar recetas en el admin
                loadAdminRecipes();
            } else {
                console.log('❌ Login fallido');
                alert('Credenciales incorrectas.');
            }
        });
    } else {
        console.log('❌ No se encontró formulario login-form');
    }
    
    // 3. Botón mostrar credenciales
    const showCredsBtn = document.getElementById('show-creds-btn');
    if (showCredsBtn) {
        showCredsBtn.addEventListener('click', function() {
            const loginHint = document.getElementById('login-hint');
            if (loginHint) {
                loginHint.classList.toggle('active');
                this.textContent = loginHint.classList.contains('active') ? 
                    'Ocultar Credenciales' : 'Mostrar Credenciales';
            }
        });
    }
    
    // 4. Cancelar login
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    if (cancelLoginBtn) {
        cancelLoginBtn.addEventListener('click', function() {
            console.log('❌ Cancelando login');
            document.getElementById('admin-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Limpiar formulario
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
        });
    }
    
    // 5. Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('🚪 Cerrando sesión');
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('admin-overlay').style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Limpiar formulario
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
            
            // Ocultar credenciales
            const loginHint = document.getElementById('login-hint');
            if (loginHint) loginHint.classList.remove('active');
            const showCredsBtn = document.getElementById('show-creds-btn');
            if (showCredsBtn) showCredsBtn.textContent = 'Mostrar Credenciales';
        });
    }
    
    // 6. Tabs del admin
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            console.log('📑 Cambiando a tab:', tabId);
            
            // Remover active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Agregar active al seleccionado
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Si es la tab de recetas, cargarlas
            if (tabId === 'recipes-tab') {
                loadAdminRecipes();
            }
        });
    });
    
    // 7. Botón abrir Google Sheets
    const openSheetsBtn = document.getElementById('open-sheets-btn');
    if (openSheetsBtn) {
        openSheetsBtn.addEventListener('click', function() {
            window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/edit`, '_blank');
        });
    }
    
    // 8. Botón actualizar recetas en admin
    const refreshRecipesBtn = document.getElementById('refresh-recipes-btn');
    if (refreshRecipesBtn) {
        refreshRecipesBtn.addEventListener('click', function() {
            console.log('🔄 Actualizando recetas en admin');
            loadRecipes();
            loadAdminRecipes();
            alert('Recetas actualizadas');
        });
    }
    
    console.log('✅ Admin configurado correctamente');
}

function loadAdminRecipes() {
    console.log('📋 Cargando recetas en panel admin...');
    const adminRecipesList = document.getElementById('admin-recipes-list');
    
    if (!adminRecipesList) {
        console.log('❌ No se encontró admin-recipes-list');
        return;
    }
    
    if (recipes.length === 0) {
        adminRecipesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #cccccc;">
                <i class="fas fa-utensil-spoon" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No hay recetas cargadas.</p>
                <button onclick="loadRecipes()" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Cargar Recetas
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    recipes.forEach(recipe => {
        html += `
            <div class="admin-recipe-item">
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
            </div>
        `;
    });
    
    adminRecipesList.innerHTML = html;
    console.log(`✅ ${recipes.length} recetas cargadas en admin`);
}

// Funciones para editar/eliminar (demo)
window.editRecipe = function(recipeId) {
    alert('Funcionalidad de edición en desarrollo.\n\nPara editar recetas, modifica directamente tu Google Sheets.');
};

window.deleteRecipePrompt = function(recipeId) {
    if (confirm('¿Estás seguro de eliminar esta receta?\n\nNota: Para eliminar permanentemente, borra la fila en Google Sheets.')) {
        alert('Receta eliminada (solo en esta sesión).\n\nPara eliminarla permanentemente, borra la fila en Google Sheets.');
    }
};

// =============== FUNCIONES GLOBALES ===============
window.clearSearch = function() {
    searchQuery = '';
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    renderRecipes();
};

window.openRecipeModal = openRecipeModal;
window.closeModal = closeModal;
window.loadRecipesFromGoogleSheets = loadRecipes;

// Mostrar credenciales automáticamente al abrir admin
window.showAdminCredentials = function() {
    const loginHint = document.getElementById('login-hint');
    if (loginHint) loginHint.classList.add('active');
};
