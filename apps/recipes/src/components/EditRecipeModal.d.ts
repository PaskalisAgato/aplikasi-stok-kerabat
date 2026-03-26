import type { Recipe } from '@shared/mockDatabase';
interface EditRecipeModalProps {
    recipe: Recipe;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}
export default function EditRecipeModal({ recipe, onClose, onSave }: EditRecipeModalProps): import("react/jsx-runtime").JSX.Element;
export {};
