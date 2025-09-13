import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PointerLockControls, PerspectiveCamera } from "@react-three/drei";
import { isMobile, useWASD } from "../lib/functions";

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
	const group = useRef<THREE.Group>(null!);
	const cam = useRef<THREE.PerspectiveCamera>(null!);
	const raycaster = useRef(new THREE.Raycaster());
	const { forward, backward, left, right, sprint } = useWASD();

	const dir = new THREE.Vector3();
	const rightVec = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);

	// --- movement & raycasting ---
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
