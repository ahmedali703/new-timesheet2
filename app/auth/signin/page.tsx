'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Clock, ChevronRight, Calendar, BarChart3, Clock3 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background animated elements */}
      <motion.div
        className="absolute -top-24 -left-24 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/3 -right-24 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{
          x: [0, -30, 0],
          y: [0, -40, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="w-full max-w-md shadow-xl bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="text-center pt-8">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20, 
                delay: 0.3 
              }}
            >
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">TimeTracker</CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-base">
                Sign in to manage your freelancer timesheets
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
                className="w-full transition-all hover:shadow-md hover:translate-y-[-1px] bg-white hover:bg-gray-50 text-gray-800 border border-gray-200"
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
                variant="default"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full relative overflow-hidden transition-all"
                size="lg"
              >
                <span className="relative z-10 flex items-center">
                  <Clock3 className="mr-2 h-5 w-5" />
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </motion.div>
          </CardContent>
          
          <CardFooter className="px-8 py-4 bg-gray-50/50 flex justify-between items-center">
            <motion.div 
              className="flex space-x-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-500">Track Time</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-gray-500">View Reports</span>
              </div>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}