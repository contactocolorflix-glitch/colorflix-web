import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

// Edit this array to add Colorflix colors to every picker.
export const colorflixPalette = [
  { name: "Blanco nube", hex: "#F4F6F8" },
  { name: "Azul profundo", hex: "#102A43" },
  { name: "Terracota", hex: "#E85D04" },
  { name: "Verde salvia", hex: "#A8B5A2" },
  { name: "Arena cálida", hex: "#D8C3A5" },
  { name: "Rosado mineral", hex: "#D8A7A7" },
  { name: "Gris piedra", hex: "#8996A3" },
  { name: "Carbón", hex: "#263238" }
];

// Add inventory entries here. The category names match the buttons in index.html.
const INVENTORY = {
  Muebles: ["Sofá", "Mesa", "Sillas", "Cama", "Camarote", "Estantería"],
  "Iluminación": ["Lámpara colgante", "Lámpara de pie"],
  "Grifería y sanitarios": ["Lavamanos", "Sanitario"],
  "Chapas, manillas y herrajes de puertas": ["Puerta", "Manilla"],
  "Cuadros y decoración de pared": ["Cuadro", "Repisa"],
  "Cornisas / molduras": ["Cornisa", "Moldura"],
  Otros: ["Planta", "Espejo"]
};

const WHATSAPP = "56956079469";
const container = document.querySelector("#three-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#172838");
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.replaceChildren(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.3, 0);
const firstPerson = new PointerLockControls(camera, renderer.domElement);
let activeMode = "orbit";
let selected = null;
let selectedColor = colorflixPalette[0].hex;
let currentRoom = "living";
let roomStates = {};
const selectable = [];
const keys = new Set();
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0xffffff, 0x263238, 1.7));
const sun = new THREE.DirectionalLight(0xfff4df, 2.5);
sun.position.set(4, 8, 5);
sun.castShadow = true;
scene.add(sun);

const material = (color, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness, side: THREE.DoubleSide });
const addMesh = (geometry, color, position, name, rotation = [0, 0, 0]) => {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.userData = { name, baseColor: color, kind: "object" };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  selectable.push(mesh);
  return mesh;
};
const addBox = (size, color, position, name, rotation = [0, 0, 0]) => addMesh(new THREE.BoxGeometry(...size), color, position, name, rotation);

function createRoom(room) {
  const group = new THREE.Group();
  group.name = "room-shell";
  const wallMaterial = material(roomStates[room]?.walls || colorflixPalette[0].hex);
  const floorMaterial = material(roomStates[room]?.floor || "#B98961");
  const ceilingMaterial = material(roomStates[room]?.ceiling || "#FFFFFF");
  const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.8), wallMaterial);
  wallBack.position.set(0, 1.9, -3);
  wallBack.userData = { name: "Pared del fondo", kind: "surface", surface: "walls" };
  const wallSide = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.8), material(roomStates[room]?.walls || colorflixPalette[0].hex));
  wallSide.position.set(-3, 1.9, 0);
  wallSide.rotation.y = Math.PI / 2;
  wallSide.userData = { name: "Pared lateral", kind: "surface", surface: "walls" };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.userData = { name: "Piso", kind: "surface", surface: "floor" };
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ceilingMaterial);
  ceiling.position.y = 3.8;
  ceiling.rotation.x = Math.PI / 2;
  ceiling.userData = { name: "Techo", kind: "surface", surface: "ceiling" };
  [wallBack, wallSide, floor, ceiling].forEach((mesh) => { mesh.receiveShadow = true; group.add(mesh); selectable.push(mesh); });
  const baseboard = addBox([6, 0.12, 0.12], "#E2DDD3", [0, 0.08, -2.92], "Guardapolvo");
  group.add(baseboard);
  return group;
}

function buildRoomObjects(room) {
  const preset = room === "kitchen" ? ["Mesa", "Sillas", "Lámpara colgante"] : room === "bathroom" ? ["Lavamanos", "Espejo", "Sanitario"] : room === "bedroom" ? ["Cama", "Estantería", "Lámpara de pie"] : room === "bunkroom" ? ["Camarote", "Estantería", "Planta"] : ["Sofá", "Mesa", "Cuadro", "Planta"];
  preset.forEach((item, index) => addDecoration(item, index));
}

