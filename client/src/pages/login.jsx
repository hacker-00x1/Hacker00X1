import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MatrixBackground } from "@/components/matrix-background";

export default function LoginPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/admin");
    return null;
  }

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex items-center justify-center">
      <MatrixBackground />
      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="bg-black/80 border-cyan-500/50 text-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <CardHeader>
            <CardTitle className="text-2xl font-mono text-center">ADMIN_PANEL</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">USERNAME</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-black/50 border-cyan-500/30 text-cyan-400 focus:border-cyan-400 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">PASSWORD</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          className="bg-black/50 border-cyan-500/30 text-cyan-400 focus:border-cyan-400 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "AUTHENTICATING..." : "AUTHENTICATE"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
