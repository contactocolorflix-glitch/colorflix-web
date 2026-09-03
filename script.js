/* Colorflix: contenido editable de la galería.
   Para agregar un proyecto, duplica un objeto con image, title, description y alt.
   En producción, este arreglo puede reemplazarse por una URL de JSON de Cloudinary,
   Airtable o Sanity sin modificar la maquetación. */
const PROJECTS = [
  { image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", title: "Casa Ñuñoa", description: "Interior · Verde salvia", alt: "Living luminoso pintado en verde salvia" },
  { image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80", title: "Depto Providencia", description: "Interior · Blanco cálido", alt: "Cocina moderna con paredes blancas" },
  { image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80", title: "Casa La Reina", description: "Interior · Terracota suave", alt: "Dormitorio con pared terracota" },
  { image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80", title: "Oficina Vitacura", description: "Comercial · Beige natural", alt: "Oficina cálida recién pintada" }
];

const WHATSAPP = "56956079469";
const palettes = {
  sipa: [{ name: "Blanco invierno", hex: "#F5F5F0" }, { name: "Gris suave", hex: "#D3D3D3" }, { name: "Azul sereno", hex: "#A8C5D4" }, { name: "Verde menta", hex: "#C8E6C9" }, { name: "Beige natural", hex: "#E8D5C4" }, { name: "Gris urbano", hex: "#8A8A8A" }, { name: "Rojo suave", hex: "#C47A7A" }, { name: "Azul marino", hex: "#2C3E50" }],
  ceresita: [{ name: "Blanco nácar", hex: "#F8F4E8" }, { name: "Marfil oriental", hex: "#F0E6D2" }, { name: "Azul mediterráneo", hex: "#5B8FA8" }, { name: "Verde musgo", hex: "#6B8E6B" }, { name: "Ocre coral", hex: "#D4A574" }, { name: "Gris piedra", hex: "#9E9E9E" }, { name: "Rojo colonial", hex: "#A0522D" }, { name: "Azul petróleo", hex: "#1A3A4A" }]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let visibleProjects = 3;

function renderGallery() {
  $("#gallery").innerHTML = PROJECTS.slice(0, visibleProjects).map((project) => `
    <article class="gallery-card"><img src="${project.image}" alt="${project.alt}" loading="lazy"><div class="gallery-caption"><strong>${project.title}</strong><small>${project.description}</small></div></article>
  `).join("");
  $("#load-more").hidden = visibleProjects >= PROJECTS.length;
}

function setupNavigation() {
  $(".menu-toggle").addEventListener("click", () => {
    const open = $(".main-nav").classList.toggle("open");
    $(".menu-toggle").setAttribute("aria-expanded", String(open));
  });
  $$(".nav-link").forEach((link) => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
  const sections = $$("main section[id]");
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) $$(".nav-link").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  }), { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => observer.observe(section));
}

function renderPalette() {
  const brand = $("#brand").value;
  $("#palette").innerHTML = palettes[brand].map((color, index) => `<button class="swatch${index === 0 ? " active" : ""}" style="background:${color.hex}" title="${color.name}" aria-label="${color.name}" data-color="${color.hex}"></button>`).join("");
  $$(".swatch").forEach((swatch) => swatch.addEventListener("click", () => {
    $$(".swatch").forEach((item) => item.classList.remove("active"));
    swatch.classList.add("active");
    if (window.applyWallColor) window.applyWallColor(swatch.dataset.color);
  }));
}

async function loadThreeSimulator() {
  const container = $("#three-container");
  if (window.threeLoaded) return;
  const placeholder = container.querySelector(".lazy-placeholder");
  placeholder.innerHTML = "<p>Cargando experiencia 3D…</p>";
  try {
    const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    const { OrbitControls } = await import("https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x252f2b);
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4, 3.2, 6);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0, 1.4, 0);
    scene.add(new THREE.AmbientLight(0xffffff, .7));
    const light = new THREE.DirectionalLight(0xffffff, .8); light.position.set(4, 7, 5); scene.add(light);
    const walls = [];
    const createWall = (w, h, x, y, z, rotation = 0) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xf5f5f0, side: THREE.DoubleSide }));
      mesh.position.set(x, y, z); mesh.rotation.y = rotation; mesh.userData.isWall = true; scene.add(mesh); walls.push(mesh);
    };
    createWall(5, 3, 0, 1.5, -2.5); createWall(5, 3, -2.5, 1.5, 0, Math.PI / 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ color: 0x8d6346, roughness: .85 }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const box = (width, height, depth, color, x, y, z) => {
      const item = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color, roughness: .8 }));
      item.position.set(x, y, z); scene.add(item); return item;
    };
    // Guardapolvos en ambas paredes para dar escala y realismo al ambiente.
    box(5, .12, .08, 0xe8e0d2, 0, .06, -2.45);
    box(.08, .12, 5, 0xe8e0d2, -2.45, .06, 0);
    // Sofá: base, respaldo y brazos.
    box(2.1, .35, .85, 0x6e8070, .45, .35, .9);
    box(2.1, .85, .2, 0x526456, .45, .85, 1.2);
    box(.2, .65, .85, 0x526456, -.6, .62, .9);
    box(.2, .65, .85, 0x526456, 1.5, .62, .9);
    // Mesa baja con cubierta y patas.
    box(1.25, .12, .7, 0x9a6848, .35, .48, -.25);
    [-.15, .85].forEach((x) => box(.08, .45, .08, 0x65432f, x, .23, -.5));
    [-.15, .85].forEach((x) => box(.08, .45, .08, 0x65432f, x, .23, 0));
    // Cuadro decorativo en la pared del fondo.
    box(1.05, .75, .04, 0x2d4038, .8, 1.75, -2.4);
    box(.84, .54, .045, 0xd9a27e, .8, 1.75, -2.43);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    renderer.domElement.addEventListener("click", (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(walls)[0];
      if (hit && window.selectedColor) hit.object.material.color.set(window.selectedColor);
    });
    window.applyWallColor = (color) => { window.selectedColor = color; };
    window.resetSimulator = () => walls.forEach((wall) => wall.material.color.set(0xf5f5f0));
    const resize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
    window.addEventListener("resize", resize);
    const animate = () => { controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate); }; animate();
    window.threeLoaded = true; window.selectedColor = palettes.sipa[0].hex;
    renderPalette();
  } catch (error) {
    placeholder.innerHTML = "<p>No se pudo cargar el simulador. Puedes usar la opción «Mi propia foto».</p>";
    console.error("Three.js simulator failed to load", error);
  }
}

