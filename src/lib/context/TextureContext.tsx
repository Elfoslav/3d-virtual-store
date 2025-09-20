import { createContext, useContext } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const TextureContext = createContext<{
	floor: THREE.Texture;
	shelf: THREE.Texture;
	products: THREE.Texture[];
} | null>(null);

export const TextureProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const floor = useTexture("/textures/floor-marble.jpg");
	const shelf = useTexture("/textures/wood-light.jpeg");
	const products = useTexture([
		"/products-images/bg-original.webp",
		"/products-images/gita-02.jpg",
		"/products-images/bg-original.webp",
		"/products-images/gita-02.jpg",
		"/products-images/bg-original.webp",
	]);

	// Optional: repeat / wrapping
	floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
	floor.repeat.set(35, 35);

	const value = { floor, shelf, products };
	return (
		<TextureContext.Provider value={value}>{children}</TextureContext.Provider>
	);
};

export const useTextures = () => {
	const ctx = useContext(TextureContext);
	if (!ctx) throw new Error("useTextures must be used inside TextureProvider");
	return ctx;
};
