import { QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route } from 'wouter';

import { AuthProvider } from './hooks/use-auth';
import { ProtectedRoute } from './lib/protected-route';
import { queryClient } from './lib/queryClient';

import { Toaster } from '@/components/ui/toaster';
import AuthPage from '@/pages/auth-page';
import HomePage from '@/pages/home-page';
import NotFound from '@/pages/not-found';

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
