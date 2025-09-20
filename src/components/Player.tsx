import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PointerLockControls, PerspectiveCamera } from "@react-three/drei";
import { isMobile, useWASD } from "../lib/functions";
import { useBox } from "@react-three/cannon";

export default function Player({
	onPick,
	sceneRef,
	mobileMove,
	focusedRef,
	setFocusedProduct,
}: {
	onPick: (name: string) => void;
	sceneRef: React.RefObject<THREE.Group | null>;
	mobileMove: { x: number; y: number };
	focusedRef: React.MutableRefObject<string | null>;
	setFocusedProduct: React.Dispatch<React.SetStateAction<string | null>>;
}) {
	const cam = useRef<THREE.PerspectiveCamera>(null!);
	const raycaster = useRef(new THREE.Raycaster());
	const { forward, backward, left, right, sprint } = useWASD();
	// ⬇️ Physics body for player
	const [ref, api] = useBox(() => ({
		mass: 1,
		args: [0.5, 2.2, 0.5],
		position: [0, 1, 5],
		linearDamping: 0.8, // smaller damping → slides faster
		angularDamping: 1,
		fixedRotation: true,
	}));

	const dir = new THREE.Vector3();
	const rightVec = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);

	// Track physics position
	const vel = useRef<[number, number, number]>([0, 0, 0]);
	const pos = useRef<[number, number, number]>([0, 0, 0]);

	useEffect(() => api.velocity.subscribe((v) => (vel.current = v)), [api]);
	useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api]);

	// --- movement & raycasting ---
	useFrame((_, delta) => {
		if (!cam.current) return;

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

		let baseSpeed = sprint() ? 20 : 17;
		if (isMobile()) {
			baseSpeed = 20; // faster base speed on mobile
		}

		// Movement vector
		const moveDir = new THREE.Vector3();
		moveDir.addScaledVector(dir, mz);
		moveDir.addScaledVector(rightVec, mx);

		if (moveDir.lengthSq() > 0) {
			moveDir.normalize().multiplyScalar(baseSpeed);
		}

		// 🚀 Apply velocity to Cannon body
		api.velocity.set(moveDir.x, 0, moveDir.z);

		// Raycast for focused product
		if (cam.current && sceneRef.current) {
			const ray = raycaster.current;
			const camPos = cam.current.getWorldPosition(new THREE.Vector3());
			const camDir = cam.current.getWorldDirection(new THREE.Vector3());

			ray.set(camPos, camDir);

			// Raycast against all children of the scene
			const hits = ray.intersectObjects(sceneRef.current.children, true);

			// Find the first product that is not occluded
			let visibleProduct: string | null = null;

			for (const hit of hits) {
				const obj = hit.object;

				if (obj.userData.productName) {
					// If first hit is the product itself, it's visible
					visibleProduct = obj.userData.productName;
					break;
				} else if (obj.userData.isShelf) {
					// Hit a shelf first -> product is blocked
					break;
				}
				// else: some other object, keep checking
			}

			focusedRef.current = visibleProduct;
			setFocusedProduct(visibleProduct);
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
		[onPick, sceneRef, focusedRef] // ✅ only depends on onPick
	);

	// --- Mobile tap detection ---
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

	// --- Desktop click detection ---
	useEffect(() => {
		if (isMobile()) return; // skip on mobile

		const handleClick = () => {
			if (!document.pointerLockElement) return;
			if (focusedRef.current) {
				onPick(focusedRef.current);
			}
		};

		window.addEventListener("click", handleClick);
		return () => window.removeEventListener("click", handleClick);
	}, [focusedRef, onPick]);

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
		const handleResize = () => {
			if (cam.current) {
				cam.current.aspect = window.innerWidth / window.innerHeight;
				cam.current.updateProjectionMatrix();
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		if (!isMobile() || !cam.current) return;
		let lastX = 0,
			lastY = 0;

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			if (e.touches.length === 1) {
				const MAX_PITCH = THREE.MathUtils.degToRad(70); // ~70 degrees
				const MIN_PITCH = -MAX_PITCH;
				const touch = e.touches[0];
				const dx = touch.clientX - lastX;
				const dy = touch.clientY - lastY;
				cam.current.rotation.y -= dx * 0.003;
				cam.current.rotation.x -= dy * 0.003;
				lastX = touch.clientX;
				lastY = touch.clientY;
				// clamp pitch - do not allow user to turn the camera upside down
				cam.current.rotation.x = Math.max(
					MIN_PITCH,
					Math.min(MAX_PITCH, cam.current.rotation.x)
				);
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
		<group ref={ref} position={[0, 1.5, 8]}>
			<PerspectiveCamera ref={cam} makeDefault fov={75}>
				{/* Crosshair group */}
				<group position={[0, 0, -1]}>
					{/* Vertical line */}
					<mesh>
						<planeGeometry args={[0.005, 0.05]} />
						<meshBasicMaterial color="white" />
					</mesh>
					{/* Horizontal line */}
					<mesh>
						<planeGeometry args={[0.05, 0.005]} />
						<meshBasicMaterial color="white" />
					</mesh>
				</group>
			</PerspectiveCamera>
			{!isMobile() && <PointerLockControls />}
		</group>
	);
}
