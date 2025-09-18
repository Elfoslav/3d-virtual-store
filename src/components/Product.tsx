import { useBox } from "@react-three/cannon";

export default function Product({
	position,
	color,
	name,
	highlight,
}: {
	position: [number, number, number];
	color: string;
	name: string;
	highlight?: boolean;
}) {
	const size: [number, number, number] = [0.4, 0.4, 0.4];
	const [ref] = useBox(() => ({
		args: size, // must match geometry size
		position,
		mass: 1, // >0 = dynamic, 0 = static
		userData: { productName: name }, // so Player raycast can detect
	}));

	return (
		<mesh
			ref={ref}
			position={position}
			userData={{ productName: name }}
			castShadow
			receiveShadow
		>
			<boxGeometry args={size} />
			<meshStandardMaterial
				color={color}
				roughness={0.4}
				metalness={0.3}
				emissive={highlight ? 0xffff00 : 0x000000}
				emissiveIntensity={highlight ? 0.4 : 0}
			/>
		</mesh>
	);
}
