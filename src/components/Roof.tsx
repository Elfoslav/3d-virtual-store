import { usePlane } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ROOF_HEIGHT, ROOF_SIZE } from "../lib/consts";

export default function Roof() {
	const texture = useTexture("/textures/roof.jpg");
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(10, 10);

	// Physics plane (optional, only if you want collisions with roof)
	const [ref] = usePlane(() => ({
		rotation: [Math.PI / 2, 0, 0], // flipped from floor
		position: [0, ROOF_HEIGHT, 0], // height of roof above floor
		type: "Static",
	}));

	return (
		<mesh
			ref={ref}
			position={[0, ROOF_HEIGHT, 0]}
			rotation={[Math.PI / 2, 0, 0]}
			receiveShadow
		>
			<planeGeometry args={ROOF_SIZE} />
			<meshStandardMaterial map={texture} roughness={0.8} />
		</mesh>
	);
}