function addDecoration(name, index = 0) {
  const offset = (index % 3) * 0.8;
  let object;
  if (name === "Sofá") {
    object = addBox([2.3, 0.45, 0.9], "#506B65", [-0.1, 0.35, 1], name);
    addBox([2.3, 0.9, 0.18], "#405650", [-0.1, 0.9, 1.34], "Respaldo del sofá");
  } else if (name === "Mesa") object = addBox([1.4, 0.14, 0.8], "#A96E45", [0.2, 0.75, 0.1], name);
  else if (name === "Cama") object = addBox([2.1, 0.38, 1.65], "#D8C7B2", [0.25, 0.3, 1], name);
  else if (name === "Camarote") object = addBox([1.7, 1.8, 0.9], "#B56C45", [0, 0.95, 1], name);
  else if (name === "Estantería") object = addBox([0.7, 2.2, 0.35], "#76533D", [1.7, 1.1, -2.7], name);
  else if (name === "Sillas") object = addBox([0.6, 0.9, 0.6], "#D49B6A", [-1.1 + offset, 0.45, 0.2], name);
  else if (name === "Lámpara colgante") object = addBox([0.25, 0.65, 0.25], "#E8B44C", [1.1, 2.7, -0.8], name);
  else if (name === "Lámpara de pie") object = addBox([0.25, 1.4, 0.25], "#D6B66D", [1.5, 0.7, 1], name);
  else if (name === "Cuadro") object = addBox([1.1, 0.8, 0.05], "#E85D04", [0.9, 2, -2.87], name);
  else if (name === "Repisa") object = addBox([1.3, 0.1, 0.3], "#A96E45", [0.7, 1.5, -2.82], name);
  else if (name === "Lavamanos") object = addBox([0.9, 0.55, 0.55], "#F4F6F8", [0.6, 0.45, -1.3], name);
  else if (name === "Sanitario") object = addBox([0.7, 0.7, 0.8], "#F4F6F8", [-1, 0.4, -1.8], name);
  else if (name === "Puerta") object = addBox([1.1, 2.5, 0.12], "#8D6346", [2.2, 1.25, -2.85], name);
  else if (name === "Manilla") object = addBox([0.12, 0.12, 0.12], "#E8B44C", [1.95, 1.25, -2.7], name);
  else if (name === "Cornisa" || name === "Moldura") object = addBox([2.5, 0.12, 0.12], "#FFFFFF", [0, 3.65, -2.88], name);
  else if (name === "Espejo") object = addBox([1.1, 1.3, 0.06], "#89B7C4", [-1.1, 1.8, -2.88], name);
  else object = addBox([0.55, 0.85, 0.55], "#6E9B70", [1.1 + offset, 0.45, 1], name);
  object.userData.kind = "object";
  return object;
}

function saveState() {
  roomStates[currentRoom] = roomStates[currentRoom] || { walls: colorflixPalette[0].hex, floor: "#B98961", ceiling: "#FFFFFF", objects: [] };
  const surfaceColors = selectable.filter((item) => item.userData.kind === "surface");
  surfaceColors.forEach((item) => { roomStates[currentRoom][item.userData.surface] = `#${item.material.color.getHexString()}`; });
  roomStates[currentRoom].objects = selectable.filter((item) => item.userData.kind === "object").map((item) => ({ name: item.userData.name, color: `#${item.material.color.getHexString()}`, position: item.position.toArray(), rotation: item.rotation.toArray() }));
}
function clearScene() {
  while (scene.children.length > 2) {
    const child = scene.children[scene.children.length - 1];
    scene.remove(child);
  }
  selectable.length = 0;
}
function loadRoom(room) {
  saveState();
  currentRoom = room;
  clearScene();
  scene.add(createRoom(room));
  buildRoomObjects(room);
  const state = roomStates[room];
  if (state?.objects?.length) {
    selectable.filter((item) => item.userData.kind === "object").forEach((item, index) => {
      const saved = state.objects[index];
      if (saved) { item.material.color.set(saved.color); item.position.fromArray(saved.position); item.rotation.fromArray(saved.rotation); }
    });
  }
  selected = null;
  updateSelectionLabel();
}
function updateSelectionLabel() {
  document.querySelector("#selected-label").textContent = selected ? selected.userData.name : "Selecciona una superficie";
}
function applyColor(hex) {
  selectedColor = hex;
  if (selected) selected.material.color.set(hex);
}
function resetRoom() {
  delete roomStates[currentRoom];
  loadRoom(currentRoom);
  document.querySelector("#design-status").textContent = "Ambiente reiniciado.";
}

