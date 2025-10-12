'use client';

import { useApp } from "@/context/AppContext";
import { DepositDialog } from "./DepositDialog";
import { WithdrawDialog } from "./WithdrawDialog";
import { InvestDialog } from "./InvestDialog";

export function GlobalModals() {
    const { modals, setModals } = useApp();

    return (
        <>
            <DepositDialog 
                isOpen={modals.deposit}
                onClose={() => setModals(prev => ({...prev, deposit: false}))}
            />
            <WithdrawDialog
                isOpen={modals.withdraw}
                onClose={() => setModals(prev => ({...prev, withdraw: false}))}
            />
            {modals.invest && (
                 <InvestDialog
                    property={modals.invest}
                    isOpen={!!modals.invest}
                    onClose={() => setModals(prev => ({...prev, invest: null}))}
                />
            )}
        </>
    )
}
