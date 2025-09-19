import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useBox } from "@react-three/cannon";
import { WALL_DIMENSIONS } from "../lib/consts";

export default function Wall({
	position,
	rotation,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	const texture = useTexture("/textures/wall.jpeg");
	texture.anisotropy = 4;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(5, 1);

	const [ref] = useBox(() => ({
		args: WALL_DIMENSIONS,
		position,
		rotation,
		type: "Static",
	}));

	return (
		<mesh
			ref={ref}
			position={position}
			rotation={rotation}
			castShadow
			receiveShadow
		>
			<boxGeometry args={WALL_DIMENSIONS} />
			<meshStandardMaterial map={texture} roughness={0.9} />
		</mesh>
	);
}