function setupPhotoTool() {
  const input = $("#photo-upload"); const canvas = $("#photo-canvas"); const context = canvas.getContext("2d");
  let photoImage = null;
  const redrawPhoto = (tint) => {
    if (!photoImage) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(photoImage, 0, 0);
    context.save();
    context.globalAlpha = .28;
    context.globalCompositeOperation = "multiply";
    context.fillStyle = tint;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  };
  input.addEventListener("change", () => {
    const file = input.files[0]; if (!file || file.size > 10 * 1024 * 1024) return;
    const image = new Image();
    image.onload = () => { photoImage = image; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; redrawPhoto($("#photo-color").value); $("#photo-preview-wrap").hidden = false; };
    image.src = URL.createObjectURL(file);
  });
  $("#photo-color").addEventListener("input", (event) => redrawPhoto(event.target.value));
  $("#photo-whatsapp").addEventListener("click", () => {
    const color = $("#photo-color").value;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Colorflix, subí una foto y quiero cotizar este diseño. Color de referencia: ${color}`)}`, "_blank", "noopener");
  });
}

function setupQuoteForm() {
  $("#quote-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = `Hola Colorflix, quiero cotizar. Nombre: ${data.get("name")}. WhatsApp: ${data.get("phone")}. Servicio: ${data.get("service")}. M2 aprox.: ${data.get("meters") || "Por definir"}. Comuna: ${data.get("location") || "Por definir"}. Detalles: ${data.get("message") || "Sin detalles adicionales"}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    $("#form-status").textContent = "Abrimos WhatsApp con tu solicitud lista para enviar.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderGallery(); setupNavigation(); renderPalette(); setupPhotoTool(); setupQuoteForm();
  $("#year").textContent = new Date().getFullYear();
  $("#load-more").addEventListener("click", () => { visibleProjects = PROJECTS.length; renderGallery(); });
  $("#brand").addEventListener("change", renderPalette);
  $("#reset-colors").addEventListener("click", () => { if (window.resetSimulator) window.resetSimulator(); });
  $$(".sim-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".sim-tab").forEach((item) => { item.classList.toggle("active", item === tab); item.setAttribute("aria-selected", String(item === tab)); });
    $$(".tool-panel").forEach((panel) => { const active = panel.id === `${tab.dataset.tab}-tool`; panel.classList.toggle("active", active); panel.hidden = !active; });
  }));
  $("#start-simulator").addEventListener("click", loadThreeSimulator);
  const simulatorObserver = new IntersectionObserver((entries, observer) => { if (entries[0].isIntersecting) { loadThreeSimulator(); observer.disconnect(); } }, { rootMargin: "250px" });
  simulatorObserver.observe($("#simulador"));
});
