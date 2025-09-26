import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
export type { Product } from "./lib/models";
export type { VirtualShopProps } from "./components/VirtualShop";
export { default as VirtualShop } from "./components/VirtualShop";

export const mountApp = (container: HTMLElement) => {
	const root = ReactDOM.createRoot(container);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
};

// --- Self-mount for standalone usage ---
const standaloneRoot = document.getElementById("root");
if (standaloneRoot) {
	mountApp(standaloneRoot);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
