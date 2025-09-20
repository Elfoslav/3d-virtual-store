import * as THREE from "three";
import { ROOF_HEIGHT, ROOF_SIZE } from "../lib/consts";

export default function Roof() {
	const [width, depth] = ROOF_SIZE;

	// Wider spacing = fewer lamps
	const spacing = 8;
	const positions: [number, number][] = [];
	for (let x = -width / 2 + spacing; x < width / 2; x += spacing) {
		for (let z = -depth / 2 + spacing; z < depth / 2; z += spacing) {
			positions.push([x, z]);
		}
	}

	return (
		<group position={[0, ROOF_HEIGHT, 0]}>
			{/* Roof plane (underside visible) */}
			<mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={ROOF_SIZE} />
				<meshStandardMaterial
					color="#ffffff"
					emissive="#eeeeee"
					emissiveIntensity={0.5}
					roughness={0.6}
					metalness={0.1}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Lamps with fewer instances */}
			{positions.map(([x, z], i) => (
				<group key={i} position={[x, -0.5, z]}>
					{/* lamp body */}
					<mesh>
						<cylinderGeometry args={[0.2, 0.25, 0.4, 12]} />
						<meshStandardMaterial
							color="black"
							metalness={0.6}
							roughness={0.4}
						/>
					</mesh>
					{/* bulb */}
					<mesh position={[0, -0.35, 0]}>
						<sphereGeometry args={[0.15, 16, 16]} />
						<meshStandardMaterial
							color="white"
							emissive="white"
							emissiveIntensity={1.5}
							roughness={0.2}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}
