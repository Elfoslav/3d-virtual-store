// TextureContext.tsx
import { createContext, useContext } from "react";
import * as THREE from "three";

type Textures = {
	floor: THREE.Texture;
	shelf: THREE.Texture;
	products: THREE.Texture[];
};

const TextureContext = createContext<Textures | null>(null);

export const useTextures = () => {
	const context = useContext(TextureContext);
	if (!context)
		throw new Error("useTextures must be used within a TextureProvider");
	return context;
};

export default TextureContext;
