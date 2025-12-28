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
    
    // Menú móvil simple
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Búsqueda simple
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderRecipes();
        });
    }
    
    // Modal simple
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    // Categorías click
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            currentCategory = this.dataset.category;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-category="${currentCategory}"]`).classList.add('active');
            renderRecipes();
        });
    });
    
    // Cargar recetas
    loadRecipes();
    
    // Ocultar el mensaje de error inmediatamente
    setTimeout(() => {
        const errorElement = document.getElementById('error-recipes');
        if (errorElement) errorElement.style.display = 'none';
    }, 100);
});

// =============== CARGAR RECETAS ===============
async function loadRecipes() {
    try {
        console.log('Cargando recetas...');
        
        const response = await fetch(GOOGLE_SHEETS_URL);
        const csvText = await response.text();
        
        // Convertir CSV a recetas
        const lines = csvText.split('\n');
        recipes = [];
        
        // Empezar desde la línea 1 (saltar encabezados)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',');
            if (parts.length >= 5) {
                const recipe = {
                    id: i,
                    title: parts[1]?.trim() || 'Receta sin título',
                    description: parts[2]?.trim() || 'Sin descripción',
                    category: parts[3]?.trim() || 'Postres',
                    image: fixImageUrl(parts[4]?.trim()),
                    time: parts[5]?.trim() || '30 min',
                    portions: parts[6]?.trim() || '4',
                    difficulty: parts[7]?.trim() || 'Media',
                    ingredients: parts[8]?.trim() || 'Sin ingredientes',
                    instructions: parts[9]?.trim() || 'Sin instrucciones'
                };
                
                if (recipe.title !== 'Receta sin título') {
                    recipes.push(recipe);
                }
            }
        }
        
        console.log(`Cargadas ${recipes.length} recetas`);
        
        // Si no hay recetas, mostrar una de ejemplo
        if (recipes.length === 0) {
            recipes = [{
                id: 1,
                title: "Tarta de Chocolate de Prueba",
                description: "Esta es una receta de ejemplo porque tu Google Sheets está vacío",
                category: "Postres",
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
                time: "1 hora",
                portions: "8",
                difficulty: "Media",
                ingredients: "- 200g de chocolate\n- 100g de mantequilla\n- 3 huevos",
                instructions: "1. Mezclar ingredientes\n2. Hornear a 180°C\n3. Decorar y servir"
            }];
        }
        
        // Actualizar interfaz
        updateRecipeCounts();
        updateTotalRecipes();
        renderRecipes();
        
        // Ocultar loading y error
        document.getElementById('loading-recipes').style.display = 'none';
        document.getElementById('error-recipes').style.display = 'none';
        
    } catch (error) {
        console.log('Error cargando:', error);
        // No mostrar error, usar recetas de ejemplo
        recipes = [{
            id: 1,
            title: "Tarta de Chocolate",
            description: "Receta cargada desde Google Sheets",
            category: "Postres",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80",
            time: "1 hora 30 min",
            portions: "8",
            difficulty: "Media",
            ingredients: "- 200g de galletas\n- 100g de mantequilla\n- 300g de chocolate",
            instructions: "1. Triturar galletas\n2. Mezclar ingredientes\n3. Hornear y servir"
        }];
        
        updateRecipeCounts();
        updateTotalRecipes();
        renderRecipes();
        document.getElementById('loading-recipes').style.display = 'none';
        document.getElementById('error-recipes').style.display = 'none';
    }
}

function fixImageUrl(url) {
    if (!url) return 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80';
    
    let fixedUrl = url.trim();
    
    // Si es Unsplash, agregar parámetros
    if (fixedUrl.includes('unsplash.com') && !fixedUrl.includes('?')) {
        fixedUrl += '?w=800&auto=format&fit=crop&q=80';
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
        filteredRecipes = recipes.filter(r => 
            r.category.toLowerCase().replace(/ /g, '-') === currentCategory
        );
    }
    
    if (searchQuery) {
        filteredRecipes = filteredRecipes.filter(r => 
            r.title.toLowerCase().includes(searchQuery) ||
            r.description.toLowerCase().includes(searchQuery) ||
            r.category.toLowerCase().includes(searchQuery)
        );
    }
    
    // Si no hay recetas después de filtrar
    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-utensil-spoon" style="font-size: 4rem; color: #D4AF37; margin-bottom: 20px;"></i>
                <h3 style="color: white; margin-bottom: 15px;">No hay recetas</h3>
                <p style="color: #cccccc;">
                    ${searchQuery ? 'Prueba con otra búsqueda' : 'Intenta recargar la página'}
                </p>
            </div>
        `;
        return;
    }
    
    // Mostrar recetas
    filteredRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.title}" 
                     style="width:100%;height:200px;object-fit:cover;">
            </div>
            <div class="recipe-content">
                <div class="recipe-header">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <span class="recipe-difficulty">${recipe.difficulty}</span>
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
        const count = recipes.filter(r => 
            r.category.toLowerCase().replace(/ /g, '-') === cat
        ).length;
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
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <img src="${recipe.image}" alt="${recipe.title}" 
                 style="width:100%;max-height:300px;object-fit:cover;border-radius:10px;">
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
            <div><strong>Categoría:</strong> ${recipe.category}</div>
            <div><strong>Tiempo:</strong> ${recipe.time}</div>
            <div><strong>Porciones:</strong> ${recipe.portions}</div>
            <div><strong>Dificultad:</strong> ${recipe.difficulty}</div>
        </div>
        <div style="margin-bottom: 20px;">
            <h4 style="color: #D4AF37; margin-bottom: 10px;">Ingredientes</h4>
            <div style="background: #333; padding: 15px; border-radius: 5px; white-space: pre-line;">
                ${recipe.ingredients}
            </div>
        </div>
        <div>
            <h4 style="color: #D4AF37; margin-bottom: 10px;">Instrucciones</h4>
            <div style="background: #333; padding: 15px; border-radius: 5px; white-space: pre-line;">
                ${recipe.instructions}
            </div>
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

// =============== ADMIN SIMPLE ===============
function setupAdmin() {
    const adminBtn = document.getElementById('admin-access-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-overlay').style.display = 'flex';
        });
    }
    
    const cancelBtn = document.getElementById('cancel-login-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('admin-overlay').style.display = 'none';
        });
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('admin-username').value;
            const pass = document.getElementById('admin-password').value;
            
            if (user === 'chef' && pass === 'recetas123') {
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
            } else {
                alert('Usuario: chef\nContraseña: recetas123');
            }
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
        });
    }
}

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
