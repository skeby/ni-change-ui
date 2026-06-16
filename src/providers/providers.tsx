import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './theme-provider';
import { ThemeContextProvider } from './theme-context';
import { store, persistor } from '../state/store';
import { message } from 'antd';

message.config({
  duration: 6,
  maxCount: 2,
});

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeContextProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ThemeContextProvider>
      </PersistGate>
    </Provider>
  );
};

export default Providers;
