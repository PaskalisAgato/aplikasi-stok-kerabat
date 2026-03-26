import React from 'react';
interface Expense {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: string;
    imageUrl?: string;
}
interface ExpenseListProps {
    expenses: Expense[];
    onDelete?: (id: number) => void;
    onEdit?: (expense: Expense) => void;
}
declare const ExpenseList: React.FC<ExpenseListProps>;
export default ExpenseList;
