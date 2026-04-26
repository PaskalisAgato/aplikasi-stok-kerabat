import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@shared/apiClient';
import { useNotification } from '@shared/components/NotificationProvider';

export function useLoyalty(activeCartItems: any[], totalSalesValue: number) {
    const [selectedMember, setSelectedMember] = useState<{ id: number; name: string; phone: string; points: number; level: string } | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
    const [showMemberPanel, setShowMemberPanel] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [isCreatingMember, setIsCreatingMember] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [selectedDiscounts, setSelectedDiscounts] = useState<any[]>([]);
    const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
    const [showDiscountPanel, setShowDiscountPanel] = useState(false);
    const [loyaltySettings, setLoyaltySettings] = useState({ pointRatio: 10000, pointValue: 100 });
    
    const { showNotification } = useNotification();

    useEffect(() => {
        apiClient.get('/loyalty/settings').then((res: any) => {
            if (res) setLoyaltySettings({ 
                pointRatio: parseFloat(res.pointRatio) || 10000, 
                pointValue: parseFloat(res.pointValue) || 100 
            });
        }).catch(console.error);
    }, []);

    const searchMembers = useCallback(async (query: string) => {
        if (!query) { setMemberSearchResults([]); return; }
        try {
            const res = await apiClient.get(`/members?search=${encodeURIComponent(query)}`) as any;
            setMemberSearchResults(res?.data || []);
        } catch { setMemberSearchResults([]); }
    }, []);

    const loadDiscounts = useCallback(async () => {
        try {
            const items = activeCartItems.map(item => ({ 
                recipeId: item.id, 
                quantity: item.qty, 
                price: item.price 
            }));
            const res = await apiClient.post('/discounts/evaluate', { items, memberLevel: selectedMember?.level }) as any;
            const fetched = res?.data || [];
            setAvailableDiscounts(fetched);
            
            if (selectedDiscounts.length > 0) {
                // Remove discounts that are no longer applicable
                const validDiscounts = selectedDiscounts.filter(d => fetched.some((f: any) => f.id === d.id));
                if (validDiscounts.length !== selectedDiscounts.length) {
                    setSelectedDiscounts(validDiscounts);
                }
            }
        } catch { setAvailableDiscounts([]); }
    }, [activeCartItems, selectedMember, selectedDiscounts]);

    useEffect(() => {
        loadDiscounts();
    }, [totalSalesValue, selectedMember?.id, loadDiscounts]);

    const handleCreateMember = async () => {
        if (!newMemberName || !newMemberPhone) {
            showNotification('Nama dan No HP wajib diisi', 'error');
            return;
        }
        setIsCreatingMember(true);
        try {
            const res = await apiClient.post('/members', { name: newMemberName, phone: newMemberPhone }) as any;
            if (res.success && res.data) {
                const m = res.data;
                setSelectedMember({ id: m.id, name: m.name, phone: m.phone, points: m.points, level: m.level });
                setIsAddingMember(false);
                setShowMemberPanel(false);
                setNewMemberName('');
                setNewMemberPhone('');
                showNotification('Member berhasil didaftarkan', 'success');
            }
        } catch (error) {
            showNotification('Gagal mendaftarkan member', 'error');
        } finally {
            setIsCreatingMember(false);
        }
    };

    const resetLoyaltyState = useCallback(() => {
        setSelectedMember(null); setMemberSearch(''); setMemberSearchResults([]);
        setPointsToRedeem(0); setSelectedDiscounts([]); setAvailableDiscounts([]);
        setShowMemberPanel(false); setShowDiscountPanel(false);
    }, []);

    const toggleDiscount = useCallback((discount: any) => {
        setSelectedDiscounts(prev => {
            const isSelected = prev.some(d => d.id === discount.id);
            if (isSelected) {
                // Deselect
                return prev.filter(d => d.id !== discount.id);
            } else {
                // Select
                if (!discount.isStackable) {
                    // Non-stackable clears everything else
                    return [discount];
                } else {
                    // Stackable. First, remove any non-stackable existing items
                    const stackableOnly = prev.filter(d => d.isStackable);
                    return [...stackableOnly, discount];
                }
            }
        });
    }, []);

    return {
        selectedMember, setSelectedMember,
        memberSearch, setMemberSearch,
        memberSearchResults,
        showMemberPanel, setShowMemberPanel,
        isAddingMember, setIsAddingMember,
        newMemberName, setNewMemberName,
        newMemberPhone, setNewMemberPhone,
        isCreatingMember,
        pointsToRedeem, setPointsToRedeem,
        selectedDiscounts, setSelectedDiscounts, toggleDiscount,
        availableDiscounts,
        showDiscountPanel, setShowDiscountPanel,
        loyaltySettings,
        searchMembers,
        loadDiscounts,
        handleCreateMember,
        resetLoyaltyState
    };
}
