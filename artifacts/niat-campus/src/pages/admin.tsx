import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Activity,
  Plus,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  X,
  Check,
  UserCircle,
  Trash2,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateSales,
  useGetSalesUsers,
  useGetLogs,
  useGetAllUsers,
  useChangeCredentials,
  useDeleteUser,
  getGetAllUsersQueryKey,
  getGetSalesUsersQueryKey,
  AuditLogActionType,
} from "@workspace/api-client-react";
import { Button, Input, Badge } from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const createSalesSchema = z.object({
  phoneNumber: z.string().min(5, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["sales", "admin"]),
});
type CreateSalesForm = z.infer<typeof createSalesSchema>;

type Tab = "create" | "users" | "credentials" | "logs";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "logs",        icon: Activity,    label: "Audit Logs" },
  { id: "users",       icon: Users,       label: "Sales Team" },
  { id: "credentials", icon: ShieldCheck, label: "Credentials" },
  { id: "create",      icon: Plus,        label: "Add User" },
];

export default function AdminDashboard() {
  const { getHeaders } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: "#1F2937" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Manage team access and view system activity.
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex flex-wrap gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  cursor: "pointer",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  color: active ? "#B3261E" : "#6B7280",
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div
          className="rounded-2xl min-h-[500px] overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "create"      && <CreateSalesTab      key="create"      getHeaders={getHeaders} toast={toast} />}
            {activeTab === "users"       && <SalesUsersTab       key="users"       getHeaders={getHeaders} />}
            {activeTab === "credentials" && <CredentialsTab      key="credentials" getHeaders={getHeaders} toast={toast} />}
            {activeTab === "logs"        && <AuditLogsTab        key="logs"        getHeaders={getHeaders} />}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

// ─── Create Sales Tab ─────────────────────────────────────────────────────────
function CreateSalesTab({ getHeaders, toast }: any) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSalesForm>({
    resolver: zodResolver(createSalesSchema),
    defaultValues: { role: "sales" },
  });

  const selectedRole = watch("role");

  const mutation = useCreateSales({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Account Created", description: `${selectedRole === "admin" ? "Admin" : "Sales"} user added successfully.` });
        reset({ role: "sales" });
        queryClient.invalidateQueries({ queryKey: ["getSalesUsers"] });
        queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
      },
      onError: (err: any) =>
        toast({ title: "Creation Failed", description: err.message, variant: "destructive" }),
    },
  });

  const roles: { id: "sales" | "admin"; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "sales", label: "Sales User", desc: "Can look up students and generate visit links", icon: Users },
    { id: "admin", label: "Admin", desc: "Full access including user management", icon: ShieldCheck },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#FFF1F1" }}
        >
          <Plus className="w-6 h-6" style={{ color: "#B3261E" }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>
          New User Account
        </h2>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Select a role and provide credentials to grant platform access.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutation.mutate({ data: d }))}
        className="space-y-5"
      >
        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
            Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ id, label, desc, icon: Icon }) => {
              const active = selectedRole === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setValue("role", id)}
                  className="text-left p-3.5 rounded-xl border-2 transition-all"
                  style={{
                    cursor: "pointer",
                    borderColor: active ? "#B3261E" : "#E5E7EB",
                    backgroundColor: active ? "#FFF1F1" : "#FAFAFA",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: active ? "#B3261E" : "#6B7280" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: active ? "#B3261E" : "#1F2937" }}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: "#6B7280" }}>
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
            Phone Number (Login ID)
          </label>
          <Input
            {...register("phoneNumber")}
            placeholder="+91..."
            error={!!errors.phoneNumber}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.phoneNumber.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
            Password
          </label>
          <Input
            type="password"
            {...register("password")}
            placeholder="••••••••"
            error={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create {selectedRole === "admin" ? "Admin" : "Sales User"}
        </Button>
      </form>
    </motion.div>
  );
}

