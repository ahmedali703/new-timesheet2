'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Clock, ChevronRight, Calendar, BarChart3, Clock3, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div
        className="z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="glass-card border-0 overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary"></div>
          
          <CardHeader className="text-center pt-8 pb-6">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                delay: 0.3 
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-50 animate-pulse-glow"></div>
                <div className="relative p-4 bg-gradient-primary rounded-full">
                  <Clock className="h-12 w-12 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <CardTitle className="text-3xl font-bold gradient-text mb-2">TimeTracker</CardTitle>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">by MyQuery.AI</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardDescription className="text-muted-foreground text-base">
                Sign in to manage your freelancer timesheets with style
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="px-8 py-6">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full btn-secondary hover:scale-105 transition-all duration-300"
                size="lg"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              
              <Button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full btn-primary relative overflow-hidden group"
                size="lg"
              >
                <span className="relative z-10 flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>
          </CardContent>
          
          <CardFooter className="px-8 py-6 bg-white/5 backdrop-blur-sm">
            <motion.div 
              className="w-full flex justify-center space-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Track Time</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">View Reports</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock3 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Manage Tasks</span>
              </div>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}