import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- BUTTON ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:   "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm border border-[#16A34A] hover:border-[#15803D]",
      secondary: "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] border border-[#E5E7EB]",
      outline:   "bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] hover:border-[#9CA3AF]",
      ghost:     "bg-transparent hover:bg-[#F3F4F6] text-[#6B7280] border border-transparent",
      destructive: "bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-sm",
    };

    const sizes = {
      sm:   "h-8 px-3 text-sm rounded-lg",
      md:   "h-10 px-5 text-sm font-medium rounded-lg",
      lg:   "h-11 px-6 text-base font-semibold rounded-xl",
      icon: "h-9 w-9 justify-center rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// --- INPUT ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] hover:border-[#9CA3AF]",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// --- CARD ---
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("niat-card", className)}>
      {children}
    </div>
  );
}

// --- BADGE ---
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}) {
  const variants = {
    default: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
    success: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error:   "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// --- MODAL ---
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1F2937]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden pointer-events-auto border border-[#E5E7EB]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-base font-semibold text-[#1F2937]">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
