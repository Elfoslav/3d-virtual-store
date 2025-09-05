// App.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PointerLockControls, PerspectiveCamera } from "@react-three/drei";

function Floor() {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
			<planeGeometry args={[50, 50]} />
			<meshStandardMaterial color="#dcdcdc" />
		</mesh>
	);
}

function Wall({
	position,
	rotation,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow receiveShadow>
			<boxGeometry args={[50, 3, 0.2]} />
			<meshStandardMaterial color="#f2f2f2" />
		</mesh>
	);
}

function Shelf({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			{/* Back board */}
			<mesh position={[0, 1, 0]}>
				<boxGeometry args={[4, 2, 0.1]} />
				<meshStandardMaterial color="#8b5a2b" />
			</mesh>
			{/* Shelves */}
			{[0.5, 1.1, 1.7].map((y, i) => (
				<mesh key={i} position={[0, y, 0.3]}>
					<boxGeometry args={[3.6, 0.1, 0.6]} />
					<meshStandardMaterial color="#a46a32" />
				</mesh>
			))}
		</group>
	);
}

function Product({
	position,
	color,
	name,
}: {
	position: [number, number, number];
	color: string;
	name: string;
}) {
	return (
		<mesh position={position} userData={{ productName: name }}>
			<boxGeometry args={[0.4, 0.4, 0.4]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}

/** Simple keyboard state (no drei dependencies) */
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

export function Player({
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
	const controlsRef = useRef<any>(null);
	const raycaster = useRef(new THREE.Raycaster());
	const { forward, backward, left, right, sprint } = useWASD();

	const dir = new THREE.Vector3();
	const rightVec = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);

	// Movement + raycast for focused product
	useFrame((_, delta) => {
		if (!group.current || !cam.current) return;

		// --- Movement ---
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

		const baseSpeed = sprint() ? 8 : 4;
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

		// --- Raycast from camera ---
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

	// --- Pick product on E ---
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
				{/* Crosshair */}
				<mesh position={[0, 0, -1]}>
					<planeGeometry args={[0.02, 0.02]} />
					<meshBasicMaterial color="white" />
				</mesh>
			</PerspectiveCamera>
			<PointerLockControls ref={controlsRef} />
		</group>
	);
}

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
			// first click -> lock pointer
			const canvas = canvasRef.current?.querySelector(
				"canvas"
			) as HTMLCanvasElement;
			if (canvas?.requestPointerLock) {
				canvas.requestPointerLock();
			}
		}
	};

	useEffect(() => {
		const onLock = () => setPointerLocked(true);
		const onUnlock = () => setPointerLocked(false);

		document.addEventListener("pointerlockchange", () => {
			if (document.pointerLockElement) onLock();
			else onUnlock();
		});

		return () => document.removeEventListener("pointerlockchange", () => {});
	}, []);

	return (
		<div
			ref={canvasRef}
			style={{ width: "100vw", height: "100vh" }}
			onClick={handleCanvasClick}
		>
			{/* Cart UI overlay */}
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
						pointerEvents: "none", // doesn't block clicks
						zIndex: 10,
					}}
				>
					{focusedProduct}
				</div>
			)}

			<Canvas shadows>
				<hemisphereLight groundColor={0x444444} intensity={0.6} />
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-near={0.5}
					shadow-camera-far={50}
				/>
				{/* Player gets `handlePick` callback */}
				<Player
					onPick={handlePick}
					setFocusedProduct={setFocusedProduct}
					sceneRef={sceneRef}
				/>
				{/* Environment, shelves, products */}
				<group ref={sceneRef}>
					<Floor />
					<Shelf position={shelfPosition} />
					<Product
						position={[
							shelfPosition[0] + 1.2,
							1.7 + 0.25,
							shelfPosition[2] + 0.4,
						]}
						color="red"
						name="Red Cube"
					/>{" "}
					<Product
						position={[shelfPosition[0], 1.1 + 0.25, shelfPosition[2] + 0.4]}
						color="blue"
						name="Blue Cube"
					/>{" "}
					<Product
						position={[
							shelfPosition[0] - 1.2,
							0.5 + 0.25,
							shelfPosition[2] + 0.4,
						]}
						color="green"
						name="Green Cube"
					/>
				</group>
			</Canvas>
		</div>
	);
}
