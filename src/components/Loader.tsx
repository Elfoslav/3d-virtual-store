import { Html, useProgress } from "@react-three/drei";

export function Loader({ onLoaded }: { onLoaded: () => void }) {
	const { progress } = useProgress(); // progress 0–100

	if (progress === 100) {
		setTimeout(() => onLoaded(), 100); // slight delay to allow final render
	}

	return (
		<Html center>
			<div
				style={{
					color: "#fff",
					fontSize: "2rem",
					fontWeight: 600,
					textAlign: "center",
				}}
			>
				Loading {Math.floor(progress)}%
			</div>
		</Html>
	);
}
