import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { SoftShadows } from "@react-three/drei";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";
import { isMobile } from "./lib/functions";
import MobileControls from "./components/MobileControls";
import Floor from "./components/Floor";
import Wall from "./components/Wall";
import Player from "./components/Player";
import Roof from "./components/Roof";
import { WALL_OFFSET, WALL_POSITION_Y } from "./lib/consts";
import ShelvesGroup from "./components/ShelvesGroup";
import { Loader } from "./components/Loader";
import { TextureProvider } from "./lib/context/TextureContext";

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

			{/* Focused Product Overlay Text */}
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
				style={{ width: "100vw", height: "100vh" }}
				shadows
				gl={{ antialias: true }}
				camera={{ fov: 75, near: 0.1, far: 100 }}
				onCreated={({ gl, camera }) => {
					gl.shadowMap.enabled = true;
					gl.shadowMap.type = THREE.PCFSoftShadowMap;
					gl.toneMapping = THREE.ACESFilmicToneMapping;
					gl.toneMappingExposure = 1.1;
					gl.setSize(window.innerWidth, window.innerHeight);
					camera.updateProjectionMatrix();
				}}
			>
				<TextureProvider>
					<SoftShadows size={25} samples={8} focus={0.5} />
					<ambientLight intensity={0.4} />
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
					<Physics gravity={[0, -9.81, 0]} iterations={10}>
						<Player
							onPick={handlePick}
							sceneRef={sceneRef}
							mobileMove={mobileMove}
							focusedRef={focusedRef}
							setFocusedProduct={setFocusedProduct}
						/>

						<group ref={sceneRef}>
							<Suspense fallback={<Loader />}>
								<Roof />
								<Floor />

								{/* Front wall */}
								<Wall position={[0, WALL_POSITION_Y, -WALL_OFFSET]} />
								{/* Back wall */}
								<Wall position={[0, WALL_POSITION_Y, WALL_OFFSET]} />
								{/* Left wall */}
								<Wall
									position={[-WALL_OFFSET, WALL_POSITION_Y, 0]}
									rotation={[0, Math.PI / 2, 0]}
								/>
								{/* Right wall */}
								<Wall
									position={[WALL_OFFSET, WALL_POSITION_Y, 0]}
									rotation={[0, Math.PI / 2, 0]}
								/>
								<ShelvesGroup />
							</Suspense>
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
					</Physics>
				</TextureProvider>
			</Canvas>
		</div>
	);
}
