import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { SoftShadows } from "@react-three/drei";
import { EffectComposer, SSAO, Bloom } from "@react-three/postprocessing";
import { isMobile } from "../lib/functions";
import MobileControls from "./MobileControls";
import Floor from "./Floor";
import Wall from "./Wall";
import Player from "./Player";
import Roof from "./Roof";
import { WALL_OFFSET_X, WALL_OFFSET_Z, WALL_POSITION_Y } from "../lib/consts";
import ShelvesGroup from "./ShelvesGroup";
import { Loader } from "./Loader";
import { TextureProvider } from "../lib/context/TextureContext";
import { Cart, CartItem, Product } from "../lib/models";

export type VirtualShopProps = {
	products: Product[];
	cart?: Cart;
	onAddToCart?: (productId: string, quantity: number) => void;
	onCheckout?: () => void;
};

// ---------- VirtualShop ----------
export default function VirtualShop({
	products = [],
	cart,
	onAddToCart,
	onCheckout,
}: VirtualShopProps) {
	const [cartLocal, setCartLocal] = useState<CartItem[]>([]);
	const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
	const [pointerLocked, setPointerLocked] = useState(false);
	const [focusedProduct, setFocusedProduct] = useState<string | null>(null);
	const sceneRef = useRef<THREE.Group>(null);
	const canvasWrapperRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<THREE.WebGLRenderer>(null);
	const focusedRef = useRef<string | null>(null);
	const [showOverlay, setShowOverlay] = useState(true);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		document.title = "3D Virtual Shop";

		// canvas cleanup
		const renderer = canvasRef.current; // this is the THREE.WebGLRenderer

		return () => {
			// Properly dispose on unmount
			renderer?.dispose();
			renderer?.forceContextLoss?.();
		};
	}, []);

	const handlePick = (productName: string) => {
		setCartLocal((prev) => {
			const existing = prev.find((p) => p.name === productName);
			return existing
				? prev.map((p) =>
						p.name === productName ? { ...p, quantity: p.quantity + 1 } : p
				  )
				: [...prev, { name: productName, quantity: 1 }];
		});
	};

	const handleCanvasClick = () => {
		if (!pointerLocked && !isMobile()) {
			const canvas = canvasWrapperRef.current?.querySelector(
				"canvas"
			) as HTMLCanvasElement;
			canvas?.requestPointerLock?.();
		}
	};

	const onEmptyCart = (e: React.SyntheticEvent) => {
		e.preventDefault();
		setCartLocal([]);
	};

	const handleLoaded = () => {
		setLoaded(true);
		setTimeout(() => {
			setShowOverlay(false);
		}, 1300);
	};

	useEffect(() => {
		const listener = () => setPointerLocked(!!document.pointerLockElement);
		document.addEventListener("pointerlockchange", listener);
		return () => document.removeEventListener("pointerlockchange", listener);
	}, []);

	return (
		<div
			ref={canvasWrapperRef}
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
				{cartLocal.length === 0 ? (
					<p>No items</p>
				) : (
					<>
						<ul style={{ paddingLeft: "20px" }}>
							{cartLocal.map((item, i) => (
								<li key={i}>
									{item.name} ({item.quantity}x)
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
					canvasRef.current = gl;
					gl.shadowMap.enabled = true;
					gl.shadowMap.type = THREE.PCFSoftShadowMap;
					gl.toneMapping = THREE.ACESFilmicToneMapping;
					gl.toneMappingExposure = 1.1;
					gl.setSize(window.innerWidth, window.innerHeight);
					camera.updateProjectionMatrix();
				}}
			>
				<Suspense fallback={<Loader onLoaded={handleLoaded} />}>
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
								<Roof />
								<Floor />

								{/* Walls */}
								<Wall position={[0, WALL_POSITION_Y, -WALL_OFFSET_Z]} />
								<Wall position={[0, WALL_POSITION_Y, WALL_OFFSET_Z]} />
								<Wall
									position={[-WALL_OFFSET_X, WALL_POSITION_Y, 0]}
									rotation={[0, Math.PI / 2, 0]}
								/>
								<Wall
									position={[WALL_OFFSET_X, WALL_POSITION_Y, 0]}
									rotation={[0, Math.PI / 2, 0]}
								/>

								{/* Shelves with products */}
								<ShelvesGroup products={products} />
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
				</Suspense>
			</Canvas>

			{/* Fade-in overlay */}
			{showOverlay && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						background: "#000",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						color: "#fff",
						fontSize: "2rem",
						fontWeight: 600,
						pointerEvents: "none",
						transition: "opacity 1s ease",
						opacity: loaded ? 0 : 1,
						zIndex: 100,
					}}
				></div>
			)}
		</div>
	);
}
