import React, { useState, useEffect } from 'react';

export type QuickActionId = 'create-new-bill' | 'manage-products' | 'view-all-invoices' | 'manage-tasks';

export interface QuickAction {
    id: QuickActionId;
    name: string;
    icon: React.ReactElement;
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
    { id: 'create-new-bill', name: 'Create New Bill', icon: React.createElement('svg', { className: "h-5 w-5 text-indigo-500", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { d: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" }), React.createElement('path', { fillRule: "evenodd", d: "M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7z", clipRule: "evenodd" })) },
    { id: 'manage-products', name: 'Manage Products', icon: React.createElement('svg', { className: "h-5 w-5 text-indigo-500", viewBox: "0 0 20 20" }, React.createElement('path', { fillRule: "evenodd", d: "M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 001 18h18a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z", clipRule: "evenodd" })) },
    { id: 'view-all-invoices', name: 'View All Invoices', icon: React.createElement('svg', { className: "h-5 w-5 text-indigo-500", viewBox: "0 0 20 20" }, React.createElement('path', { d: "M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" })) },
    { id: 'manage-tasks', name: 'Manage Tasks', icon: React.createElement('svg', { className: "h-5 w-5 text-indigo-500", viewBox: "0 0 20 20" }, React.createElement('path', { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })) },
];

const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
    'create-new-bill',
    'manage-products',
    'view-all-invoices',
];

const QUICK_ACTIONS_KEY = 'quickActions';

export const useQuickActions = () => {
    const [selectedActionIds, setSelectedActionIds] = useState<QuickActionId[]>(() => {
        try {
            const saved = localStorage.getItem(QUICK_ACTIONS_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_QUICK_ACTIONS;
        } catch (error) {
            console.error("Error reading quick actions from localStorage", error);
            return DEFAULT_QUICK_ACTIONS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(selectedActionIds));
        } catch (error) {
            console.error("Error saving quick actions to localStorage", error);
        }
    }, [selectedActionIds]);

    const updateSelectedActionIds = (actionIds: QuickActionId[]) => {
        setSelectedActionIds(actionIds);
    };

    return { selectedActionIds, updateSelectedActionIds };
};
