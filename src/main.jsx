import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeroUIProvider } from '@heroui/react'
import { ToastProvider } from '@heroui/toast'
import { MantineProvider } from '@mantine/core'
import { AuthProvider } from './auth'
import { shengenaMantineTheme } from './theme/mantine.js'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Domain data can be cached; identity is owned by AuthProvider + /me
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider
      theme={shengenaMantineTheme}
      withGlobalStyles
      withNormalizeCSS={false}
    >
      <HeroUIProvider>
        <ToastProvider
          placement="top-right"
          maxVisibleToasts={4}
          toastOffset={12}
          toastProps={{
            radius: 'md',
            variant: 'flat',
            timeout: 4200,
          }}
        />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HeroUIProvider>
    </MantineProvider>
  </StrictMode>,
)
