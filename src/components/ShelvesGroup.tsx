import React, { Suspense } from "react";
import * as THREE from "three";
import { SHELF_SIZE, MAP_SCALE } from "../lib/consts";
const Shelf = React.lazy(() => import("./Shelf"));

type Props = {
	sceneRef?: React.RefObject<THREE.Group | null>;
};

export default function ShelvesGroup({ sceneRef }: Props) {
	const ROWS = 3;
	const COLUMNS = 5;

	// Use shelf width from constants
	const SHELF_WIDTH = SHELF_SIZE[0];
	const SHELF_DEPTH = SHELF_SIZE[2];

	const START_Z = 3; // front row Z position
	const ROW_SPACING = SHELF_DEPTH + 2.2 * MAP_SCALE; // space between rows along Z-axis
	const COLUMN_SPACING = SHELF_WIDTH + 1.5 * MAP_SCALE; // space between columns along X-axis

	return (
		<group ref={sceneRef}>
			{Array.from({ length: ROWS }).map((_, rowIndex) =>
				Array.from({ length: COLUMNS }).map((_, colIndex) => {
					const x = (colIndex - Math.floor(COLUMNS / 2)) * COLUMN_SPACING;
					const z = START_Z - rowIndex * ROW_SPACING;
					return (
						<Suspense
							key={`shelf-${rowIndex}-${colIndex}`}
							fallback={null} // optional: could show a placeholder mesh
						>
							<Shelf
								key={`shelf-${rowIndex}-${colIndex}`}
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
