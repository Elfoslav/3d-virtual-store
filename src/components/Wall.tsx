import * as THREE from "three";
import { useTexture } from "@react-three/drei";

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

	return (
		<mesh position={position} rotation={rotation} castShadow receiveShadow>
			<boxGeometry args={[50, 3, 0.2]} />
			<meshStandardMaterial map={texture} roughness={0.9} />
		</mesh>
	);
}
