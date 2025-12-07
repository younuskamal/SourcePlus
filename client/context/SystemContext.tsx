import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ProductType = 'POS' | 'CLINIC';

interface SystemContextType {
    product: ProductType;
    setProduct: (product: ProductType) => void;
    primaryColor: string; // e.g. 'blue', 'emerald'
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider = ({ children }: { children: ReactNode }) => {
    const [product, setProduct] = useState<ProductType>('POS');

    useEffect(() => {
        const saved = localStorage.getItem('sourceplus_product');
        if (saved === 'POS' || saved === 'CLINIC') {
            setProduct(saved);
        }
    }, []);

    const handleSetProduct = (p: ProductType) => {
        setProduct(p);
        localStorage.setItem('sourceplus_product', p);
    };

    const primaryColor = product === 'POS' ? 'blue' : 'emerald';

    return (
        <SystemContext.Provider value={{ product, setProduct: handleSetProduct, primaryColor }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (!context) throw new Error('useSystem must be used within SystemProvider');
    return context;
};
