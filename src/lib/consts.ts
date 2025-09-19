// Map scaling
export const MAP_SCALE = 0.8;

// Floor
export const FLOOR_DIMENSIONS: [number, number] = [50 * MAP_SCALE, 50 * MAP_SCALE];

// Walls
export const WALL_WIDTH = 50 * MAP_SCALE;
export const WALL_HEIGHT = 5 * MAP_SCALE;
export const WALL_DEPTH = 0.5 * MAP_SCALE;
export const WALL_DIMENSIONS: [number, number, number] = [WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH];
export const WALL_OFFSET = 25 * MAP_SCALE;
export const WALL_POSITION_Y = WALL_HEIGHT / 2;

// Roof
export const ROOF_SIZE: [number, number] = [50 * MAP_SCALE, 50 * MAP_SCALE];
export const ROOF_HEIGHT = 4;

// Shelf
const SHELF_BASE_SIZE: [number, number, number] = [3.6, 2, 0.6]; // width, height, depth

// Option 2: Scale a bit more aggressively
export const SHELF_SIZE: [number, number, number] = SHELF_BASE_SIZE.map(
  (s) => s * MAP_SCALE * 1.2
) as [number, number, number];

export const SHELF_THICKNESS = 0.1 * MAP_SCALE * 1.2;

// Product
export const PRODUCT_SIZE = 0.5 * MAP_SCALE;
export const PRODUCT_DIMENSIONS: [number, number, number] = [PRODUCT_SIZE, PRODUCT_SIZE, PRODUCT_SIZE];
