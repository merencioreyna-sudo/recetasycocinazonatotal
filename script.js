const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgIQOv_9-zGwgO_5oK4wmtKvgC0OSkgjz9Nk05I3p7kxT9isiRUKOXSiuUNGLrrRblk3sSiqQR0yPF/pub?output=csv&t=" + new Date().getTime();

function cargarRecetas() {

    fetch(url)
        .then(res => res.text())
        .then(data => {

            const rows = data.split("\n").slice(1).filter(row => row.trim());

            rows.sort((a, b) => {
                const idA = parseInt(a.split(",")[0]) || 0;
                const idB = parseInt(b.split(",")[0]) || 0;
                return idB - idA;
            });

            const container = document.getElementById("recipes-container");
            const recentContainer = document.getElementById("recent-container");

            container.innerHTML = "";
            recentContainer.innerHTML = "";

const scroll = document.querySelector(".recipes-scroll");
if (scroll) {
    scroll.innerHTML = "";
    scroll.dataset.cloned = "";
}

            rows.forEach((row, index) => {

                if (!row.trim()) return;

                const cols = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                if (!cols || cols.length < 10) return;

                for (let i = 0; i < cols.length; i++) {
                    cols[i] = cols[i].replace(/^"|"$/g, "").trim();
                }

                const titulo = cols[1];
                const descripcion = cols[2];
                const categoria = cols[3];
                const imagen = cols[4];
                const tiempo = cols[5];
                const porciones = cols[6];
                const dificultad = cols[7];
                const ingredientes = cols[8];
                const instrucciones = cols[9];

                const card = document.createElement("div");
                card.className = "card";

                card.innerHTML = `
<div class="card-data"
    data-imagen="${imagen}"
    data-titulo="${titulo}"
    data-descripcion="${descripcion}"
    data-tiempo="${tiempo}"
    data-porciones="${porciones}"
    data-dificultad="${dificultad}"
    data-ingredientes="${ingredientes}"
    data-instrucciones="${instrucciones}"
    data-categoria="${categoria}"
>

    <img src="${imagen}">
    
    <div class="card-content">
        <h3>${titulo}</h3>
    </div>

</div>
`;

                card.addEventListener("click", function () {

                    document.getElementById("modal-img").src = imagen;
                    document.getElementById("modal-title").innerText = titulo;

                    document.getElementById("modal-badges").innerHTML = `
                        <span>⏱ ${tiempo}</span>
                        <span>🍽 ${porciones}</span>
                        <span>⭐ ${dificultad}</span>
                    `;

                    document.getElementById("modal-desc").innerText = descripcion;

                    const ingredientesLista = ingredientes
                        .split(/[\n|]+/)
                        .map(item => `<li>${item.replace("-", "").trim()}</li>`)
                        .join("");

                    document.getElementById("modal-ingredients").innerHTML = `<ul>${ingredientesLista}</ul>`;

                    const pasosLista = instrucciones
                        .split(/[\n|]+/)
                        .map(item => item.trim())
                        .filter(item => item)
                        .map(item => `<li>${item}</li>`)
                        .join("");

                    document.getElementById("modal-steps").innerHTML = `<ul>${pasosLista}</ul>`;

                    configurarBotonPDF();
document.getElementById("recipe-modal").classList.add("active");

                });

                // Mostrar primeras 5 en recientes, pero también mostrar todas en "Todas"
// Agregar a "Recientes" SOLO si es una de las primeras 5
if (index < 5) {
    const clonedCard = card.cloneNode(true);
    clonedCard.classList.add("reciente-clon");
    recentContainer.appendChild(clonedCard);
}
// Agregar a "Todas" siempre
container.appendChild(card);

            });

            autoScroll();

        });

}

function closeModal() {
    document.getElementById("recipe-modal").classList.remove("active");
}


