// =============== CONFIGURACIÓN GOOGLE SHEETS ===============
// ID de tu Google Sheets
const GOOGLE_SHEETS_ID = '1YAqfZadMR5O6mABhl0QbhF8scbtIW9JJPfwdED4bzDQ';
const SHEET_GID = '1201005628';
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${SHEET_GID}`;

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

// =============== FUNCIÓN PARA ARREGLAR URLs DE IMÁGENES ===============
function fixImageUrl(url) {
    if (!url || url.trim() === '') {
        return getDefaultImage();
    }
    
    let imageUrl = url.trim();
    
    console.log(`🔧 Procesando URL: ${imageUrl}`);
    
    // 1. Unsplash - Agregar parámetros si no los tiene
    if (imageUrl.includes('unsplash.com')) {
        if (!imageUrl.includes('?')) {
            imageUrl += '?w=800&auto=format&fit=crop';
            console.log(`   → Unsplash: Parámetros agregados`);
        }
    }
    
    // 2. Imgur - Convertir enlaces de página a enlaces directos
    if (imageUrl.includes('imgur.com')) {
        // Si es un enlace de página (no termina en extensión)
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            // Extraer el ID de la imagen
            const imgurId = imageUrl.split('/').pop();
            if (imgurId) {
                imageUrl = `https://i.imgur.com/${imgurId}.jpg`;
                console.log(`   → Imgur: Convertido a enlace directo`);
            }
        }
    }
    
    // 3. Google Drive - Convertir enlaces de vista a enlaces directos
    if (imageUrl.includes('drive.google.com')) {
        // Extraer ID del archivo
        const match = imageUrl.match(/\/d\/(.*?)\//);
        if (match && match[1]) {
            imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
            console.log(`   → Google Drive: Convertido a enlace directo`);
        }
    }
    
    // 4. Dropbox - Convertir enlaces de dropbox.com a dl.dropboxusercontent.com
    if (imageUrl.includes('dropbox.com')) {
        if (!imageUrl.includes('dl.dropboxusercontent.com')) {
            imageUrl = imageUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                               .replace('dropbox.com', 'dl.dropboxusercontent.com')
                               .replace('?dl=0', '?raw=1');
            console.log(`   → Dropbox: Convertido a enlace directo`);
        }
    }
    
    // 5. Pinterest - Intentar obtener imagen directa (limitado)
    if (imageUrl.includes('pinterest.com') || imageUrl.includes('pinimg.com')) {
        // Pinterest es complicado, pero podemos intentar
        console.log(`   → Pinterest: URL puede necesitar ajustes manuales`);
    }
    
    // 6. Asegurar que sea HTTPS
    if (imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
        console.log(`   → Actualizado a HTTPS`);
    }
    
    console.log(`   → URL final: ${imageUrl}`);
    return imageUrl;
}

