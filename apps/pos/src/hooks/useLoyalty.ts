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
    const [selectedDiscount, setSelectedDiscount] = useState<{ id: number; name: string; value: number; type: string } | null>(null);
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
            
            if (selectedDiscount && !fetched.some((d: any) => d.id === selectedDiscount.id)) {
                setSelectedDiscount(null);
            }
        } catch { setAvailableDiscounts([]); }
    }, [activeCartItems, selectedMember, selectedDiscount]);

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
        setPointsToRedeem(0); setSelectedDiscount(null); setAvailableDiscounts([]);
        setShowMemberPanel(false); setShowDiscountPanel(false);
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
        selectedDiscount, setSelectedDiscount,
        availableDiscounts,
        showDiscountPanel, setShowDiscountPanel,
        loyaltySettings,
        searchMembers,
        loadDiscounts,
        handleCreateMember,
        resetLoyaltyState
    };
}