// Scroll categorías (flechas)
function scrollCategories(amount) {
    const container = document.querySelector('.categories');
    container.scrollBy({
        left: amount,
        behavior: 'smooth'
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const closeBtn = document.getElementById("close-modal");
    const modal = document.getElementById("recipe-modal");

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
    });

});

window.addEventListener("click", (e) => {
    const modal = document.getElementById("recipe-modal");
    if (e.target === modal) {
        modal.classList.remove("active");
    }
});

function autoScroll() {

    if (window.autoScrollActivo) return;
    window.autoScrollActivo = true;

    const recent = document.querySelector(".recipes-scroll");

    if (!recent) return;

    if (!recent.dataset.cloned && recent.children.length > 1) {
    const clones = recent.innerHTML;
    recent.innerHTML += clones;
    // Marcar las tarjetas clonadas para no mostrarlas en categorías
    document.querySelectorAll(".recipes-scroll .card").forEach(card => {
        card.classList.add("clonada");
    });
    recent.dataset.cloned = "true";
}

    let speed = 1; // movimiento real (NO tocar más)
let delay = 25; // controla velocidad visual
let isPaused = false;

function scroll() {
    if (!isPaused) {
        recent.scrollLeft += speed;

       if (recent.scrollLeft >= recent.scrollWidth - recent.clientWidth) {
    recent.scrollLeft = 0;
}
    }

    setTimeout(scroll, delay);
}

    // 👇 CLAVE: parar EXACTO al hacer click
    recent.addEventListener("click", () => {
    isPaused = true;

    setTimeout(() => {
        isPaused = false;
    }, 800);
});

    scroll();
}

document.querySelector(".recipes-scroll").addEventListener("click", function(e) {

    const card = e.target.closest(".card-data");
    if (!card) return;

    const imagen = card.dataset.imagen;
    const titulo = card.dataset.titulo;
    const descripcion = card.dataset.descripcion;
    const tiempo = card.dataset.tiempo;
    const porciones = card.dataset.porciones;
    const dificultad = card.dataset.dificultad;
    const ingredientes = card.dataset.ingredientes;
    const instrucciones = card.dataset.instrucciones;

    document.getElementById("modal-img").src = imagen;
    document.getElementById("modal-title").innerText = titulo;

    document.getElementById("modal-badges").innerHTML = `
        <span>⏱ ${tiempo}</span>
        <span>🍽 ${porciones}</span>
        <span>⭐ ${dificultad}</span>
    `;

    document.getElementById("modal-desc").innerText = descripcion;
document.getElementById("modal-time").innerText = tiempo;
document.getElementById("modal-servings").innerText = porciones;
document.getElementById("modal-difficulty").innerText = dificultad;

    const ingredientesLista = ingredientes
        .split(/[\n|]+/)
        .map(item => `<li>${item.replace("-", "").trim()}</li>`)
        .join("");

    document.getElementById("modal-ingredients").innerHTML = `<ul>${ingredientesLista}</ul>`;

    const pasosLista = instrucciones
        .split(/[\n|]+/)
        .map(item => item.trim())
        .filter(item => item)
        .map(item => `<li>${item}</li>`)
        .join("");

    document.getElementById("modal-steps").innerHTML = `<ul>${pasosLista}</ul>`;

    configurarBotonPDF();
document.getElementById("recipe-modal").classList.add("active");

});

cargarRecetas();


window.addEventListener("storage", function(e) {
    if (e.key === "actualizarRecetas") {
        cargarRecetas();
    }
});

