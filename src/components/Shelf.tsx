// Shelf.tsx
import React, { Suspense, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useCompoundBody } from "@react-three/cannon";
import { SHELF_SIZE, SHELF_THICKNESS, PRODUCT_SIZE } from "../lib/consts";
import Product from "./Product";
import { useTextures } from "../lib/context/TextureContext";

type ShelfProps = {
	position?: [number, number, number];
	productCountPerShelf?: number;
	rowIndex?: number;
	colIndex?: number;
};

export default function Shelf({
	position = [0, 0, 0],
	productCountPerShelf = 5,
	rowIndex = 0,
	colIndex = 0,
}: ShelfProps) {
	const { shelf: texture, products: productsTextures } = useTextures();
	const [w, h, d] = SHELF_SIZE;
	const shelfSpacing = (h - SHELF_THICKNESS) / 3;

	// --- physics body ---
	const COLLISION_PADDING = 0.1; // 10cm extra on each dimension

	// --- physics body ---
	const [ref] = useCompoundBody(() => ({
		mass: 0,
		position,
		shapes: [
			{
				type: "Box",
				args: [
					w + COLLISION_PADDING,
					SHELF_THICKNESS + COLLISION_PADDING,
					d + COLLISION_PADDING,
				],
				position: [0, 0, 0],
			}, // bottom
			{
				type: "Box",
				args: [
					w + COLLISION_PADDING,
					SHELF_THICKNESS + COLLISION_PADDING,
					d + COLLISION_PADDING + 0.5,
				],
				position: [0, shelfSpacing, 0],
			}, // middle
			{
				type: "Box",
				args: [
					w + COLLISION_PADDING,
					SHELF_THICKNESS + COLLISION_PADDING,
					d + COLLISION_PADDING,
				],
				position: [0, 2 * shelfSpacing, 0],
			}, // top
			{
				type: "Box",
				args: [
					0.05 + COLLISION_PADDING,
					h + COLLISION_PADDING,
					d + COLLISION_PADDING,
				],
				position: [-w / 2, h / 2, 0],
			}, // left
			{
				type: "Box",
				args: [
					0.05 + COLLISION_PADDING,
					h + COLLISION_PADDING,
					d + COLLISION_PADDING,
				],
				position: [w / 2, h / 2, 0],
			}, // right
			{
				type: "Box",
				args: [
					w + COLLISION_PADDING,
					h + COLLISION_PADDING,
					0.05 + COLLISION_PADDING,
				],
				position: [0, h / 2, -d / 2],
			}, // back
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
				shelfIndex * shelfSpacing +
				SHELF_THICKNESS / 2 +
				PRODUCT_SIZE / 2 +
				0.01;
			for (let i = 0; i < productCountPerShelf; i++) {
				const x = -w / 2 + (i + 0.5) * (w / productCountPerShelf);
				const z = d / 2 - PRODUCT_SIZE / 2 - 0.01;
				// create a unique photo URL per shelf/product to avoid caching issues
				result.push(
					<Product
						texture={productsTextures[i]}
						key={`product-${rowIndex}-${colIndex}-${shelfIndex}-${i}`}
						position={[x, y, z]}
						name={`Product ${rowIndex}-${colIndex}-${shelfIndex}-${i}`}
						color={`hsl(${(i * 60) % 360}, 80%, 50%)`}
						usePhysics={false}
					/>
				);
			}
		}
		return result;
	}, [
		w,
		d,
		shelfSpacing,
		productCountPerShelf,
		rowIndex,
		colIndex,
		productsTextures,
	]);

	return (
		<group ref={ref}>
			<Suspense fallback={null}>
				<mesh
					geometry={shelfGeometry}
					castShadow
					receiveShadow
					userData={{ isShelf: true }}
				>
					<meshStandardMaterial map={texture} roughness={0.6} />
				</mesh>
				{products}
			</Suspense>
		</group>
	);
}
