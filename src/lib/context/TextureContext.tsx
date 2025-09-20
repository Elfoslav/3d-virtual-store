// TextureContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Context type
interface Textures {
	floor: THREE.Texture;
	wall: THREE.Texture;
	shelf: THREE.Texture;
	products: THREE.Texture[];
}

const TextureContext = createContext<Textures | null>(null);

export const useTextures = () => {
	const ctx = useContext(TextureContext);
	if (!ctx) throw new Error("useTextures must be used inside TextureProvider");
	return ctx;
};

// Provider component
export const TextureProvider = ({ children }: { children: ReactNode }) => {
	const [textures, setTextures] = useState<Textures | null>(null);

	// Render the loader inside Suspense until textures are ready
	if (!textures) return <TextureLoader onLoaded={setTextures} />;

	return (
		<TextureContext.Provider value={textures}>
			{children}
		</TextureContext.Provider>
	);
};

// Suspense-safe loader
const TextureLoader = ({
	onLoaded,
}: {
	onLoaded: (textures: Textures) => void;
}) => {
	const floor = useLoader(THREE.TextureLoader, "/textures/floor-marble.jpg");
	const wall = useLoader(THREE.TextureLoader, "/textures/wall.jpeg");
	const shelf = useLoader(THREE.TextureLoader, "/textures/wood-light.jpeg");
	const products = useLoader(THREE.TextureLoader, [
		"/products-images/bg-original.webp",
		"/products-images/gita-02.jpg",
		"/products-images/bg-original.webp",
		"/products-images/gita-02.jpg",
		"/products-images/bg-original.webp",
	]);

	// Safe mutations after load
	floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
	floor.repeat.set(35, 35);

	wall.anisotropy = 4;
	wall.wrapS = wall.wrapT = THREE.RepeatWrapping;
	wall.repeat.set(5, 1);

	onLoaded({ floor, wall, shelf, products });
	return null;
};
