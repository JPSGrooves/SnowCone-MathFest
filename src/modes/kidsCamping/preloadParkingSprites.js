// preloadParkingSprites.js
export function preloadParkingSprites() {
  const base = import.meta.env.BASE_URL + 'assets/img/characters/kidsCamping/';
  parkingSprites.forEach(name => {
    const img = new Image();
    img.src = base + name;
  });
}
