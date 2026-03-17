import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Building2, LogOut, UserCircle, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F7FA" }}>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#16A34A" }}>
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base text-[#1F2937] hidden sm:block">
                NIAT Campus
              </span>
            </div>

            <nav className="flex items-center gap-1">
              {user?.role === "admin" ? (
                <Link href="/admin">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location === "/admin"
                      ? "bg-[#F0FDF4] text-[#16A34A]"
                      : "text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]"
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </span>
                </Link>
              ) : (
                <Link href="/">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location === "/"
                      ? "bg-[#F0FDF4] text-[#16A34A]"
                      : "text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]"
                  }`}>
                    <LayoutDashboard className="w-4 h-4" />
                    Search
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5">
              <UserCircle className="w-4 h-4 text-[#9CA3AF]" />
              <span className="text-sm font-medium text-[#1F2937] hidden sm:block">{user?.phoneNumber}</span>
              <span className="text-xs text-[#9CA3AF] uppercase tracking-wide">· {user?.role}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6B7280] hover:text-red-600 hover:bg-red-50 border border-[#E5E7EB] hover:border-red-200 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
