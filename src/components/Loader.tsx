import { Html, useProgress } from "@react-three/drei";

export function Loader() {
	const { progress } = useProgress(); // progress 0–100
	return (
		<Html center>
			<div
				style={{
					color: "white",
					fontSize: "1.5rem",
					textAlign: "center",
				}}
			>
				Loading {Math.floor(progress)}%
			</div>
		</Html>
	);
}
