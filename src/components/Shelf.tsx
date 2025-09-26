import { Suspense, useMemo, JSX } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useCompoundBody } from "@react-three/cannon";
import { SHELF_SIZE, SHELF_THICKNESS, PRODUCT_SIZE } from "../lib/consts";
import Product from "./Product";
import { useTextures } from "../lib/context/TextureContext";
import { Product as ProductType } from "../lib/models";

type ShelfProps = {
	products: ProductType[];
	position?: [number, number, number];
	rowIndex?: number;
	colIndex?: number;
};

export default function Shelf({
	products,
	position = [0, 0, 0],
	rowIndex = 0,
	colIndex = 0,
}: ShelfProps) {
	const { shelf: texture } = useTextures();
	const [w, h, d] = SHELF_SIZE;
	const shelfSpacing = (h - SHELF_THICKNESS) / 3;
	const textureLoader = new THREE.TextureLoader();

	// --- physics body ---
	const [ref] = useCompoundBody(() => ({
		mass: 0,
		position,
		shapes: [
			{ type: "Box", args: [w, SHELF_THICKNESS, d], position: [0, 0, 0] },
			{
				type: "Box",
				args: [w, SHELF_THICKNESS, d],
				position: [0, shelfSpacing, 0],
			},
			{
				type: "Box",
				args: [w, SHELF_THICKNESS, d],
				position: [0, 2 * shelfSpacing, 0],
			},
			{ type: "Box", args: [0.05, h, d], position: [-w / 2, h / 2, 0] },
			{ type: "Box", args: [0.05, h, d], position: [w / 2, h / 2, 0] },
			{ type: "Box", args: [w, h, 0.05], position: [0, h / 2, -d / 2] },
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

	// --- distribute given products ---
	const renderedProducts = useMemo(() => {
		const result: JSX.Element[] = [];
		const productsPerLevel = Math.ceil(products.length / 3);

		for (let shelfIndex = 0; shelfIndex < 3; shelfIndex++) {
			const y = shelfIndex * shelfSpacing + SHELF_THICKNESS + PRODUCT_SIZE / 2;
			const start = shelfIndex * productsPerLevel;
			const end = start + productsPerLevel;
			const levelProducts = products.slice(start, end);

			levelProducts.forEach((p, i) => {
				const x = -w / 2 + (i + 0.5) * (w / productsPerLevel);
				const z = d / 2 - PRODUCT_SIZE / 2 - 0.01;
				const tex = p.photoUrl ? textureLoader.load(p.photoUrl) : undefined;

				result.push(
					<Product
						key={`prod-${rowIndex}-${colIndex}-${shelfIndex}-${p.id}`}
						texture={tex}
						color={tex ? undefined : p.color ?? "white"}
						position={[x, y, z]}
						name={p.name}
						usePhysics={false}
					/>
				);
			});
		}
		return result;
	}, [products, w, d, shelfSpacing, rowIndex, colIndex, textureLoader]);

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
				{renderedProducts}
			</Suspense>
		</group>
	);
}
