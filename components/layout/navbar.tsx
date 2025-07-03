on.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-primary p-2 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold gradient-text">TimeTracker</span>
                  <span className="text-xs text-gray-400 -mt-1">by MyQuery.AI</span>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <motion.div 
                className="flex items-center space-x-4 glass rounded-full px-4 py-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="h-8 w-8 rounded-full ring-2 ring-purple-500/30"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{session.user?.name}</span>
                    <span className="text-xs text-gray-400">{session.user?.role}</span>
                  </div>
                </div>
                
                <div className="h-6 w-px bg-white/20"></div>
                
                <div className="flex items-center space-x-2">
                  <span className="badge-modern">
                    {session.user?.role}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  onClick={() => signOut()}
                  className="btn-modern group"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Sign Out
                </Button>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:bg-white/10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-white/10 glass"
            >
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl glass">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="h-10 w-10 rounded-full ring-2 ring-purple-500/30"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{session.user?.name}</span>
                    <span className="text-xs text-gray-400">{session.user?.email}</span>
                    <span className="badge-modern mt-1 w-fit">
                      {session.user?.role}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => signOut()}
                  className="w-full btn-modern"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Backdrop blur overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}