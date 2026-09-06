const PROJECTS = [
  { image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80", title: "Casa Ñuñoa", description: "Interior · Verde salvia", alt: "Living luminoso pintado en verde salvia" },
  { image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80", title: "Depto Providencia", description: "Interior · Blanco cálido", alt: "Cocina moderna con paredes blancas" },
  { image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80", title: "Casa La Reina", description: "Interior · Terracota suave", alt: "Dormitorio con pared terracota" },
  { image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80", title: "Oficina Vitacura", description: "Comercial · Beige natural", alt: "Oficina cálida recién pintada" }
];
const WHATSAPP = "56956079469";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let visibleProjects = 3;

function renderGallery() {
  $("#gallery").innerHTML = PROJECTS.slice(0, visibleProjects).map((project) => `<article class="gallery-card"><img src="${project.image}" alt="${project.alt}" loading="lazy"><div class="gallery-caption"><strong>${project.title}</strong><small>${project.description}</small></div></article>`).join("");
  $("#load-more").hidden = visibleProjects >= PROJECTS.length;
}
function setupNavigation() {
  $(".menu-toggle").addEventListener("click", () => { const open = $(".main-nav").classList.toggle("open"); $(".menu-toggle").setAttribute("aria-expanded", String(open)); });
  $$(".nav-link").forEach((link) => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) $$(".nav-link").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)); }), { rootMargin: "-35% 0px -55% 0px" });
  $$('main section[id]').forEach((section) => observer.observe(section));
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
function setupWhatsAppLinks() {
  $$('a[href="#cotizar"]').forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Colorflix, quiero cotizar pintura profesional, remodelación o decoración para mi espacio.")}`, "_blank", "noopener"); }));
}
document.addEventListener("DOMContentLoaded", () => {
  renderGallery(); setupNavigation(); setupQuoteForm(); setupWhatsAppLinks();
  $("#year").textContent = new Date().getFullYear();
  $("#load-more").addEventListener("click", () => { visibleProjects = PROJECTS.length; renderGallery(); });
});
