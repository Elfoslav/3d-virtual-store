// App.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { SoftShadows, useTexture } from "@react-three/drei";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";
import { isMobile } from "./lib/functions";
import MobileControls from "./components/MobileControls";
import Player from "./components/Player";

// ---------- Floor ----------
function Floor() {
	const texture = useTexture("/textures/floor.jpeg");
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

// ---------- Wall ----------
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

// ---------- Shelf ----------
function Shelf({ position }: { position: [number, number, number] }) {
	const groupRef = useRef<THREE.Group>(null);
	const bboxRef = useRef<THREE.Box3>(null);
	const woodTexture = useTexture("/textures/wood-light.jpeg");
	woodTexture.anisotropy = 4;
	woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;

	useEffect(() => {
		if (groupRef.current) {
			const box = new THREE.Box3().setFromObject(groupRef.current);
			bboxRef.current = box;
		}
	}, []);

	return (
		<group ref={groupRef} position={position} userData={{ bboxRef }}>
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

// ---------- Product ----------
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

// ---------- CartItem ----------
type CartItem = { name: string; count: number };

// ---------- Main App ----------
export default function App() {
	const [cart, setCart] = useState<CartItem[]>([]);
	const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
	const [pointerLocked, setPointerLocked] = useState(false);
	const [focusedProduct, setFocusedProduct] = useState<string | null>(null);
	const sceneRef = useRef<THREE.Group>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const focusedRef = useRef<string | null>(null);

	const handlePick = (productName: string) => {
		setCart((prev) => {
			const existing = prev.find((p) => p.name === productName);
			return existing
				? prev.map((p) =>
						p.name === productName ? { ...p, count: p.count + 1 } : p
				  )
				: [...prev, { name: productName, count: 1 }];
		});
	};

	const handleCanvasClick = () => {
		if (!pointerLocked && !isMobile()) {
			const canvas = canvasRef.current?.querySelector(
				"canvas"
			) as HTMLCanvasElement;
			canvas?.requestPointerLock?.();
		}
	};

	const onEmptyCart = (e: React.SyntheticEvent) => {
		e.preventDefault();
		setCart([]);
	};

	useEffect(() => {
		const listener = () => setPointerLocked(!!document.pointerLockElement);
		document.addEventListener("pointerlockchange", listener);
		return () => document.removeEventListener("pointerlockchange", listener);
	}, []);

	const shelfPosition = [0, 0, 4] as [number, number, number];

	return (
		<div
			ref={canvasRef}
			style={{ width: "100vw", height: "100vh" }}
			onClick={handleCanvasClick}
		>
			{/* Cart */}
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

			{/* Crosshair in center */}
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					fontSize: "24px",
					color: "white",
					zIndex: 20,
					pointerEvents: "none",
					textAlign: "center",
				}}
			>
				+
			</div>

			{/* Focused Product Overlay */}
			{focusedRef.current && (
				<div
					style={{
						position: "absolute",
						top: "46%",
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
					{focusedRef.current}
				</div>
			)}

			{isMobile() && <MobileControls setMove={setMobileMove} />}

			{/* 3D Scene */}
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
					sceneRef={sceneRef}
					mobileMove={mobileMove}
					focusedRef={focusedRef}
					setFocusedProduct={setFocusedProduct}
				/>

				<group ref={sceneRef}>
					<Floor />
					<Wall position={[0, 1.5, -25]} />
					<Wall position={[0, 1.5, 25]} />
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
					]
						// .filter((p) => !cart.find((c) => c.name === p.name))
						.map((p) => (
							<Product
								key={p.name}
								{...p}
								highlight={focusedProduct === p.name}
							/>
						))}
				</group>

				<EffectComposer
					enableNormalPass
					multisampling={0}
					resolutionScale={0.75}
				>
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
