import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';

// GitHub Pages 部署使用 BrowserRouter（HTTPS 同源，无 CORS 问题）
// 本地 file:// 双击打开时回退到 HashRouter
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const Router = isFileProtocol ? HashRouter : BrowserRouter;
// 部署在子路径（如 /Neon-Fighter/）时，需要设置 basename 才能正确匹配路由
const baseUrl = import.meta.env.BASE_URL;
const basename = baseUrl !== '/' ? baseUrl.replace(/\/$/, '') : undefined;
// MODULE_IMPORTS_START
// MODULE_IMPORTS_END

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    {/* MODULE_ROUTES_START */}
    {/* MODULE_ROUTES_END */}
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* MODULE_PROVIDERS_START */}
    {/* MODULE_PROVIDERS_END */}
    <TooltipProvider>
      <Toaster />
      <Router basename={basename}>
        <AppRoutes />
      </Router>
    </TooltipProvider>
    {/* MODULE_PROVIDERS_CLOSE */}
  </QueryClientProvider>
);

export default App;
export { AppRoutes };