function renderPalette() {
  document.querySelector("#palette").innerHTML = colorflixPalette.map((color) => `<button class="swatch" style="background:${color.hex}" title="${color.name}" aria-label="${color.name}" data-color="${color.hex}"></button>`).join("");
  document.querySelectorAll(".swatch").forEach((button) => button.addEventListener("click", () => applyColor(button.dataset.color)));
}
function renderInventory(category = "Muebles") {
  document.querySelector("#inventory-items").innerHTML = INVENTORY[category].map((name) => `<button class="inventory-item" type="button" data-item="${name}"><span aria-hidden="true">＋</span>${name}</button>`).join("");
  document.querySelectorAll(".inventory-item").forEach((button) => button.addEventListener("click", () => { const object = addDecoration(button.dataset.item, selectable.length); selected = object; updateSelectionLabel(); }));
}
function captureDesign() {
  renderer.render(scene, camera);
  const link = document.createElement("a");
  link.download = `colorflix-${currentRoom}.png`;
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
  document.querySelector("#design-status").textContent = "Captura descargada. Adjúntala en WhatsApp.";
}
function sendDesign() {
  saveState();
  const colors = [...new Set(selectable.filter((item) => item.userData.kind === "surface").map((item) => `#${item.material.color.getHexString()}`))];
  const objects = selectable.filter((item) => item.userData.kind === "object").map((item) => item.userData.name).join(", ");
  const message = `Hola Colorflix, diseñé un ambiente en la Caja Virtual. Ambiente: ${currentRoom}. Colores: ${colors.join(", ") || "por definir"}. Elementos: ${objects || "por definir"}. Adjunto la captura de mi diseño.`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  document.querySelector("#design-status").textContent = "WhatsApp está listo. Adjunta la captura descargada para que veamos tu diseño.";
}

function setup() {
  camera.position.set(6.7, 4.3, 7.2);
  renderer.domElement.addEventListener("pointerdown", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, false)[0];
    if (hit) { selected = hit.object; updateSelectionLabel(); }
  });
  document.querySelector("#room-select").addEventListener("change", (event) => loadRoom(event.target.value));
  document.querySelectorAll(".inventory-category").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".inventory-category").forEach((item) => item.classList.toggle("active", item === button)); renderInventory(button.dataset.category); }));
  document.querySelector("#apply-free-color").addEventListener("click", () => applyColor(document.querySelector("#free-color").value));
  document.querySelector("#reset-colors").addEventListener("click", resetRoom);
  document.querySelector("#capture-design").addEventListener("click", captureDesign);
  document.querySelector("#send-design").addEventListener("click", sendDesign);
  document.querySelector("#move-left").addEventListener("click", () => { if (selected) selected.position.x -= 0.2; });
  document.querySelector("#move-forward").addEventListener("click", () => { if (selected) selected.position.z -= 0.2; });
  document.querySelector("#move-back").addEventListener("click", () => { if (selected) selected.position.z += 0.2; });
  document.querySelector("#move-right").addEventListener("click", () => { if (selected) selected.position.x += 0.2; });
  document.querySelector("#rotate-object").addEventListener("click", () => { if (selected) selected.rotation.y += Math.PI / 4; });
  document.querySelector("#delete-object").addEventListener("click", () => { if (selected?.userData.kind === "object") { scene.remove(selected); selectable.splice(selectable.indexOf(selected), 1); selected = null; updateSelectionLabel(); } });
  document.querySelectorAll(".mode-button").forEach((button) => button.addEventListener("click", () => { activeMode = button.dataset.mode; document.querySelectorAll(".mode-button").forEach((item) => item.classList.toggle("active", item === button)); if (activeMode === "first-person") { orbit.enabled = false; firstPerson.lock(); } else { firstPerson.unlock(); orbit.enabled = true; } }));
  window.addEventListener("keydown", (event) => keys.add(event.key.toLowerCase()));
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  loadRoom(currentRoom);
  renderPalette();
  renderInventory();
  resize();
}
function resize() { const width = container.clientWidth; const height = Math.max(360, container.clientHeight); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
function animate() { requestAnimationFrame(animate); const delta = clock.getDelta(); if (activeMode === "first-person") { const speed = 2.2 * delta; if (keys.has("w")) firstPerson.moveForward(speed); if (keys.has("s")) firstPerson.moveForward(-speed); if (keys.has("a")) firstPerson.moveRight(-speed); if (keys.has("d")) firstPerson.moveRight(speed); } orbit.update(); renderer.render(scene, camera); }
window.addEventListener("resize", resize);
setup();
animate();
