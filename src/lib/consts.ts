// Map scaling
export const MAP_SCALE = 0.8;
export const MAP_WIDTH = 35;
export const MAP_LENGTH = 25;

// Floor
export const FLOOR_DIMENSIONS: [number, number] = [MAP_WIDTH * MAP_SCALE, MAP_LENGTH * MAP_SCALE];

// Walls
export const WALL_WIDTH = 50 * MAP_SCALE;
export const WALL_HEIGHT = 5 * MAP_SCALE;
export const WALL_DEPTH = 0.5 * MAP_SCALE;
export const WALL_DIMENSIONS: [number, number, number] = [WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH];
// Position walls at edges of floor
export const WALL_POSITION_Y = WALL_HEIGHT / 2;
export const WALL_OFFSET_X = FLOOR_DIMENSIONS[0] / 2; // left/right walls
export const WALL_OFFSET_Z = FLOOR_DIMENSIONS[1] / 2; // front/back walls

// Roof
export const ROOF_SIZE: [number, number] = FLOOR_DIMENSIONS;
export const ROOF_HEIGHT = WALL_HEIGHT;

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
