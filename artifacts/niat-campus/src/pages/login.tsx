import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Lock, Phone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  phoneNumber: z.string().min(5, "Phone number is required"),
  password: z.string().min(4, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation(data.user.role === "admin" ? "/admin" : "/");
      },
      onError: (error: any) => {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => loginMutation.mutate({ data });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "#16A34A" }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-2xl font-display font-bold mb-1"
            style={{ color: "#1F2937" }}
          >
            NIAT Campus Manager
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                </div>
                <Input
                  {...register("phoneNumber")}
                  type="text"
                  placeholder="Enter phone number"
                  className="pl-9"
                  error={!!errors.phoneNumber}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                </div>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Enter password"
                  className="pl-9"
                  error={!!errors.password}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
          NIAT Campus Visit Manager &mdash; Internal Tool
        </p>
      </div>
    </div>
  );
}
