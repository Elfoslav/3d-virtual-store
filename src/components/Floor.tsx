import { usePlane } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_DIMENSIONS } from "../lib/consts";

export default function Floor() {
	const texture = useTexture("/textures/floor-marble.jpg");
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(35, 35);

	const [ref] = usePlane(() => ({
		rotation: [-Math.PI / 2, 0, 0],
		type: "Static",
	}));

	return (
		<mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={FLOOR_DIMENSIONS} />
			<meshStandardMaterial map={texture} roughness={0.8} />
		</mesh>
	);
}
