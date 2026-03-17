import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Building2, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900 tracking-tight hidden sm:block">
              NIAT Campus
            </span>
            
            <nav className="ml-8 flex gap-4">
              {user?.role === "admin" ? (
                <Link href="/admin" className={`text-sm font-semibold transition-colors ${location === "/admin" ? "text-primary" : "text-slate-500 hover:text-slate-900"}`}>
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/" className={`text-sm font-semibold transition-colors ${location === "/" ? "text-primary" : "text-slate-500 hover:text-slate-900"}`}>
                  Sales Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 py-1.5 px-3 rounded-full">
              <UserCircle className="w-4 h-4" />
              <span className="font-medium hidden sm:block">{user?.phoneNumber}</span>
              <span className="opacity-50 text-xs uppercase tracking-wider ml-1">({user?.role})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="text-slate-500 hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
