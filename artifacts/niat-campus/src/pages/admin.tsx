import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, Activity, Plus, Search, Eye, EyeOff, Loader2, Pencil, X, Check } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCreateSales, useGetSalesUsers, useGetLogs, useGetAllUsers, useChangeCredentials, AuditLogActionType } from "@workspace/api-client-react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const createSalesSchema = z.object({
  phoneNumber: z.string().min(5, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
type CreateSalesForm = z.infer<typeof createSalesSchema>;

type Tab = "create" | "users" | "credentials" | "logs";

export default function AdminDashboard() {
  const { getHeaders } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Admin Control Center</h1>
            <p className="text-slate-500 mt-1">Manage team access and view system activity.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { id: "logs", icon: Activity, label: "Audit Logs" },
            { id: "users", icon: Users, label: "Sales Team" },
            { id: "credentials", icon: ShieldCheck, label: "Manage Credentials" },
            { id: "create", icon: Plus, label: "Add Sales User" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === "create" && <CreateSalesTab key="create" getHeaders={getHeaders} toast={toast} />}
            {activeTab === "users" && <SalesUsersTab key="users" getHeaders={getHeaders} />}
            {activeTab === "credentials" && <CredentialsTab key="credentials" getHeaders={getHeaders} toast={toast} />}
            {activeTab === "logs" && <AuditLogsTab key="logs" getHeaders={getHeaders} />}
          </AnimatePresence>
        </Card>

      </div>
    </Layout>
  );
}

// --- SUB-COMPONENTS FOR TABS ---

function CreateSalesTab({ getHeaders, toast }: any) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSalesForm>({
    resolver: zodResolver(createSalesSchema)
  });

  const mutation = useCreateSales({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Account Created", description: "Sales user added successfully." });
        reset();
        queryClient.invalidateQueries({ queryKey: ["getSalesUsers"] });
        queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
      },
      onError: (err: any) => toast({ title: "Creation Failed", description: err.message, variant: "destructive" })
    }
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold">New Sales Account</h2>
        <p className="text-slate-500">Provide credentials to grant platform access.</p>
      </div>
      
      <form onSubmit={handleSubmit((d) => mutation.mutate({ data: d }))} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number (Login ID)</label>
          <Input {...register("phoneNumber")} placeholder="+91..." error={!!errors.phoneNumber} />
          {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Password</label>
          <Input type="password" {...register("password")} placeholder="••••••••" error={!!errors.password} />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create User
        </Button>
      </form>
    </motion.div>
  );
}

function SalesUsersTab({ getHeaders }: any) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const { data, isLoading } = useGetSalesUsers({ request: { headers: getHeaders() } });

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Active Sales Representatives</h2>
        <Badge>{data?.users.length || 0} Users</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.users.map((u: any) => (
            <div key={u.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{u.phoneNumber}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{u.role}</div>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 font-medium w-16 shrink-0">Password</span>
                <span className="flex-1 text-sm font-mono text-slate-700 truncate">
                  {visiblePasswords.has(u.id)
                    ? (u.plainPassword || <span className="text-slate-400 italic">not recorded</span>)
                    : "••••••••"}
                </span>
                <button
                  onClick={() => togglePassword(u.id)}
                  className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                >
                  {visiblePasswords.has(u.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {data?.users.length === 0 && (
            <div className="col-span-full text-center p-12 text-slate-500">No sales users found.</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CredentialsTab({ getHeaders, toast }: any) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ phoneNumber: "", password: "" });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  const { data, isLoading } = useGetAllUsers({ request: { headers: getHeaders() } });

  const changeMutation = useChangeCredentials({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Updated", description: "Credentials changed successfully." });
        setEditingId(null);
        queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
        queryClient.invalidateQueries({ queryKey: ["getSalesUsers"] });
      },
      onError: (err: any) => toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  });

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditForm({ phoneNumber: u.phoneNumber, password: "" });
  };

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Manage Credentials</h2>
        <p className="text-sm text-slate-500 mt-1">Change the login phone number or password for any account, including the admin.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="space-y-3">
          {data?.users.map((u: any) => (
            <div key={u.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              {editingId === u.id ? (
                <div className="p-4 space-y-3 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={u.role === "admin" ? "default" : "success"}>{u.role}</Badge>
                    <span className="text-sm text-slate-500">Editing credentials</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone / Login ID</label>
                      <Input
                        value={editForm.phoneNumber}
                        onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">New Password</label>
                      <Input
                        type="password"
                        value={editForm.password}
                        onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      isLoading={changeMutation.isPending}
                      disabled={!editForm.phoneNumber || !editForm.password || changeMutation.isPending}
                      onClick={() => changeMutation.mutate({ data: { id: u.id, phoneNumber: editForm.phoneNumber, password: editForm.password } })}
                    >
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{u.phoneNumber}</div>
                      <Badge variant={u.role === "admin" ? "default" : "success"} className="mt-0.5">{u.role}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-mono text-slate-700">
                        {visiblePasswords.has(u.id)
                          ? (u.plainPassword || <span className="text-slate-400 italic text-xs">not recorded</span>)
                          : "••••••••"}
                      </span>
                      <button onClick={() => togglePassword(u.id)} className="text-slate-400 hover:text-slate-700">
                        {visiblePasswords.has(u.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AuditLogsTab({ getHeaders }: any) {
  const [page, setPage] = useState(1);
  const [phoneFilter, setPhoneFilter] = useState("");
  const limit = 10;

  const { data, isLoading } = useGetLogs(
    { page, limit, phoneNumber: phoneFilter || undefined },
    { request: { headers: getHeaders() } }
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 rounded-t-2xl">
        <h2 className="text-xl font-bold">System Activity</h2>
        <div className="flex gap-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input 
            className="pl-9 h-10 w-64" 
            placeholder="Filter by target phone..." 
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Performed By</th>
              <th className="px-6 py-4">Target User</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></td></tr>
            ) : data?.logs.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-slate-500">No logs found.</td></tr>
            ) : (
              data?.logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Badge variant={log.actionType === AuditLogActionType.CAMPUS_MARKED ? "success" : "default"}>
                      {log.actionType.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{log.performerPhone}</td>
                  <td className="px-6 py-4 text-slate-600">{log.phoneNumber || log.targetUserId || "N/A"}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
        <span className="text-sm text-slate-500">
          Showing {data?.logs.length || 0} of {data?.total || 0} entries
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1 || isLoading} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!data || data.page * data.limit >= data.total || isLoading} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
