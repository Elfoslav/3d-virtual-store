import { useBox } from "@react-three/cannon";
import * as THREE from "three";
import { PRODUCT_DIMENSIONS } from "../lib/consts";
import { Suspense } from "react";

type ProductProps = {
	texture: THREE.Texture;
	position: [number, number, number];
	color?: string;
	name: string;
	highlight?: boolean;
	photoUrl?: string;
	usePhysics?: boolean;
};

export default function Product({
	texture,
	position,
	color = "white",
	name,
	highlight,
	usePhysics = true,
}: ProductProps) {
	// Physics body
	const [ref] = useBox(() => ({
		args: PRODUCT_DIMENSIONS,
		position,
		mass: usePhysics ? 1 : 0,
		userData: { productName: name },
		enabled: usePhysics,
		collisionFilterGroup: 2,
		collisionFilterMask: 1,
	}));

	return (
		<Suspense fallback={null}>
			<mesh
				ref={ref}
				position={position}
				userData={{ productName: name }}
				renderOrder={1}
				castShadow
				receiveShadow
			>
				<boxGeometry args={PRODUCT_DIMENSIONS} />
				<meshStandardMaterial
					color={!texture ? color : undefined}
					map={texture || undefined}
					roughness={0.4}
					metalness={0.3}
					emissive={highlight ? 0xffff00 : 0x000000}
					emissiveIntensity={highlight ? 0.4 : 0}
					side={THREE.FrontSide}
				/>
			</mesh>
		</Suspense>
	);
}
