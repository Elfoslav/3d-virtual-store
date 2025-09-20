import { useBox } from "@react-three/cannon";
import { WALL_DIMENSIONS } from "../lib/consts";
import { useTextures } from "../lib/context/TextureContext";

export default function Wall({
	position,
	rotation,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	const { wall: texture } = useTextures();
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
