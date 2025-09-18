import { useBox } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import Product from "./Product";
import type { JSX } from "react";

type ShelfProps = {
	position?: [number, number, number];
	productCountPerShelf?: number;
};

const SHELF_SIZE: [number, number, number] = [3.6, 2, 0.6]; // width, height, depth
const SHELF_THICKNESS = 0.1;
const PRODUCT_SIZE = 0.3;

export default function Shelf({
	position = [0, 0, 0],
	productCountPerShelf = 5,
}: ShelfProps) {
	const woodTexture = useTexture("/textures/wood-light.jpeg");
	woodTexture.anisotropy = 4;

	const [w, h, d] = SHELF_SIZE;
	const shelfSpacing = (h - SHELF_THICKNESS) / 3;

	// --- Shelves ---
	const [bottomShelfRef] = useBox(() => ({
		args: [w, SHELF_THICKNESS, d],
		position: [position[0], position[1], position[2]],
		type: "Static",
	}));

	const [middleShelfRef] = useBox(() => ({
		args: [w, SHELF_THICKNESS, d],
		position: [position[0], position[1] + shelfSpacing, position[2]],
		type: "Static",
	}));

	const [topShelfRef] = useBox(() => ({
		args: [w, SHELF_THICKNESS, d],
		position: [position[0], position[1] + 2 * shelfSpacing, position[2]],
		type: "Static",
	}));

	// --- Back and sides ---
	const [backRef] = useBox(() => ({
		args: [w, h, 0.05],
		position: [position[0], position[1] + h / 2, position[2] - d / 2],
		type: "Static",
	}));

	const [leftRef] = useBox(() => ({
		args: [0.05, h, d],
		position: [position[0] - w / 2, position[1] + h / 2, position[2]],
		type: "Static",
	}));

	const [rightRef] = useBox(() => ({
		args: [0.05, h, d],
		position: [position[0] + w / 2, position[1] + h / 2, position[2]],
		type: "Static",
	}));

	// --- Products for each shelf ---
	const createProductsForShelf = (shelfIndex: number) => {
		const y =
			position[1] +
			shelfIndex * shelfSpacing +
			SHELF_THICKNESS / 2 +
			PRODUCT_SIZE / 2;
		const products: JSX.Element[] = [];
		for (let i = 0; i < productCountPerShelf; i++) {
			const x = position[0] - w / 2 + (i + 0.5) * (w / productCountPerShelf);
			const z = position[2]; // center of shelf
			products.push(
				<Product
					key={`shelf-${shelfIndex}-product-${i}`}
					position={[x, y, z]}
					color={`hsl(${(i * 60) % 360}, 80%, 50%)`}
					name={`Product ${shelfIndex}-${i}`}
				/>
			);
		}
		return products;
	};

	return (
		<group>
			{/* Shelves */}
			<mesh ref={bottomShelfRef} castShadow receiveShadow>
				<boxGeometry args={[w, SHELF_THICKNESS, d]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>
			<mesh ref={middleShelfRef} castShadow receiveShadow>
				<boxGeometry args={[w, SHELF_THICKNESS, d]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>
			<mesh ref={topShelfRef} castShadow receiveShadow>
				<boxGeometry args={[w, SHELF_THICKNESS, d]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>

			{/* Back and sides */}
			<mesh ref={backRef} castShadow receiveShadow>
				<boxGeometry args={[w, h, 0.05]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>
			<mesh ref={leftRef} castShadow receiveShadow>
				<boxGeometry args={[0.05, h, d]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>
			<mesh ref={rightRef} castShadow receiveShadow>
				<boxGeometry args={[0.05, h, d]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>

			{/* Products */}
			{createProductsForShelf(0)}
			{createProductsForShelf(1)}
			{createProductsForShelf(2)}
		</group>
	);
}
