import { usePlane } from "@react-three/cannon";
import { FLOOR_DIMENSIONS } from "../lib/consts";
import { Suspense } from "react";
import { useTextures } from "../lib/context/TextureContext";

export default function Floor() {
	const { floor: texture } = useTextures();
	const [ref] = usePlane(() => ({
		rotation: [-Math.PI / 2, 0, 0],
		type: "Static",
	}));

	return (
		<Suspense fallback={null}>
			<mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={FLOOR_DIMENSIONS} />
				<meshStandardMaterial map={texture} roughness={0.8} />
			</mesh>
		</Suspense>
	);
}