// ─── Sales Users Tab ──────────────────────────────────────────────────────────
function SalesUsersTab({ getHeaders }: any) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const { data, isLoading } = useGetSalesUsers({ request: { headers: getHeaders() } });

  const togglePassword = (id: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: "#1F2937" }}>
          Sales Representatives
        </h2>
        <Badge>{data?.users.length ?? 0} Users</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#9CA3AF" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.users.map((u: any) => (
            <div
              key={u.id}
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#E5E7EB" }}
                >
                  <UserCircle className="w-5 h-5" style={{ color: "#6B7280" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>
                    {u.phoneNumber}
                  </div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                    {u.role}
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
              >
                <span className="text-xs font-medium w-16 shrink-0" style={{ color: "#9CA3AF" }}>
                  Password
                </span>
                <span className="flex-1 text-xs font-mono truncate" style={{ color: "#374151" }}>
                  {visiblePasswords.has(u.id)
                    ? u.plainPassword || (
                        <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>not recorded</span>
                      )
                    : "••••••••"}
                </span>
                <button
                  onClick={() => togglePassword(u.id)}
                  className="shrink-0 transition-colors"
                  style={{ color: "#9CA3AF", cursor: "pointer" }}
                >
                  {visiblePasswords.has(u.id) ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {data?.users.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm" style={{ color: "#9CA3AF" }}>
              No sales users found.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Credentials Tab ──────────────────────────────────────────────────────────
function CredentialsTab({ getHeaders, toast }: any) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ phoneNumber: "", password: "" });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: number; phoneNumber: string } | null>(null);

  const { data, isLoading } = useGetAllUsers({ request: { headers: getHeaders() } });

  const changeMutation = useChangeCredentials({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Updated", description: "Credentials changed successfully." });
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: getGetAllUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSalesUsersQueryKey() });
      },
      onError: (err: any) =>
        toast({ title: "Update Failed", description: err.message, variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteUser({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Deleted", description: "User removed successfully." });
        setConfirmDeleteUser(null);
        queryClient.invalidateQueries({ queryKey: getGetAllUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSalesUsersQueryKey() });
      },
      onError: (err: any) =>
        toast({ title: "Delete Failed", description: err.message, variant: "destructive" }),
    },
  });

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditForm({ phoneNumber: u.phoneNumber, password: "" });
  };

  const togglePassword = (id: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: "#1F2937" }}>
          Manage Credentials
        </h2>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          Change login phone number or password for any account, including admin.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#9CA3AF" }} />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.users.map((u: any) => (
            <div
              key={u.id}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #E5E7EB" }}
            >
              {editingId === u.id ? (
                <div className="p-4 space-y-3" style={{ backgroundColor: "#FFF1F1" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={u.role === "admin" ? "default" : "success"}>{u.role}</Badge>
                    <span className="text-xs" style={{ color: "#6B7280" }}>
                      Editing credentials
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "#374151" }}>
                        Phone / Login ID
                      </label>
                      <Input
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "#374151" }}>
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      isLoading={changeMutation.isPending}
                      disabled={!editForm.phoneNumber || !editForm.password || changeMutation.isPending}
                      onClick={() =>
                        changeMutation.mutate({
                          data: { id: u.id, phoneNumber: editForm.phoneNumber, password: editForm.password },
                        })
                      }
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-4 flex items-center justify-between gap-4"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <Users className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>
                        {u.phoneNumber}
                      </div>
                      <Badge
                        variant={u.role === "admin" ? "default" : "success"}
                        className="mt-0.5"
                      >
                        {u.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
                    >
                      <span className="text-xs font-mono" style={{ color: "#374151" }}>
                        {visiblePasswords.has(u.id)
                          ? u.plainPassword || (
                              <span style={{ color: "#9CA3AF", fontStyle: "italic", fontSize: "11px" }}>
                                not recorded
                              </span>
                            )
                          : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePassword(u.id)}
                        style={{ color: "#9CA3AF", cursor: "pointer" }}
                      >
                        {visiblePasswords.has(u.id) ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteUser({ id: u.id, phoneNumber: u.phoneNumber })}
                        style={{ color: "#EF4444", borderColor: "#FCA5A5" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!confirmDeleteUser}
        onOpenChange={(open) => { if (!open) setConfirmDeleteUser(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{confirmDeleteUser?.phoneNumber}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteUser) {
                  deleteMutation.mutate({ data: { id: confirmDeleteUser.id } });
                }
              }}
              disabled={deleteMutation.isPending}
              style={{ backgroundColor: "#EF4444" }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
function AuditLogsTab({ getHeaders }: any) {
  const [page, setPage] = useState(1);
  const [phoneFilter, setPhoneFilter] = useState("");
  const limit = 10;

  const { data, isLoading } = useGetLogs(
    { page, limit, phoneNumber: phoneFilter || undefined },
    { request: { headers: getHeaders() } }
  );

  const actionVariant = (action: AuditLogActionType): "success" | "default" =>
    action === AuditLogActionType.CAMPUS_MARKED ? "success" : "default";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "#1F2937" }}>
          System Activity
        </h2>
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#9CA3AF" }}
          />
          <Input
            className="pl-9 w-60 h-9"
            placeholder="Filter by phone..."
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <tr>
              {["Action", "Performed By", "Target User", "Timestamp"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#6B7280" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#9CA3AF" }} />
                </td>
              </tr>
            ) : data?.logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-sm" style={{ color: "#9CA3AF" }}>
                  No logs found.
                </td>
              </tr>
            ) : (
              data?.logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: i < (data.logs.length - 1) ? "1px solid #F3F4F6" : "none",
                  }}
                >
                  <td className="px-6 py-3">
                    <Badge variant={actionVariant(log.actionType)}>
                      {log.actionType.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 font-medium" style={{ color: "#374151" }}>
                    {log.performerPhone}
                  </td>
                  <td className="px-6 py-3" style={{ color: "#6B7280" }}>
                    {log.phoneNumber || log.targetUserId || "N/A"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderTop: "1px solid #E5E7EB" }}
      >
        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          Showing {data?.logs.length ?? 0} of {data?.total ?? 0} entries
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || data.page * data.limit >= data.total || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
