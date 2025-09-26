import React, { Suspense } from "react";
import * as THREE from "three";
import { SHELF_SIZE, MAP_SCALE } from "../lib/consts";
import { Product } from "../lib/models";
const Shelf = React.lazy(() => import("./Shelf"));

type Props = {
	products: Product[];
	sceneRef?: React.RefObject<THREE.Group | null>;
};

export default function ShelvesGroup({ products, sceneRef }: Props) {
	const ROWS = 3;
	const COLUMNS = 5;

	// Use shelf width from constants
	const SHELF_WIDTH = SHELF_SIZE[0];
	const SHELF_DEPTH = SHELF_SIZE[2];

	const START_Z = 3; // front row Z position
	const ROW_SPACING = SHELF_DEPTH + 2.2 * MAP_SCALE; // space between rows along Z-axis
	const COLUMN_SPACING = SHELF_WIDTH + 1.5 * MAP_SCALE; // space between columns along X-axis

	// how many products per shelf
	const productsPerShelf = Math.ceil(products.length / (ROWS * COLUMNS));

	return (
		<group ref={sceneRef}>
			{Array.from({ length: ROWS }).map((_, rowIndex) =>
				Array.from({ length: COLUMNS }).map((_, colIndex) => {
					const shelfIndex = rowIndex * COLUMNS + colIndex;
					const start = shelfIndex * productsPerShelf;
					const end = start + productsPerShelf;
					const shelfProducts = products.slice(start, end);

					const x = (colIndex - Math.floor(COLUMNS / 2)) * COLUMN_SPACING;
					const z = START_Z - rowIndex * ROW_SPACING;

					return (
						<Suspense key={`shelf-${rowIndex}-${colIndex}`} fallback={null}>
							<Shelf
								products={shelfProducts}
								position={[x, 0, z]}
								rowIndex={rowIndex}
								colIndex={colIndex}
							/>
						</Suspense>
					);
				})
			)}
		</group>
	);
}