document.querySelectorAll(".category-item").forEach(item => {

    item.addEventListener("click", function() {

        const categoria = this.querySelector("span").innerText;

        document.getElementById("titulo-categoria").innerText = categoria;

        const contenedor = document.getElementById("contenedor-categoria");

        // 🔥 CONTENIDO VISUAL (temporal)
   // Limpiar contenedor
contenedor.innerHTML = "";

// Crear zona del título
const tituloZona = document.createElement("div");
tituloZona.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    font-size: 18px;
    color: #555;
    white-space: nowrap;
    margin-bottom: 20px;
`;
tituloZona.innerHTML = `
    <span style="font-size:20px;">${getIconoCategoria(categoria)}</span>
    <span style="
        font-weight:500;
        color:#333;
        background:#f0f7f0;
        padding:4px 10px;
        border-radius:12px;
    ">
        ${getFraseCategoria(categoria)}
    </span>
`;
contenedor.appendChild(tituloZona);


const grid = document.createElement("div");
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
grid.style.gap = "20px";
grid.style.padding = "10px";
grid.style.width = "100%";
grid.style.boxSizing = "border-box";
grid.style.justifyItems = "center";
grid.style.alignItems = "start";

contenedor.appendChild(grid);

// 🔥 AGREGAR RECETAS DE ESA CATEGORÍA
const todas = document.querySelectorAll(".card:not(.reciente-clon)");

todas.forEach(card => {

    const data = card.querySelector(".card-data");
    if (!data) return;

    const cat = data.dataset.categoria;
// Saltar tarjetas que son clones del carrusel (tienen el mismo dataset pero son duplicadas)
const esClon = card.parentElement && card.parentElement.classList.contains("recipes-scroll") && Array.from(card.parentElement.children).indexOf(card) >= 5;
if (esClon) return;

    if (cat === categoria) {

    const nueva = document.createElement("div");

    nueva.style.background = "#fff";
    nueva.style.borderRadius = "12px";
    nueva.style.overflow = "hidden";
    nueva.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    nueva.style.cursor = "pointer";

    nueva.innerHTML = `
    <img src="${data.dataset.imagen}" style="width:100%; height:140px; object-fit:cover;">

    <div style="padding:10px;">
        <h3 style="font-size:14px; margin-bottom:6px;">
            ${data.dataset.titulo}
        </h3>
    </div>
`;

    nueva.addEventListener("click", function (e) {
    e.stopPropagation();  
    
    document.getElementById("modal-img").src = data.dataset.imagen;
    document.getElementById("modal-title").innerText = data.dataset.titulo;

        document.getElementById("modal-badges").innerHTML = `
    <span>⏱ ${data.dataset.tiempo}</span>
    <span>🍽 ${data.dataset.porciones}</span>
    <span>⭐ ${data.dataset.dificultad}</span>
`;
        document.getElementById("modal-desc").innerText = data.dataset.descripcion;

        const ingredientesLista = data.dataset.ingredientes
            .split(/[\n|]+/)
            .map(i => `<li>${i.trim()}</li>`)
            .join("");

        document.getElementById("modal-ingredients").innerHTML = `<ul>${ingredientesLista}</ul>`;

        const pasosLista = data.dataset.instrucciones
            .split(/[\n|]+/)
            .map(i => `<li>${i.trim()}</li>`)
            .join("");

        document.getElementById("modal-steps").innerHTML = `<ul>${pasosLista}</ul>`;

        configurarBotonPDF();
document.getElementById("recipe-modal").classList.add("active");

    });

    grid.appendChild(nueva);
}

}); // ← cierra forEach

document.getElementById("modal-categoria").classList.add("active");

}); // ← cierra addEventListener

}); // ← cierra querySelectorAll
   

function getFraseCategoria(cat){

    const frases = {
        "Fáciles": "Recetas rápidas y sin complicaciones",
        "Postres": "Dulces irresistibles para cada ocasión",
        "Carnes": "Platos jugosos y llenos de sabor",
        "Ensaladas": "Opciones frescas y saludables",
        "Pastas": "Clásicos italianos y más",
        "Bebidas": "Refrescos y bebidas deliciosas",
        "Arroces": "Recetas tradicionales con arroz",
        "Sopas": "Platos calientes y reconfortantes",
        "Mariscos": "Sabores del mar en tu mesa",
        "Comida Cubana": "Lo mejor de la cocina cubana",
        "Desayunos": "Empieza el día con energía",
        "Rápidas": "Listas en pocos minutos"
    };

    return frases[cat] || "Descubre recetas increíbles";
}

function getIconoCategoria(cat){

    const iconos = {
        "Fáciles": "🥗",
        "Postres": "🍰",
        "Carnes": "🍗",
        "Ensaladas": "🥗",
        "Pastas": "🍝",
        "Bebidas": "🍹",
        "Arroces": "🍚",
        "Sopas": "🍲",
        "Mariscos": "🦐",
        "Comida Cubana": "🇨🇺",
        "Desayunos": "🍳",
        "Rápidas": "⚡"
    };

    return iconos[cat] || "🍽️";
}

function cerrarCategoria(){
    document.getElementById("modal-categoria").classList.remove("active");
}

function configurarBotonPDF() {
    const btn = document.getElementById("btn-pdf");
    if (btn) {
        btn.onclick = function() {
            descargarPDF();
        };
    }
}

function descargarPDF() {
    const titulo = document.getElementById("modal-title").innerText;
    const descripcion = document.getElementById("modal-desc").innerText;
    const tiempo = document.getElementById("modal-time").innerText;
    const porciones = document.getElementById("modal-servings").innerText;
    const dificultad = document.getElementById("modal-difficulty").innerText;
    const ingredientes = document.getElementById("modal-ingredients").innerHTML;
    const instrucciones = document.getElementById("modal-steps").innerHTML;

    const ventana = window.open("", "_blank");
    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${titulo} - Receta</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: auto;
                    line-height: 1.6;
                }
                h1 {
                    color: #6bbf59;
                    border-bottom: 2px solid #6bbf59;
                    padding-bottom: 10px;
                }
                h2 {
                    color: #6bbf59;
                    margin-top: 25px;
                }
                .info {
                    background: #f5f5f5;
                    padding: 10px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                ul, ol {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                li {
                    margin: 5px 0;
                }
                .footer {
                    margin-top: 50px;
                    font-size: 12px;
                    color: #999;
                    text-align: center;
                }
            </style>
        </head>
        <body>

<div style="text-align: center; margin-bottom: 25px;">
    <div style="
        background: linear-gradient(135deg, #6bbf59, #4a8f3a);
        color: white;
        font-size: 32px;
        font-weight: bold;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-family: 'Arial', sans-serif;
    ">
        ZT
    </div>
    <div style="margin-top: 10px; font-size: 18px; color: #6bbf59; font-weight: bold; letter-spacing: 1px;">
        Zona Total Recetas
    </div>
    <div style="margin-top: 5px; font-size: 12px; color: #999;">
        ─── • ✦ • ───
    </div>
</div>
            <h1>${titulo}</h1>
            <p>${descripcion}</p>
            
            <div class="info">
                <strong>⏱ Tiempo:</strong> ${tiempo}<br>
                <strong>🍽 Porciones:</strong> ${porciones}<br>
                <strong>⭐ Dificultad:</strong> ${dificultad}
            </div>
            
            <h2>📝 Ingredientes</h2>
            ${ingredientes}
            
            <h2>👨‍🍳 Preparación</h2>
            ${instrucciones}
            
            <div class="footer">
                Receta generada desde ZT Recetas
            </div>
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

// ================= BUSCADOR =================
function buscarRecetas() {
    const textoBusqueda = document.querySelector(".search").value.toLowerCase().trim();
    const todasLasCards = document.querySelectorAll(".card");
    
    if (textoBusqueda === "") {
        // Si no hay búsqueda, mostrar todas las recetas
        todasLasCards.forEach(card => {
            card.style.display = "";
        });
        return;
    }
    
    // Filtrar recetas
    todasLasCards.forEach(card => {
        const titulo = card.querySelector(".card-data").dataset.titulo.toLowerCase();
        if (titulo.includes(textoBusqueda)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

// Agregar evento al buscador
document.querySelector(".search").addEventListener("input", buscarRecetas);
