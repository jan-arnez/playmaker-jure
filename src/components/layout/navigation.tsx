"use client";

import { Menu, Search, X, User, Loader2 } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/modules/auth/lib/auth-client";
import { UserButton } from "@/modules/auth/components/user-button";
import { LiveSearch } from "@/components/live-search";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthModal } from "@/components/auth-modal";
import { Skeleton } from "@/components/ui/skeleton";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const { openLogin, openSignup } = useAuthModal();

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <LiveSearch placeholder="Search facilities, cities, sports..." />
          </div>

          {/* Auth / User */}
          <div className="hidden md:flex items-center space-x-3">
            {!session?.user && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/providers">Become Partner</Link>
              </Button>
            )}
            {isPending ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : session?.user ? (
              <UserButton user={session.user} />
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openLogin}>
                  Sign In
                </Button>
                <Button size="sm" onClick={openSignup}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Mobile Auth Icons */}
            {isPending ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : session?.user ? (
              <UserButton user={session.user} />
            ) : (
              <Button variant="ghost" size="icon" onClick={openLogin}>
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar Overlay */}
        <AnimatePresence mode="wait">
          {isSearchOpen && (
            <motion.div
              className="md:hidden px-1 py-4 border-t"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <LiveSearch
                placeholder="Search facilities, cities, sports..."
                inputClassName="h-12 rounded-full"
                autoFocus
                onSearchComplete={() => setIsSearchOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden border-t overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <motion.div
                className="px-2 pt-2 pb-3 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
              >
                <div className="pt-2 space-y-2">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-center"
                      asChild
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link href="/">Home</Link>
                    </Button>
                  </motion.div>
                  {!session?.user && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href="/providers">Become Partner</Link>
                      </Button>
                    </motion.div>
                  )}

                  {session?.user ? (
                    <>
                      {/* Dashboard Links - Only when logged in */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-center"
                          asChild
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Link href="/dashboard">Overview</Link>
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-center"
                          asChild
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Link href="/dashboard/reservations">My Reservations</Link>
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-center"
                          asChild
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Link href="/dashboard/profile">Profile</Link>
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-center"
                          asChild
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Link href="/dashboard/settings">Settings</Link>
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-center"
                          onClick={() => {
                            setIsMenuOpen(false);
                            openLogin();
                          }}
                        >
                          Sign In
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          className="w-full"
                          onClick={() => {
                            setIsMenuOpen(false);
                            openSignup();
                          }}
                        >
                          Sign Up
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