function getDefaultImage() {
    const defaultImages = [
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=800&auto=format&fit=crop'
    ];
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

// =============== FUNCIONES PARA GOOGLE SHEETS ===============
async function loadRecipesFromGoogleSheets() {
    try {
        showLoading(true);
        
        console.log('📥 Intentando cargar recetas desde:', GOOGLE_SHEETS_URL);
        
        const response = await fetch(GOOGLE_SHEETS_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        // Verificar que el CSV no esté vacío
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('El archivo CSV está vacío');
        }
        
        console.log('✅ CSV descargado correctamente');
        console.log('Primeras 500 caracteres del CSV:', csvText.substring(0, 500));
        
        recipes = parseCSV(csvText);
        
        console.log(`✅ Cargadas ${recipes.length} recetas desde Google Sheets`);
        
        if (recipes.length === 0) {
            throw new Error('No se encontraron recetas en el archivo CSV');
        }
        
        // Actualizar la interfaz
        renderFilters();
        renderRecipes();
        updateRecipeCounts();
        updateTotalRecipes();
        
        showLoading(false);
        hideError();
        
        return recipes;
    } catch (error) {
        console.error('❌ Error cargando recetas:', error);
        showError(`No se pudieron cargar las recetas: ${error.message}`);
        showLoading(false);
        
        // Mostrar datos de ejemplo para debug
        console.log('Mostrando recetas de ejemplo para debug...');
        loadSampleRecipes();
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const recipes = [];
    
    console.log(`📊 Total de líneas en CSV: ${lines.length}`);
    
    // Verificar si hay datos
    if (lines.length <= 1) {
        console.log('⚠️ El CSV está vacío o solo tiene encabezados');
        return recipes;
    }
    
    // Mostrar encabezados para debug
    console.log('📋 Encabezados del CSV:', lines[0]);
    
    // Procesar cada línea (empezando desde la fila 1 para saltar encabezados)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Saltar líneas vacías
        if (!line || line === ',') continue;
        
        console.log(`📝 Procesando línea ${i}: "${line.substring(0, 50)}..."`);
        
        try {
            // Parsear línea CSV considerando comas dentro de comillas
            const values = [];
            let current = '';
            let insideQuotes = false;
            
            for (let char of line) {
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
            
            console.log(`Valores parseados:`, values);
            
            // Asegurar que tenemos al menos 3 valores (id, título, categoría)
            if (values.length >= 4) {
                // Arreglar la URL de la imagen ANTES de crear el objeto
                const originalImageUrl = values[4] || '';
                const fixedImageUrl = fixImageUrl(originalImageUrl);
                
                const recipe = {
                    id: parseInt(values[0]) || i,
                    title: values[1] || `Receta ${i}`,
                    description: values[2] || 'Descripción no disponible',
                    category: values[3] || 'Postres',
                    image: fixedImageUrl, // Usamos la URL arreglada
                    time: values[5] || '30 min',
                    portions: parseInt(values[6]) || 4,
                    difficulty: values[7] || 'Media',
                    ingredients: (values[8] || 'Ingredientes no especificados').replace(/\\n/g, '\n'),
                    instructions: (values[9] || 'Instrucciones no disponibles').replace(/\\n/g, '\n')
                };
                
                // Solo agregar si tiene título
                if (recipe.title && recipe.title !== 'Receta sin título') {
                    recipes.push(recipe);
                    console.log(`✓ Receta agregada: ${recipe.title} (${recipe.category})`);
                    console.log(`  Imagen: ${recipe.image}`);
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

function loadSampleRecipes() {
    recipes = [
        {
            id: 1,
            title: "Tarta de Chocolate Intenso",
            description: "Una tarta de chocolate rica y cremosa con base de galleta",
            category: "Postres",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop",
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
            image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format&fit=crop",
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
    if (recipesGrid) recipesGrid.style.display = show ? 'none' : 'grid';
}

function hideError() {
    const errorElement = document.getElementById('error-recipes');
    if (errorElement) errorElement.style.display = 'none';
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
    
    // Usar la URL ya arreglada desde parseCSV
    const imageUrl = recipe.image;
    
    // HTML con imagen
    recipeCard.innerHTML = `
        <div class="recipe-image">
            <img src="${imageUrl}" alt="${recipe.title}" 
                 onerror="handleImageError(this, '${recipe.title}', '${imageUrl}')"
                 onload="console.log('✅ Imagen cargada: ${recipe.title}')">
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

// Función global para manejar errores de imágenes
window.handleImageError = function(imgElement, title, originalUrl) {
    console.error(`❌ Error cargando imagen para "${title}":`, originalUrl);
    
    // Crear imagen de respaldo
    const backupImages = {
        'Postres': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop',
        'Comidas Saladas': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop',
        'Bebidas': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop',
        'Sopas y Cremas': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
        'Repostería': 'https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=800&auto=format&fit=crop'
    };
    
    const backupUrl = backupImages[title] || getDefaultImage();
    
    // Intentar con URL de respaldo
    imgElement.src = backupUrl;
    imgElement.onerror = function() {
        // Si también falla la de respaldo, mostrar placeholder SVG
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJNb250c2VycmF0IiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmVjZXRhOiAke3RpdGxlfTwvdGV4dD48L3N2Zz4=';
        this.style.objectFit = 'contain';
        this.style.padding = '20px';
    };
};

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
    
    // Preparar URL de imagen para el modal (usar tamaño más grande)
    let modalImageUrl = recipe.image;
    
    // Si es Unsplash, cambiar parámetros para tamaño mayor
    if (modalImageUrl.includes('unsplash.com') && modalImageUrl.includes('w=')) {
        modalImageUrl = modalImageUrl.replace(/w=\d+/, 'w=1200');
    }
    
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
            
            <div style="margin: 30px 0; text-align: center;">
                <img src="${modalImageUrl}" alt="${recipe.title}" 
                     style="max-width: 100%; max-height: 400px; border-radius: 10px; object-fit: cover; background-color: #222;"
                     onerror="handleModalImageError(this, '${recipe.title}', '${modalImageUrl}')"
                     onload="console.log('✅ Imagen del modal cargada: ${recipe.title}')">
            </div>
            
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

// Función para manejar errores en imágenes del modal
window.handleModalImageError = function(imgElement, title, originalUrl) {
    console.error(`❌ Error cargando imagen del modal para "${title}":`, originalUrl);
    
    // Crear imagen de respaldo para modal
    const backupImages = {
        'Postres': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&auto=format&fit=crop',
        'Comidas Saladas': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&auto=format&fit=crop',
        'Bebidas': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop',
        'Sopas y Cremas': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop',
        'Repostería': 'https://images.unsplash.com/photo-1555507036-ab794f27d2e9?w=1200&auto=format&fit=crop'
    };
    
    const backupUrl = backupImages[title] || getDefaultImage().replace('w=800', 'w=1200');
    
    imgElement.src = backupUrl;
};

function closeModal() {
    const recipeModal = document.getElementById('recipe-modal');
    if (recipeModal) {
        recipeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
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
