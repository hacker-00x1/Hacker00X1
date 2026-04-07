import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Books from "@/pages/books";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Writeups from "@/pages/writeups";
import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";

function ProtectedRoute({ component: Component, path }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Route path={path}>
      {user ? <Component /> : <Redirect to="/login" />}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blogs" component={Blog} />
      <Route path="/blogs/:id" component={BlogPost} />
      <Route path="/writeups" component={Writeups} />
      <Route path="/writeups/:id" component={BlogPost} />
      <Route path="/books" component={Books} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={LoginPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
