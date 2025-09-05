// App.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
	PointerLockControls,
	PerspectiveCamera,
	SoftShadows,
	useTexture,
} from "@react-three/drei";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";

// --- Floor component with texture ---
function Floor() {
	const texture = useTexture("/textures/floor.jpeg"); // add a floor texture
	texture.anisotropy = 4;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(10, 10);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
			<planeGeometry args={[50, 50]} />
			<meshStandardMaterial map={texture} roughness={0.8} />
		</mesh>
	);
}

// --- Wall component ---
function Wall({
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

// --- Shelf with wood texture ---
function Shelf({ position }: { position: [number, number, number] }) {
	const woodTexture = useTexture("/textures/wood-light.jpeg");
	woodTexture.anisotropy = 4;
	woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
	woodTexture.repeat.set(1, 1);

	return (
		<group position={position}>
			<mesh position={[0, 1, 0]} castShadow receiveShadow>
				<boxGeometry args={[4, 2, 0.1]} />
				<meshStandardMaterial map={woodTexture} roughness={0.6} />
			</mesh>
			{[0.5, 1.1, 1.7].map((y, i) => (
				<mesh key={i} position={[0, y, 0.3]} castShadow receiveShadow>
					<boxGeometry args={[3.6, 0.1, 0.6]} />
					<meshStandardMaterial map={woodTexture} roughness={0.6} />
				</mesh>
			))}
		</group>
	);
}

// --- Product with optional highlight ---
function Product({
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
	return (
		<mesh
			position={position}
			userData={{ productName: name }}
			castShadow
			receiveShadow
		>
			<boxGeometry args={[0.4, 0.4, 0.4]} />
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

// --- Player and movement remain mostly the same ---
function useWASD() {
	const keysRef = useRef<Record<string, boolean>>({});
	useEffect(() => {
		const down = (e: KeyboardEvent) => (keysRef.current[e.code] = true);
		const up = (e: KeyboardEvent) => (keysRef.current[e.code] = false);
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
		};
	}, []);
	const is = (code: string) => !!keysRef.current[code];
	return {
		forward: () => is("KeyW") || is("ArrowUp"),
		backward: () => is("KeyS") || is("ArrowDown"),
		left: () => is("KeyA") || is("ArrowLeft"),
		right: () => is("KeyD") || is("ArrowRight"),
		sprint: () => is("ShiftLeft") || is("ShiftRight"),
	};
}

function Player({
	onPick,
	setFocusedProduct,
	sceneRef,
}: {
	onPick: (name: string) => void;
	setFocusedProduct: (name: string | null) => void;
	sceneRef: React.RefObject<THREE.Group | null>;
}) {
	const group = useRef<THREE.Group>(null!);
	const cam = useRef<THREE.PerspectiveCamera>(null!);
	const raycaster = useRef(new THREE.Raycaster());
	const { forward, backward, left, right, sprint } = useWASD();

	const dir = new THREE.Vector3();
	const rightVec = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);

	useFrame((_, delta) => {
		if (!group.current || !cam.current) return;

		cam.current.getWorldDirection(dir);
		dir.y = 0;
		dir.normalize();
		rightVec.crossVectors(up, dir).normalize();

		let mx = 0,
			mz = 0;
		if (forward()) mz += 1;
		if (backward()) mz -= 1;
		if (left()) mx += 1;
		if (right()) mx -= 1;
		if (mx !== 0 && mz !== 0) {
			const inv = 1 / Math.sqrt(2);
			mx *= inv;
			mz *= inv;
		}

		const baseSpeed = sprint() ? 4 : 2;
		const speed = baseSpeed * delta;
		group.current.position.addScaledVector(dir, mz * speed);
		group.current.position.addScaledVector(rightVec, mx * speed);
		group.current.position.x = THREE.MathUtils.clamp(
			group.current.position.x,
			-22,
			22
		);
		group.current.position.z = THREE.MathUtils.clamp(
			group.current.position.z,
			-22,
			22
		);

		// Raycast for focused product
		if (sceneRef.current) {
			raycaster.current.set(
				cam.current.getWorldPosition(new THREE.Vector3()),
				cam.current.getWorldDirection(new THREE.Vector3())
			);
			const intersects = raycaster.current
				.intersectObjects(sceneRef.current.children, true)
				.filter((i) => i.object.userData.productName);

			setFocusedProduct(intersects[0]?.object.userData.productName || null);
		}
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "KeyE" && sceneRef.current) {
				raycaster.current.set(
					cam.current.getWorldPosition(new THREE.Vector3()),
					cam.current.getWorldDirection(new THREE.Vector3())
				);
				const intersects = raycaster.current
					.intersectObjects(sceneRef.current.children, true)
					.filter((i) => i.object.userData.productName);
				if (intersects.length > 0)
					onPick(intersects[0].object.userData.productName);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onPick, sceneRef]);

	return (
		<group ref={group} position={[0, 1.6, 8]}>
			<PerspectiveCamera ref={cam} makeDefault fov={75}>
				<mesh position={[0, 0, -1]}>
					<planeGeometry args={[0.02, 0.02]} />
					<meshBasicMaterial color="white" />
				</mesh>
			</PerspectiveCamera>
			<PointerLockControls />
		</group>
	);
}

// --- Main App ---
export default function App() {
	const [cart, setCart] = useState<string[]>([]);
	const [pointerLocked, setPointerLocked] = useState(false);
	const [focusedProduct, setFocusedProduct] = useState<string | null>(null);
	const sceneRef = useRef<THREE.Group>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const shelfPosition = [0, 0, 4] as [number, number, number];

	const handlePick = (productName: string) => {
		setCart((prev) => [...prev, productName]);
	};

	const handleCanvasClick = () => {
		if (!pointerLocked) {
			const canvas = canvasRef.current?.querySelector(
				"canvas"
			) as HTMLCanvasElement;
			if (canvas?.requestPointerLock) canvas.requestPointerLock();
		}
	};

	useEffect(() => {
		const onLock = () => setPointerLocked(true);
		const onUnlock = () => setPointerLocked(false);
		const listener = () => {
			if (document.pointerLockElement) onLock();
			else onUnlock();
		};
		document.addEventListener("pointerlockchange", listener);
		return () => document.removeEventListener("pointerlockchange", listener);
	}, []);

	return (
		<div
			ref={canvasRef}
			style={{ width: "100vw", height: "100vh" }}
			onClick={handleCanvasClick}
		>
			<div
				style={{
					position: "absolute",
					top: 10,
					right: 10,
					zIndex: 10,
					background: "white",
					padding: "10px",
					borderRadius: "8px",
				}}
			>
				<h3>🛒 Cart</h3>
				{cart.length === 0 ? (
					<p>No items</p>
				) : (
					<ul>
						{cart.map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				)}
			</div>

			{focusedProduct && (
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: "yellow",
						fontWeight: "bold",
						padding: "4px 8px",
						backgroundColor: "rgba(0,0,0,0.5)",
						borderRadius: "4px",
						pointerEvents: "none",
						zIndex: 10,
					}}
				>
					{focusedProduct}
				</div>
			)}

			<Canvas
				shadows
				gl={{ antialias: true }}
				camera={{ fov: 75, near: 0.1, far: 100 }}
				onCreated={({ gl }) => {
					gl.shadowMap.enabled = true;
					gl.shadowMap.type = THREE.PCFSoftShadowMap;
					gl.toneMapping = THREE.ACESFilmicToneMapping;
					gl.toneMappingExposure = 1.1;
				}}
			>
				<SoftShadows size={25} samples={8} focus={0.5} />
				{/* Lights */}
				<ambientLight intensity={0.3} />
				<hemisphereLight groundColor={0x444444} intensity={0.6} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1.2}
					castShadow
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-near={0.5}
					shadow-camera-far={30}
				/>

				<Player
					onPick={handlePick}
					setFocusedProduct={setFocusedProduct}
					sceneRef={sceneRef}
				/>

				<group ref={sceneRef}>
					<Floor />
					<Wall position={[0, 1.5, -25]} />
					<Wall position={[-25, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} />
					<Wall position={[25, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} />
					<Shelf position={shelfPosition} />
					{[
						{
							position: [
								shelfPosition[0] + 1.2,
								1.7 + 0.25,
								shelfPosition[2] + 0.4,
							] as [number, number, number],
							color: "red",
							name: "Red Cube",
						},
						{
							position: [
								shelfPosition[0],
								1.1 + 0.25,
								shelfPosition[2] + 0.4,
							] as [number, number, number],
							color: "blue",
							name: "Blue Cube",
						},
						{
							position: [
								shelfPosition[0] - 1.2,
								0.5 + 0.25,
								shelfPosition[2] + 0.4,
							] as [number, number, number],
							color: "green",
							name: "Green Cube",
						},
					].map((p) => (
						<Product
							key={p.name}
							{...p}
							highlight={focusedProduct === p.name}
						/>
					))}
				</group>

				{/* Postprocessing */}
				<EffectComposer multisampling={0} resolutionScale={0.75}>
					<SSAO samples={8} radius={0.05} intensity={20} />
					<Bloom
						luminanceThreshold={0.3}
						luminanceSmoothing={0.9}
						height={300}
					/>
				</EffectComposer>
			</Canvas>
		</div>
	);
}
