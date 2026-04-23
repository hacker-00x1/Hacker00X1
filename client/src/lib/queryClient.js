import { QueryClient } from "@tanstack/react-query";
import { BLOG_POSTS, WRITEUPS, BOOKS, ABOUT_ME } from "./data";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, url, data) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/"), {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Fallback for static hosting (Netlify/GitHub Pages) where the backend is missing
      const url = queryKey[0];
      
      if (url === "/api/blogs") return BLOG_POSTS;
      if (url === "/api/writeups") return WRITEUPS;
      if (url === "/api/books") return BOOKS;
      if (url === "/api/about") return ABOUT_ME;

      // Handle detail views (e.g., /api/blogs/101)
      if (url.startsWith("/api/blogs/")) {
        const id = parseInt(url.split("/").pop());
        return BLOG_POSTS.find(b => b.id === id) || null;
      }
      if (url.startsWith("/api/writeups/")) {
        const id = parseInt(url.split("/").pop());
        return WRITEUPS.find(w => w.id === id) || null;
      }
      if (url.startsWith("/api/books/")) {
        const id = url.split("/").pop();
        return BOOKS.find(b => b.id === id) || null;
      }

      // If no fallback, rethrow the error
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: (args) => {
        const isUserCheck = args.queryKey[0] === "/api/user";
        return getQueryFn({ on401: isUserCheck ? "returnNull" : "throw" })(args);
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
