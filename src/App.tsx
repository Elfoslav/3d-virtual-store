// App.tsx
import {
	TouchEventHandler,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
	PointerLockControls,
	PerspectiveCamera,
	SoftShadows,
	useTexture,
} from "@react-three/drei";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";
import { isMobile } from "./lib/functions";
import MobileControls from "./components/MobileControls";

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
	focusedProduct,
	setFocusedProduct,
	sceneRef,
	mobileMove,
}: {
	onPick: (name: string) => void;
	focusedProduct: string | null;
	setFocusedProduct: (name: string | null) => void;
	sceneRef: React.RefObject<THREE.Group | null>;
	mobileMove: { x: number; y: number };
}) {
	const group = useRef<THREE.Group>(null!);
	const cam = useRef<THREE.PerspectiveCamera>(null!);
	const raycaster = useRef(new THREE.Raycaster());
	const focusedRef = useRef<string | null>(null);
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

		if (isMobile()) {
			// joystick
			mx = -mobileMove.x; // joystick gives x,y
			mz = mobileMove.y;
		} else {
			// keyboard
			if (forward()) mz += 1;
			if (backward()) mz -= 1;
			if (left()) mx += 1;
			if (right()) mx -= 1;
		}

		let baseSpeed = sprint() ? 4 : 2;
		if (isMobile()) {
			baseSpeed = 3; // faster base speed on mobile
		}
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

			const productName = intersects[0]?.object.userData.productName || null;
			focusedRef.current = productName;
			setFocusedProduct(productName);
		}
	});

	const handlePickClick = useCallback(
		(clientX: number, clientY: number) => {
			if (!sceneRef.current || !cam.current) return;

			const canvas = document.querySelector("canvas");
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();

			const mouse = new THREE.Vector2();
			mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.current.setFromCamera(mouse, cam.current);

			const intersects = raycaster.current
				.intersectObjects(sceneRef.current.children, true)
				.filter((i) => i.object.userData.productName);

			if (focusedRef.current && intersects.length > 0) {
				onPick(intersects[0].object.userData.productName);
			}
		},
		[onPick, sceneRef] // ✅ only depends on onPick
	);

	// mobile tap detection (tap vs drag)
	useEffect(() => {
		if (!isMobile()) return;

		let startX = 0;
		let startY = 0;
		const TAP_THRESHOLD = 10;

		const onTouchStart = (e: TouchEvent) => {
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
		};

		const onTouchEnd = (e: TouchEvent) => {
			const endX = e.changedTouches[0].clientX;
			const endY = e.changedTouches[0].clientY;

			const dx = Math.abs(endX - startX);
			const dy = Math.abs(endY - startY);

			if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
				handlePickClick(endX, endY);
			}
		};

		window.addEventListener("touchstart", onTouchStart, { passive: false });
		window.addEventListener("touchend", onTouchEnd, { passive: false });

		return () => {
			window.removeEventListener("touchstart", onTouchStart);
			window.removeEventListener("touchend", onTouchEnd);
		};
	}, [handlePickClick]);

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

	useEffect(() => {
		if (!isMobile || !cam.current) return;
		let lastX = 0,
			lastY = 0;

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			if (e.touches.length === 1) {
				const touch = e.touches[0];
				const dx = touch.clientX - lastX;
				const dy = touch.clientY - lastY;
				cam.current.rotation.y -= dx * 0.002;
				cam.current.rotation.x -= dy * 0.002;
				lastX = touch.clientX;
				lastY = touch.clientY;
			}
		};

		const handleTouchStart = (e: TouchEvent) => {
			e.preventDefault();
			lastX = e.touches[0].clientX;
			lastY = e.touches[0].clientY;
		};

		window.addEventListener("touchstart", handleTouchStart, { passive: false });
		window.addEventListener("touchmove", handleTouchMove, { passive: false });

		return () => {
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchmove", handleTouchMove);
		};
	}, []);

	return (
		<group ref={group} position={[0, 1.6, 8]}>
			<PerspectiveCamera ref={cam} makeDefault fov={75}>
				<mesh position={[0, 0, -1]}>
					<planeGeometry args={[0.02, 0.02]} />
					<meshBasicMaterial color="white" />
				</mesh>
			</PerspectiveCamera>
			{!isMobile() && <PointerLockControls />}
		</group>
	);
}

type CartItem = {
	name: string;
	count: number;
};

// --- Main App ---
export default function App() {
	const [cart, setCart] = useState<CartItem[]>([]);
	const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
	const [pointerLocked, setPointerLocked] = useState(false);
	const [focusedProduct, setFocusedProduct] = useState<string | null>(null);
	const sceneRef = useRef<THREE.Group>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const shelfPosition = [0, 0, 4] as [number, number, number];

	const handlePick = (productName: string) => {
		setCart((prev) => {
			const existing = prev.find((p) => p.name === productName);
			if (existing) {
				return prev.map((p) =>
					p.name === productName ? { ...p, count: p.count + 1 } : p
				);
			}
			return [...prev, { name: productName, count: 1 }];
		});
	};

	const handleCanvasClick = () => {
		if (!pointerLocked && !isMobile()) {
			const canvas = canvasRef.current?.querySelector(
				"canvas"
			) as HTMLCanvasElement;
			if (canvas?.requestPointerLock) canvas.requestPointerLock();
		}
	};

	const onEmptyCart = (e: React.SyntheticEvent) => {
		e.preventDefault();
		setCart([]);
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
					<>
						<ul style={{ paddingLeft: "20px" }}>
							{cart.map((item, i) => (
								<li key={i}>
									{item.name} ({item.count}x)
								</li>
							))}
						</ul>
						<div style={{ textAlign: "center" }}>
							<button onClick={onEmptyCart} onTouchEnd={onEmptyCart}>
								Clear
							</button>
						</div>
					</>
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

			{isMobile() && <MobileControls setMove={setMobileMove} />}

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
					focusedProduct={focusedProduct}
					setFocusedProduct={setFocusedProduct}
					sceneRef={sceneRef}
					mobileMove={mobileMove}
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
