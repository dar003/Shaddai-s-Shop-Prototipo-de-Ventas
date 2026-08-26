// ------------------------------------------------------------
        // 1. LISTA DE PRODUCTOS (con ratings persistentes)
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        // 1. DATOS DE PRODUCTOS
        // Se cargan desde data/productos.json para mantener
        // separados los datos de la lógica de la aplicación.
        // ------------------------------------------------------------
        let productosData = [];
;

        // ------------------------------------------------------------
        // 2. PERSISTENCIA DE POPULARIDAD (localStorage)
        // ------------------------------------------------------------
        const POPULARIDAD_KEY = 'shaddai_popularidad';

        function guardarPopularidad() {
            const estado = {};
            productosData.forEach(p => {
                estado[p.id] = {
                    pedidos: p.pedidos || 0,
                    rating: p.rating || 0
                };
            });
            try {
                localStorage.setItem(POPULARIDAD_KEY, JSON.stringify(estado));
            } catch (e) { /* ignore */ }
        }

        function cargarPopularidad() {
            try {
                const raw = localStorage.getItem(POPULARIDAD_KEY);
                if (!raw) return;
                const estado = JSON.parse(raw);
                productosData.forEach(p => {
                    const data = estado[p.id];
                    if (data) {
                        p.pedidos = data.pedidos || 0;
                        p.rating = data.rating || 0;
                    }
                });
            } catch (e) { /* ignore */ }
        }

        // ------------------------------------------------------------
        // 3. ESTADO Y REFERENCIAS DOM
        // ------------------------------------------------------------
        let carrito = [];
        let filtroCategoria = 'Todos';
        let filtroPrecioMax = 100;
        let filtroBusqueda = '';
        let filtroEtiquetas = [];
        let filtroOrden = 'default';
        let filtroUnidades = null;
        let filterOptionsOpen = false;
        let mostrarListaPrecios = false;

        const RATE_STORAGE_KEY = 'chorizos_tasa_del_dia';
        const DEFAULT_RATE = 293;
        let tasaDelDia = cargarTasaDelDia();

        const productsGrid = document.getElementById('productsGrid');
        const priceListContainer = document.getElementById('priceListContainer');
        const cartList = document.getElementById('cartList');
        const cartTotal = document.getElementById('cartTotal');
        const cartBadgeFloat = document.getElementById('cartBadgeFloat');
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const sidebarClose = document.getElementById('sidebarClose');
        const searchInput = document.getElementById('searchInput');
        const categoryList = document.getElementById('categoryList');
        const priceSlider = document.getElementById('priceSlider');
        const priceDisplay = document.getElementById('priceDisplay');
        const tagList = document.getElementById('tagList');
        const imageModal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');

        const cartOverlay = document.getElementById('cartOverlay');
        const cartPanel = document.getElementById('cartPanel');
        const cartPanelClose = document.getElementById('cartPanelClose');
        const cartToggle = document.getElementById('cartToggle');
        const cartItemsList = document.getElementById('cartItemsList');
        const cartPanelTotal = document.getElementById('cartPanelTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        const headerTitle = document.getElementById('headerTitle');
        const headerSearch = document.getElementById('headerSearch');
        const headerSearchInput = document.getElementById('headerSearchInput');
        const searchToggle = document.getElementById('searchToggle');
        const closeHeaderSearch = document.getElementById('closeHeaderSearch');

        const carouselTrack = document.getElementById('carouselTrack');

        const filterToggleBtn = document.getElementById('filterToggleBtn');
        const filterOptionsEl = document.getElementById('filterOptions');
        const filterUnitsGroup = document.getElementById('filterUnitsGroup');

        const sidebarRateInput = document.getElementById('sidebarRateInput');
        const sidebarRateSave = document.getElementById('sidebarRateSave');
        const sidebarRateDisplay = document.getElementById('sidebarRateDisplay');
        const floatingRateBtn = document.getElementById('floatingRateBtn');
        const floatingRateValue = document.getElementById('floatingRateValue');
        const rateModal = document.getElementById('rateModal');
        const rateModalInput = document.getElementById('rateModalInput');
        const rateModalCancel = document.getElementById('rateModalCancel');
        const rateModalSave = document.getElementById('rateModalSave');

        const priceListBtn = document.getElementById('priceListBtn');

        // ------------------------------------------------------------
        // 4. FUNCIONES DE TASA
        // ------------------------------------------------------------
        function cargarTasaDelDia() {
            try {
                const guardada = parseFloat(localStorage.getItem(RATE_STORAGE_KEY));
                return Number.isFinite(guardada) && guardada > 0 ? guardada : DEFAULT_RATE;
            } catch (e) {
                return DEFAULT_RATE;
            }
        }

        function formatoVES(valor) {
            return Number(valor || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function formatoTasa(valor) {
            return Number(valor || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function actualizarVisualizacionTasa() {
            const texto = `1 USD = ${formatoTasa(tasaDelDia)} VES`;
            sidebarRateInput.value = tasaDelDia;
            sidebarRateDisplay.textContent = texto;
            const tasaEntera = Math.floor(tasaDelDia);
            floatingRateValue.textContent = `${tasaEntera} VES`;
            if (rateModalInput) rateModalInput.value = tasaDelDia;
        }

        function guardarNuevaTasa(valor) {
            const nueva = parseFloat(String(valor).replace(',', '.'));
            if (!Number.isFinite(nueva) || nueva <= 0) {
                alert('Ingresa una tasa válida mayor que 0.');
                return false;
            }
            tasaDelDia = nueva;
            try { localStorage.setItem(RATE_STORAGE_KEY, String(nueva)); } catch (e) {}
            actualizarVisualizacionTasa();
            renderizarCarritoResumen();
            renderizarCartPanel();
            return true;
        }

        function abrirRateModal() {
            rateModalInput.value = tasaDelDia;
            rateModal.classList.add('active');
            actualizarVisibilidadBotonTasa();
            setTimeout(() => rateModalInput.focus(), 0);
        }

        function cerrarRateModal() {
            rateModal.classList.remove('active');
            actualizarVisibilidadBotonTasa();
        }

        let floatingPointerId = null;
        let floatingStartX = 0;
        let floatingStartY = 0;
        let floatingOriginRight = 18;
        let floatingOriginBottom = 18;
        let floatingDragged = false;

        function actualizarVisibilidadBotonTasa() {
            const ocultar = sidebar.classList.contains('open') || cartPanel.classList.contains('open') || rateModal.classList.contains('active');
            floatingRateBtn.classList.toggle('hidden', ocultar);
        }

        // ------------------------------------------------------------
        // 5. FUNCIONES DE CARRITO Y POPULARIDAD
        // ------------------------------------------------------------
        function getCantidadEnCarrito(id) {
            const item = carrito.find(c => c.id === id);
            return item ? item.cantidad : 0;
        }

        function incrementarPopularidad(producto) {
            if (!producto) return;
            producto.pedidos = (producto.pedidos || 0) + 1;
            let nuevoRating = (producto.rating || 0) + 0.1;
            if (nuevoRating >= 5.0) {
                producto.rating = 0;
            } else {
                producto.rating = nuevoRating;
            }
            guardarPopularidad();
        }

        function decrementarPopularidad(producto) {
            if (!producto) return;
            producto.pedidos = Math.max(0, (producto.pedidos || 0) - 1);
            if (producto.rating > 0) {
                producto.rating = Math.max(0, (producto.rating || 0) - 0.1);
            }
            guardarPopularidad();
        }

        function addOneToCart(id) {
            const existing = carrito.find(c => c.id === id);
            if (existing) {
                existing.cantidad += 1;
            } else {
                carrito.push({ id, cantidad: 1 });
            }
            const producto = productosData.find(p => p.id === id);
            if (producto) {
                incrementarPopularidad(producto);
            }
            renderizarTodo();
        }

        function removeOneFromCart(id) {
            const existing = carrito.find(c => c.id === id);
            if (existing) {
                if (existing.cantidad > 1) {
                    existing.cantidad -= 1;
                } else {
                    carrito = carrito.filter(c => c.id !== id);
                }
                const producto = productosData.find(p => p.id === id);
                if (producto) {
                    decrementarPopularidad(producto);
                }
                renderizarTodo();
            }
        }

        function removeFromCart(id) {
            const existing = carrito.find(c => c.id === id);
            if (existing) {
                const cantidad = existing.cantidad;
                carrito = carrito.filter(c => c.id !== id);
                const producto = productosData.find(p => p.id === id);
                if (producto) {
                    for (let i = 0; i < cantidad; i++) {
                        decrementarPopularidad(producto);
                    }
                }
                renderizarTodo();
            }
        }

        function getTotalItems() {
            return carrito.reduce((acc, item) => acc + item.cantidad, 0);
        }

        function getTotalPrice() {
            let total = 0;
            carrito.forEach(item => {
                const producto = productosData.find(p => p.id === item.id);
                if (producto) {
                    total += producto.precio * item.cantidad;
                }
            });
            return total;
        }

        // ------------------------------------------------------------
        // 6. RENDERIZADO DEL CARRUSEL
        // ------------------------------------------------------------
        function renderCarousel() {
            const topProducts = [...productosData]
                .filter(p => (p.pedidos || 0) > 0)
                .sort((a, b) => (b.pedidos || 0) - (a.pedidos || 0))
                .slice(0, 8);

            const productosMostrar = topProducts.length > 0 ? topProducts : productosData.slice(0, 8);

            let itemsHTML = '';
            const doubled = [...productosMostrar, ...productosMostrar];
            doubled.forEach(p => {
                const rating = Math.min(5, Math.max(0, p.rating || 0));
                const fullStars = Math.floor(rating);
                const partial = rating - fullStars;
                let starsHTML = '';
                for (let i = 0; i < 5; i++) {
                    if (i < fullStars) {
                        starsHTML += `<span class="star filled">★</span>`;
                    } else if (i === fullStars && partial > 0) {
                        const percent = Math.round(partial * 100);
                        starsHTML += `<span class="star partial" style="--fill: ${percent}%;">★</span>`;
                    } else {
                        starsHTML += `<span class="star">★</span>`;
                    }
                }
                itemsHTML += `
                        <div class="carousel-item">
                            <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
                            <div class="item-name">${p.nombre.toUpperCase()}</div>
                            <div class="stars-container">${starsHTML}</div>
                            <div class="rating-number">${rating.toFixed(1)}</div>
                        </div>
                    `;
            });

            carouselTrack.innerHTML = itemsHTML;
        }

        // ------------------------------------------------------------
        // 7. RENDERIZADO DE PRODUCTOS (cuadrícula o lista)
        // ------------------------------------------------------------
        function obtenerProductosFiltrados() {
            let filtrados = productosData.filter(p => {
                const coincideBusqueda = p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase());
                const coincideCategoria = filtroCategoria === 'Todos' || p.categoria === filtroCategoria;
                const coincidePrecio = p.precio <= filtroPrecioMax;
                const coincideEtiquetas = filtroEtiquetas.length === 0 ||
                    filtroEtiquetas.some(et => p.etiquetas.includes(et));
                const coincideUnidades = filtroUnidades === null || p.unidades === filtroUnidades;
                return coincideBusqueda && coincideCategoria && coincidePrecio && coincideEtiquetas && coincideUnidades;
            });

            switch (filtroOrden) {
                case 'price-asc':
                    filtrados.sort((a, b) => a.precio - b.precio);
                    break;
                case 'price-desc':
                    filtrados.sort((a, b) => b.precio - a.precio);
                    break;
                case 'best-offers':
                    filtrados.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                default:
                    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    break;
            }
            return filtrados;
        }

        function renderizarProductos() {
            const filtrados = obtenerProductosFiltrados();

            if (!mostrarListaPrecios) {
                // Vista cuadrícula
                productsGrid.style.display = 'grid';
                priceListContainer.style.display = 'none';
                priceListContainer.classList.remove('active');

                if (filtrados.length === 0) {
                    productsGrid.innerHTML = `<div class="no-results">No hay productos que coincidan con los filtros.</div>`;
                    return;
                }

                let html = '';
                filtrados.forEach(p => {
                    const enCarrito = getCantidadEnCarrito(p.id);
                    const nombreDisplay = p.nombre.toUpperCase();
                    const gramosDisplay = `${p.unidades} gramos`;

                    let botonesHTML = '';
                    if (enCarrito === 0) {
                        botonesHTML = `
                            <button class="add-to-cart" data-id="${p.id}" data-action="add-first">Añadir al carrito</button>
                        `;
                    } else {
                        botonesHTML = `
                            <div class="quantity-control">
                                <button class="qty-btn" data-id="${p.id}" data-action="decrease">−</button>
                                <span class="qty-display">${enCarrito}</span>
                                <button class="qty-btn" data-id="${p.id}" data-action="increase">+</button>
                            </div>
                        `;
                    }

                    const badgeHTML = enCarrito > 0 ? `<div class="cart-badge">${enCarrito}</div>` : '';

                    html += `
                        <div class="product-card ${enCarrito > 0 ? 'in-cart' : ''}" data-id="${p.id}" data-image="${p.imagen}">
                            ${badgeHTML}
                            <div class="product-image">
                                <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
                            </div>
                            <div class="product-name">${nombreDisplay}</div>
                            <div class="product-units">${gramosDisplay}</div>
                            <div class="product-price">$${p.precio.toFixed(2)}</div>
                            ${botonesHTML}
                        </div>
                    `;
                });
                productsGrid.innerHTML = html;
                return;
            }

            // Vista lista de precios
            productsGrid.style.display = 'none';
            priceListContainer.style.display = 'flex';
            priceListContainer.classList.add('active');

            // Cabecera con botón para volver a la cuadrícula
            let headerHTML = `
                <div class="price-list-header">
                    <h2>📋 Lista de precios</h2>
                    <button class="back-to-grid-btn" id="backToGridBtn">← Volver a productos</button>
                </div>
            `;

            if (filtrados.length === 0) {
                priceListContainer.innerHTML = headerHTML + `<div class="no-results" style="grid-column:auto;">No hay productos que coincidan con los filtros.</div>`;
                return;
            }

            let itemsHTML = '';
            filtrados.forEach(p => {
                const nombreDisplay = p.nombre.toUpperCase();
                const gramosDisplay = `${p.unidades} g`;
                const precioVES = p.precio * tasaDelDia;
                itemsHTML += `
                    <div class="price-list-item">
                        <div class="price-list-thumb">
                            <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
                        </div>
                        <div class="price-list-info">
                            <div class="price-list-name">${nombreDisplay}</div>
                            <div class="price-list-meta">
                                <span>${p.categoria}</span>
                                <span>${gramosDisplay}</span>
                            </div>
                        </div>
                        <div class="price-list-price">
                            <span class="usd">$${p.precio.toFixed(2)}</span>
                            <span class="ves">≈ Bs. ${formatoVES(precioVES)}</span>
                        </div>
                    </div>
                `;
            });
            priceListContainer.innerHTML = headerHTML + itemsHTML;

            // Asignar evento al botón "Volver a productos"
            const backBtn = document.getElementById('backToGridBtn');
            if (backBtn) {
                backBtn.addEventListener('click', function() {
                    mostrarListaPrecios = false;
                    renderizarTodo();
                });
            }
        }

        // ------------------------------------------------------------
        // EVENTOS DE PRODUCTOS (delegación)
        // ------------------------------------------------------------
        productsGrid.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (target) {
                e.stopPropagation();
                const id = parseInt(target.dataset.id);
                const action = target.dataset.action;

                if (action === 'add-first') {
                    addOneToCart(id);
                    target.classList.add('pop-animation');
                    setTimeout(() => target.classList.remove('pop-animation'), 300);
                    return;
                }

                if (action === 'increase') {
                    addOneToCart(id);
                    target.classList.add('pop-animation');
                    setTimeout(() => target.classList.remove('pop-animation'), 300);
                    return;
                }

                if (action === 'decrease') {
                    removeOneFromCart(id);
                    return;
                }
            }

            const card = e.target.closest('.product-card');
            if (card && !e.target.closest('button')) {
                const imgSrc = card.dataset.image;
                if (imgSrc) {
                    modalImage.src = imgSrc;
                    imageModal.classList.add('active');
                }
            }
        });

        imageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (imageModal.classList.contains('active')) {
                    imageModal.classList.remove('active');
                }
                cerrarHeaderSearch();
                cerrarCartPanel();
                cerrarSidebar();
            }
        });

        // ------------------------------------------------------------
        // 8. RENDERIZADO DE CARRITO (resumen y panel)
        // ------------------------------------------------------------
        function renderizarCarritoResumen() {
            if (carrito.length === 0) {
                cartList.innerHTML = `<li class="cart-empty">No hay productos en el carrito.</li>`;
                cartTotal.innerHTML = 'Total: $0.00<span class="total-secondary">≈ Bs. 0.00 VES</span><span class="total-rate">Tasa: 1 USD = ' + formatoTasa(tasaDelDia) + ' VES</span>';
                return;
            }

            let html = '';
            let total = 0;
            carrito.forEach(item => {
                const producto = productosData.find(p => p.id === item.id);
                if (!producto) return;
                const subtotal = producto.precio * item.cantidad;
                total += subtotal;
                const nombreDisplay = producto.nombre.toUpperCase();
                html += `
                        <li>
                            <div class="cart-item-info">
                                <span class="cart-item-name">${nombreDisplay} × ${item.cantidad}</span>
                                <span class="cart-item-price">$${subtotal.toFixed(2)}</span>
                            </div>
                            <button class="cart-remove-btn" data-id="${item.id}">✕</button>
                        </li>
                    `;
            });
            cartList.innerHTML = html;
            cartTotal.innerHTML = `Total: $${total.toFixed(2)}<span class="total-secondary">≈ Bs. ${formatoVES(total * tasaDelDia)} VES</span><span class="total-rate">Tasa: 1 USD = ${formatoTasa(tasaDelDia)} VES</span>`;

            document.querySelectorAll('.cart-remove-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = parseInt(this.dataset.id);
                    removeFromCart(id);
                });
            });
        }

        function renderizarCartPanel() {
            if (carrito.length === 0) {
                cartItemsList.innerHTML = `<li class="empty-cart-msg">No hay productos en el carrito.</li>`;
                cartPanelTotal.innerHTML = 'Total: $0.00<span class="total-secondary">≈ Bs. 0.00 VES</span><span class="total-rate">Tasa: 1 USD = ' + formatoTasa(tasaDelDia) + ' VES</span>';
                return;
            }

            let html = '';
            let total = 0;
            carrito.forEach(item => {
                const producto = productosData.find(p => p.id === item.id);
                if (!producto) return;
                const subtotal = producto.precio * item.cantidad;
                total += subtotal;
                const nombreDisplay = producto.nombre.toUpperCase();
                html += `
                        <li>
                            <div class="cart-item-detail">
                                <span class="cart-item-name">${nombreDisplay}</span>
                                <span class="cart-item-meta">${producto.unidades} g · $${producto.precio.toFixed(2)} c/u</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <div class="cart-item-qty-price">
                                    <div class="qty">× ${item.cantidad}</div>
                                    <div class="subtotal">$${subtotal.toFixed(2)}</div>
                                </div>
                                <button class="cart-item-remove" data-id="${item.id}">✕</button>
                            </div>
                        </li>
                    `;
            });
            cartItemsList.innerHTML = html;
            cartPanelTotal.innerHTML = `Total: $${total.toFixed(2)}<span class="total-secondary">≈ Bs. ${formatoVES(total * tasaDelDia)} VES</span><span class="total-rate">Tasa: 1 USD = ${formatoTasa(tasaDelDia)} VES</span>`;

            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = parseInt(this.dataset.id);
                    removeFromCart(id);
                });
            });
        }

        function actualizarInputsBusqueda() {
            if (searchInput.value !== filtroBusqueda) {
                searchInput.value = filtroBusqueda;
            }
            if (headerSearchInput.value !== filtroBusqueda) {
                headerSearchInput.value = filtroBusqueda;
            }
        }

        function actualizarOpcionesOrden() {
            document.querySelectorAll('.filter-option').forEach(el => {
                const sortVal = el.dataset.sort;
                el.classList.toggle('active', sortVal === filtroOrden);
            });
            document.querySelectorAll('.filter-unit-btn').forEach(btn => {
                const val = btn.dataset.units;
                if (val === 'all') {
                    btn.classList.toggle('active', filtroUnidades === null);
                } else {
                    btn.classList.toggle('active', filtroUnidades === parseInt(val));
                }
            });
        }

        function renderizarTodo() {
            renderizarProductos();
            renderizarCarritoResumen();
            renderizarCartPanel();
            actualizarInputsBusqueda();
            renderCarousel();
            actualizarOpcionesOrden();

            cartBadgeFloat.textContent = getTotalItems();

            document.querySelectorAll('.category-item').forEach(el => {
                const cat = el.dataset.categoria;
                el.classList.toggle('active', cat === filtroCategoria);
            });
            document.querySelectorAll('.tag-item').forEach(el => {
                const tag = el.dataset.tag;
                el.classList.toggle('active', filtroEtiquetas.includes(tag));
            });

            priceListBtn.textContent = mostrarListaPrecios ? '📋 Ocultar lista' : '📋 Ver lista de precios';
            priceListBtn.classList.toggle('active', mostrarListaPrecios);
        }

        // ------------------------------------------------------------
        // 9. FILTROS
        // ------------------------------------------------------------
        function actualizarFiltros() {
            renderizarTodo();
        }

        function inicializarFiltros() {
            const categorias = ['Todos', ...new Set(productosData.map(p => p.categoria))];
            categoryList.innerHTML = categorias.map(cat =>
                `<span class="category-item ${cat === 'Todos' ? 'active' : ''}" data-categoria="${cat}">${cat}</span>`
            ).join('');

            document.querySelectorAll('.category-item').forEach(el => {
                el.addEventListener('click', function() {
                    filtroCategoria = this.dataset.categoria;
                    actualizarFiltros();
                });
            });

            const todasEtiquetas = new Set();
            productosData.forEach(p => p.etiquetas.forEach(e => todasEtiquetas.add(e)));
            tagList.innerHTML = Array.from(todasEtiquetas).map(tag =>
                `<span class="tag-item" data-tag="${tag}">${tag}</span>`
            ).join('');

            document.querySelectorAll('.tag-item').forEach(el => {
                el.addEventListener('click', function() {
                    const tag = this.dataset.tag;
                    const idx = filtroEtiquetas.indexOf(tag);
                    if (idx > -1) {
                        filtroEtiquetas.splice(idx, 1);
                    } else {
                        filtroEtiquetas.push(tag);
                    }
                    actualizarFiltros();
                });
            });

            priceSlider.addEventListener('input', function() {
                filtroPrecioMax = parseFloat(this.value);
                priceDisplay.textContent = filtroPrecioMax.toFixed(2);
                actualizarFiltros();
            });
            priceDisplay.textContent = priceSlider.value;

            searchInput.addEventListener('input', function() {
                filtroBusqueda = this.value.trim();
                actualizarFiltros();
            });

            headerSearchInput.addEventListener('input', function() {
                filtroBusqueda = this.value.trim();
                actualizarFiltros();
            });

            filterToggleBtn.addEventListener('click', function() {
                filterOptionsOpen = !filterOptionsOpen;
                filterOptionsEl.classList.toggle('open', filterOptionsOpen);
                this.textContent = filterOptionsOpen ? 'Filtrar −' : 'Filtrar +';
            });

            document.querySelectorAll('.filter-option').forEach(el => {
                el.addEventListener('click', function() {
                    const sortVal = this.dataset.sort;
                    if (filtroOrden === sortVal) {
                        filtroOrden = 'default';
                    } else {
                        filtroOrden = sortVal;
                    }
                    actualizarFiltros();
                    filterOptionsOpen = false;
                    filterOptionsEl.classList.remove('open');
                    filterToggleBtn.textContent = 'Filtrar +';
                });
            });

            const unidadesUnicas = [...new Set(productosData.map(p => p.unidades))].sort((a, b) => a - b);
            let unitsHTML = `<button class="filter-unit-btn active" data-units="all">Todos</button>`;
            unidadesUnicas.forEach(u => {
                unitsHTML += `<button class="filter-unit-btn" data-units="${u}">${u} g</button>`;
            });
            filterUnitsGroup.innerHTML = unitsHTML;

            filterUnitsGroup.addEventListener('click', function(e) {
                const btn = e.target.closest('.filter-unit-btn');
                if (!btn) return;
                const val = btn.dataset.units;
                if (val === 'all') {
                    filtroUnidades = null;
                } else {
                    filtroUnidades = parseInt(val);
                }
                actualizarFiltros();
                filterOptionsOpen = false;
                filterOptionsEl.classList.remove('open');
                filterToggleBtn.textContent = 'Filtrar +';
            });
        }

        // ------------------------------------------------------------
        // 10. HEADER SEARCH
        // ------------------------------------------------------------
        function abrirHeaderSearch() {
            headerTitle.classList.add('hidden');
            headerSearch.classList.add('active');
            headerSearchInput.value = filtroBusqueda;
            headerSearchInput.focus();
            searchToggle.style.display = 'none';
        }

        function cerrarHeaderSearch() {
            headerTitle.classList.remove('hidden');
            headerSearch.classList.remove('active');
            searchToggle.style.display = 'flex';
        }

        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirHeaderSearch();
        });

        closeHeaderSearch.addEventListener('click', function(e) {
            e.stopPropagation();
            cerrarHeaderSearch();
        });

        // ------------------------------------------------------------
        // 11. SIDEBAR
        // ------------------------------------------------------------
        function abrirSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            actualizarVisibilidadBotonTasa();
        }

        function cerrarSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            actualizarVisibilidadBotonTasa();
        }

        menuToggle.addEventListener('click', abrirSidebar);
        sidebarClose.addEventListener('click', cerrarSidebar);
        overlay.addEventListener('click', cerrarSidebar);

        // ------------------------------------------------------------
        // 12. CART PANEL + CHECKOUT
        // ------------------------------------------------------------
        function abrirCartPanel() {
            cartOverlay.classList.add('active');
            cartPanel.classList.add('open');
            document.body.style.overflow = 'hidden';
            renderizarCartPanel();
            actualizarVisibilidadBotonTasa();
        }

        function cerrarCartPanel() {
            cartOverlay.classList.remove('active');
            cartPanel.classList.remove('open');
            document.body.style.overflow = '';
            actualizarVisibilidadBotonTasa();
        }

        cartToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirCartPanel();
        });

        cartPanelClose.addEventListener('click', cerrarCartPanel);
        cartOverlay.addEventListener('click', cerrarCartPanel);

        function vaciarCarritoConfirmado() {
            carrito = [];
            renderizarTodo();
            if (cartPanel.classList.contains('open')) {
                cerrarCartPanel();
            }
        }

        checkoutBtn.addEventListener('click', function() {
            if (carrito.length === 0) {
                alert('El carrito está vacío.');
                return;
            }

            const pedidoNum = String(Math.floor(Math.random() * 9999999)).padStart(7, '0');
            let productosTexto = '';
            let total = 0;
            carrito.forEach(item => {
                const producto = productosData.find(p => p.id === item.id);
                if (producto) {
                    const subtotal = producto.precio * item.cantidad;
                    total += subtotal;
                    const nombre = producto.nombre.toUpperCase();
                    const subtotalVES = subtotal * tasaDelDia;
                    productosTexto += `- ${nombre} × ${item.cantidad} = $${subtotal.toFixed(2)} (Bs. ${formatoVES(subtotalVES)})\n`;
                }
            });

            const totalVES = total * tasaDelDia;

            const banco = 'Provincial — 0108';
            const ci = '5806915';
            const telefono = '+58 412 0780889';

            let mensaje = `📄 *Recibo de Compra*\n\n`;
            mensaje += `Pedido #${pedidoNum}\n`;
            mensaje += `Productos:\n${productosTexto}`;
            mensaje += `\n*Total a pagar: $${total.toFixed(2)}*\n`;
            mensaje += `*Total en VES: Bs. ${formatoVES(totalVES)}* (tasa: 1 USD = ${formatoTasa(tasaDelDia)} VES)\n\n`;
            mensaje += `✅ Datos de pago móvil:\n`;
            mensaje += `Banco: ${banco}\n`;
            mensaje += `CI: ${ci}\n`;
            mensaje += `Teléfono: ${telefono}\n\n`;
            mensaje += `📌 *Nota:* Una vez realizado el pago, por favor comparte el comprobante para confirmar tu transacción.\n\n`;
            mensaje += `Gracias por tu compra.`;

            const mensajeCodificado = encodeURIComponent(mensaje);

            vaciarCarritoConfirmado();

            window.location.href = `whatsapp://send?text=${mensajeCodificado}`;
            setTimeout(() => {
                if (!document.hidden) {
                    window.location.href = `https://api.whatsapp.com/send?text=${mensajeCodificado}`;
                }
            }, 900);
        });

        // ------------------------------------------------------------
        // 13. BOTÓN LISTA DE PRECIOS (sidebar)
        // ------------------------------------------------------------
        priceListBtn.addEventListener('click', function() {
            mostrarListaPrecios = !mostrarListaPrecios;
            renderizarTodo();
            if (sidebar.classList.contains('open')) {
                cerrarSidebar();
            }
        });

        // ------------------------------------------------------------
        // 14. TASA DEL DÍA (arrastre y modal)
        // ------------------------------------------------------------
        floatingRateBtn.addEventListener('pointerdown', function(e) {
            floatingPointerId = e.pointerId;
            floatingRateBtn.setPointerCapture(e.pointerId);
            floatingStartX = e.clientX;
            floatingStartY = e.clientY;
            floatingOriginRight = parseFloat(getComputedStyle(floatingRateBtn).right) || 18;
            floatingOriginBottom = parseFloat(getComputedStyle(floatingRateBtn).bottom) || 18;
            floatingDragged = false;
            e.preventDefault();
        });

        floatingRateBtn.addEventListener('pointermove', function(e) {
            if (floatingPointerId !== e.pointerId) return;
            const dx = e.clientX - floatingStartX;
            const dy = e.clientY - floatingStartY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) floatingDragged = true;
            if (!floatingDragged) return;
            const maxRight = Math.max(8, window.innerWidth - floatingRateBtn.offsetWidth - 8);
            const maxBottom = Math.max(8, window.innerHeight - floatingRateBtn.offsetHeight - 8);
            floatingRateBtn.style.right = `${Math.min(maxRight, Math.max(8, floatingOriginRight - dx))}px`;
            floatingRateBtn.style.bottom = `${Math.min(maxBottom, Math.max(8, floatingOriginBottom - dy))}px`;
        });

        floatingRateBtn.addEventListener('pointerup', function(e) {
            if (floatingPointerId !== e.pointerId) return;
            floatingRateBtn.releasePointerCapture(e.pointerId);
            floatingPointerId = null;
        });

        floatingRateBtn.addEventListener('pointercancel', function() {
            floatingPointerId = null;
        });

        floatingRateBtn.addEventListener('click', function(e) {
            if (floatingDragged) {
                floatingDragged = false;
                return;
            }
            abrirRateModal();
        });

        sidebarRateSave.addEventListener('click', () => guardarNuevaTasa(sidebarRateInput.value));
        sidebarRateInput.addEventListener('keydown', e => { if (e.key === 'Enter') guardarNuevaTasa(sidebarRateInput.value); });
        rateModalCancel.addEventListener('click', cerrarRateModal);
        rateModalSave.addEventListener('click', () => { if (guardarNuevaTasa(rateModalInput.value)) cerrarRateModal(); });
        rateModalInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') rateModalSave.click();
            if (e.key === 'Escape') cerrarRateModal();
        });
        rateModal.addEventListener('click', e => { if (e.target === rateModal) cerrarRateModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarRateModal(); });

        window.addEventListener('resize', actualizarVisibilidadBotonTasa);

        // ------------------------------------------------------------
        // 15. INICIO
        // ------------------------------------------------------------
        function init() {
            cargarPopularidad();
            inicializarFiltros();
            actualizarVisualizacionTasa();
            renderizarTodo();
            actualizarVisibilidadBotonTasa();
            mostrarListaPrecios = false;
            priceListContainer.style.display = 'none';
            priceListContainer.classList.remove('active');
            productsGrid.style.display = 'grid';
            renderizarTodo();
        }

        async function cargarProductos() {
            try {
                const response = await fetch('./data/productos.json', { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error(`No se pudo cargar productos.json (${response.status})`);
                }

                const productos = await response.json();

                if (!Array.isArray(productos)) {
                    throw new Error('El archivo productos.json no contiene una lista válida de productos.');
                }

                productosData = productos;
                init();
            } catch (error) {
                console.error('Error cargando los productos:', error);

                const productsGrid = document.getElementById('productsGrid');
                if (productsGrid) {
                    productsGrid.innerHTML = `
                        <div class="no-results" style="grid-column:1 / -1;">
                            <strong>No se pudieron cargar los productos.</strong><br>
                            Verifica que <code>data/productos.json</code> exista y que estés ejecutando el proyecto desde un servidor local.
                        </div>
                    `;
                }
            }
        }

        cargarProductos();
