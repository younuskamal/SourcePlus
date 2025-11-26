import React, { createContext, useContext } from 'react';

interface AutoRefreshContextValue {
  tick: number;
  requestRefresh: () => void;
}

const AutoRefreshContext = createContext<AutoRefreshContextValue>({
  tick: 0,
  requestRefresh: () => {}
});

interface ProviderProps extends AutoRefreshContextValue {
  children: React.ReactNode;
}

export const AutoRefreshProvider: React.FC<ProviderProps> = ({
  tick,
  requestRefresh,
  children
}) => (
  <AutoRefreshContext.Provider value={{ tick, requestRefresh }}>
    {children}
  </AutoRefreshContext.Provider>
);

export const useAutoRefresh = () => useContext(AutoRefreshContext);
