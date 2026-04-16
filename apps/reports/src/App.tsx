import { useState } from 'react';
import ProfitLoss from './ProfitLoss';
import WasteAnalysis from './WasteAnalysis';

export default function App() {
    const [tab, setTab] = useState<'pnl' | 'waste'>('pnl');

    if (tab === 'waste') {
        return <WasteAnalysis setTab={setTab} />;
    }

    return <ProfitLoss setTab={setTab} />;
}
