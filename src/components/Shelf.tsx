// Shelf.tsx
import React, { Suspense, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useCompoundBody } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { SHELF_SIZE, SHELF_THICKNESS, PRODUCT_SIZE } from "../lib/consts";
import Product from "./Product";

type ShelfProps = {
	position?: [number, number, number];
	productCountPerShelf?: number;
	rowIndex?: number;
	colIndex?: number;
};

const photos = [
	"/products-images/gita-02.jpg",
	"/products-images/bg-original.webp",
	"/products-images/gita-02.jpg",
	"/products-images/bg-original.webp",
	"/products-images/gita-02.jpg",
];

export default function Shelf({
	position = [0, 0, 0],
	productCountPerShelf = 5,
	rowIndex = 0,
	colIndex = 0,
}: ShelfProps) {
	const woodTexture = useTexture("/textures/wood-light.jpeg");
	woodTexture.anisotropy = 4;

	const [w, h, d] = SHELF_SIZE;
	const shelfSpacing = (h - SHELF_THICKNESS) / 3;

	// --- physics body ---
	const [ref] = useCompoundBody(() => ({
		mass: 0,
		position,
		shapes: [
			{ type: "Box", args: [w, SHELF_THICKNESS, d], position: [0, 0, 0] }, // bottom
			{
				type: "Box",
				args: [w, SHELF_THICKNESS, d],
				position: [0, shelfSpacing, 0],
			}, // middle
			{
				type: "Box",
				args: [w, SHELF_THICKNESS, d],
				position: [0, 2 * shelfSpacing, 0],
			}, // top
			{ type: "Box", args: [0.05, h, d], position: [-w / 2, h / 2, 0] }, // left
			{ type: "Box", args: [0.05, h, d], position: [w / 2, h / 2, 0] }, // right
			{ type: "Box", args: [w, h, 0.05], position: [0, h / 2, -d / 2] }, // back
		],
	}));

	// --- merged geometry for shelf mesh ---
	const shelfGeometry = useMemo(() => {
		const geoms: THREE.BoxGeometry[] = [];
		[0, 1, 2].forEach((i) =>
			geoms.push(
				new THREE.BoxGeometry(w, SHELF_THICKNESS, d).translate(
					0,
					i * shelfSpacing,
					0
				)
			)
		);
		geoms.push(new THREE.BoxGeometry(0.05, h, d).translate(-w / 2, h / 2, 0));
		geoms.push(new THREE.BoxGeometry(0.05, h, d).translate(w / 2, h / 2, 0));
		geoms.push(new THREE.BoxGeometry(w, h, 0.05).translate(0, h / 2, -d / 2));
		return mergeGeometries(geoms, false);
	}, [w, h, d, shelfSpacing]);

	// --- products ---
	const products = useMemo(() => {
		const result = [];
		for (let shelfIndex = 0; shelfIndex < 3; shelfIndex++) {
			const y =
				shelfIndex * shelfSpacing + SHELF_THICKNESS / 2 + PRODUCT_SIZE / 2;
			for (let i = 0; i < productCountPerShelf; i++) {
				const x = -w / 2 + (i + 0.5) * (w / productCountPerShelf);
				const z = d / 2 - PRODUCT_SIZE / 2 - 0.01;
				// create a unique photo URL per shelf/product to avoid caching issues
				const photoUrl =
					photos[i % photos.length] +
					`?shelf=${rowIndex}-${colIndex}-${shelfIndex}-${i}`;
				result.push(
					<Product
						key={`product-${rowIndex}-${colIndex}-${shelfIndex}-${i}`}
						position={[x, y, z]}
						name={`Product ${rowIndex}-${colIndex}-${shelfIndex}-${i}`}
						color={`hsl(${(i * 60) % 360}, 80%, 50%)`}
						photoUrl={photoUrl}
						usePhysics={false}
					/>
				);
			}
		}
		return result;
	}, [w, d, shelfSpacing, productCountPerShelf, rowIndex, colIndex]);

	return (
		<group ref={ref}>
			<Suspense fallback={null}>
				<mesh
					geometry={shelfGeometry}
					castShadow
					receiveShadow
					userData={{ isShelf: true }}
				>
					<meshStandardMaterial map={woodTexture} roughness={0.6} />
				</mesh>
				{products}
			</Suspense>
		</group>
	);
}
