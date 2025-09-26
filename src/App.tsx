import { Product } from "./lib/models";
import VirtualShop from "./components/VirtualShop";

const testProducts: Product[] = [
	{
		id: "apple",
		name: "Red Apple",
		color: "red",
		price: "10",
		photoUrl: "/products-images/bg-original.webp",
	},
	{
		id: "banana",
		name: "Banana",
		color: "yellow",
		price: "101",
		photoUrl: "/products-images/gita-02.jpg",
	},
	{
		id: "grape",
		name: "Grapes",
		color: "purple",
		price: "102",
		photoUrl: "/products-images/bg-original.webp",
	},
	{
		id: "bread",
		name: "Bread",
		color: "burlywood",
		price: "103",
		photoUrl: "/products-images/gita-02.jpg",
	},
	{
		id: "milk",
		name: "Milk Carton",
		price: "104",
		color: "white",
	},
	{
		id: "coffee",
		name: "Coffee Pack",
		color: "saddlebrown",
		price: "105",
	},
	{
		id: "tea",
		name: "Tea Box",
		color: "green",
		price: "106",
	},
	{
		id: "cereal",
		name: "Cereal Box",
		color: "orange",
		price: "108",
	},
	{
		id: "water",
		name: "Water Bottle",
		color: "lightblue",
		price: "109",
	},
	{
		id: "chocolate",
		name: "Chocolate Bar",
		color: "brown",
		price: "110",
	},
];

// ---------- Main App ----------
export default function App() {
	return <VirtualShop products={testProducts} />;
}
