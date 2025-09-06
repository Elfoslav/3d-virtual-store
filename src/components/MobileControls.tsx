import { Joystick } from "react-joystick-component";

export default function MobileControls({
	setMove,
}: {
	setMove: (dir: { x: number; y: number }) => void;
}) {
	return (
		<div style={{ position: "absolute", bottom: 30, left: 30, zIndex: 20 }}>
			<Joystick
				size={80}
				baseColor="rgba(0,0,0,0.3)"
				stickColor="rgba(255,255,255,0.8)"
				move={(e) => setMove({ x: e.x ?? 0, y: e.y ?? 0 })}
				stop={() => setMove({ x: 0, y: 0 })}
			/>
		</div>
	);
}
