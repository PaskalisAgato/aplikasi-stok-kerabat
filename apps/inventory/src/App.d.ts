export interface BahanBaku {
    id: number;
    name: string;
    category: string;
    unit: string;
    currentStock: string;
    minStock: string;
    pricePerUnit: string;
    discountPrice: string | null;
    imageUrl: string | null;
    externalImageUrl: string | null;
    status: 'NORMAL' | 'KRITIS' | 'HABIS';
    supplier?: string;
    idealStock?: string | number;
    version: number;
}
declare function App(): import("react/jsx-runtime").JSX.Element;
export default App;
