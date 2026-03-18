import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  UserPlus,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  MessageCircle,
  MapPin,
  User,
  Phone,
  Briefcase,
  Loader2,
  Globe,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useSearchUser,
  useGetCompletion,
  useGenerateLink,
  useMarkVisited,
  useUpdateUserField,
  SearchUserResponse,
  GetCompletionResponse,
} from "@workspace/api-client-react";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

const searchSchema = z.object({
  phoneNumber: z.string().min(5, "Valid phone number required"),
});

export default function SalesDashboard() {
  const { getHeaders } = useAuth();
  const { toast } = useToast();

  const [searchResult, setSearchResult] = useState<SearchUserResponse | null>(null);
  const [completionData, setCompletionData] = useState<GetCompletionResponse | null>(null);
  const [searchedPhone, setSearchedPhone] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ phoneNumber: string }>({ resolver: zodResolver(searchSchema) });

  const phoneValue = watch("phoneNumber");
  useEffect(() => {
    setSearchResult(null);
    setCompletionData(null);
  }, [phoneValue]);

  const searchMutation = useSearchUser({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data, variables) => {
        setSearchResult(data);
        setSearchedPhone(variables.data.phoneNumber);
        setCompletionData(null);
        if (!data.isNewUser && data.userId && data.applicationId) {
          getCompletionMutation.mutate({
            data: { userId: data.userId, applicationId: data.applicationId },
          });
        }
      },
      onError: (err: any) =>
        toast({ title: "Search Failed", description: err.message || "An error occurred", variant: "destructive" }),
    },
  });

  const getCompletionMutation = useGetCompletion({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data) => setCompletionData(data),
      onError: () => toast({ title: "Failed to load progress", variant: "destructive" }),
    },
  });

  const linkMutation = useGenerateLink({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data) => {
        setGeneratedUrl(data.redirectUrl ?? "");
        setIsLinkModalOpen(true);
      },
      onError: (err: any) =>
        toast({ title: "Failed to generate link", description: err.message || "Please try again.", variant: "destructive" }),
    },
  });

  const updateFieldMutation = useUpdateUserField({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (_data, variables) => {
        linkMutation.mutate({
          data: {
            userId: variables.data.userId,
            applicationId: variables.data.applicationId,
            phoneNumber: searchedPhone,
          },
        });
      },
      onError: (err: any) =>
        toast({ title: "Field update failed", description: err.message || "Please try again.", variant: "destructive" }),
    },
  });

  const markVisitedMutation = useMarkVisited({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Campus marked as visited!" });
      },
      onError: (err: any) =>
        toast({ title: "Update Failed", description: err.message, variant: "destructive" }),
    },
  });

  const onSearch = (data: { phoneNumber: string }) => searchMutation.mutate({ data });

  const handleMarkVisited = () => {
    if (!searchResult?.userId || !searchResult?.applicationId) return;
    markVisitedMutation.mutate({
      data: { userId: searchResult.userId, applicationId: searchResult.applicationId, phoneNumber: searchedPhone },
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Page header */}
        <div className="pt-2">
          <h1 className="text-2xl font-display font-bold" style={{ color: "#1F2937" }}>
            Student Search
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Look up a student by phone number to view their visit status or generate a direct link.
          </p>
        </div>

        {/* Search bar */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <form onSubmit={handleSubmit(onSearch)} className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 shrink-0" style={{ color: "#9CA3AF" }} />
            <input
              {...register("phoneNumber")}
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-[#9CA3AF] text-[#1F2937]"
              placeholder="Enter phone number (e.g. +919876543210)"
            />
            <Button type="submit" isLoading={searchMutation.isPending} className="shrink-0">
              Search
            </Button>
          </form>
          {errors.phoneNumber && (
            <p className="text-xs text-red-600 px-4 pb-3">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searchResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              {searchResult.isNewUser ? (
                /* New user card */
                <div
                  className="rounded-xl p-8 text-center"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "2px dashed #FECACA",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "#FFF1F1" }}
                  >
                    <UserPlus className="w-7 h-7" style={{ color: "#B3261E" }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#1F2937" }}>
                    New Prospect
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                    This number isn't registered yet. Click below to register the campus visit and get a direct link.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!searchResult.userId || !searchResult.applicationId) return;
                      updateFieldMutation.mutate({
                        data: { userId: searchResult.userId, applicationId: searchResult.applicationId },
                      });
                    }}
                    disabled={updateFieldMutation.isPending || linkMutation.isPending}
                  >
                    {updateFieldMutation.isPending || linkMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {updateFieldMutation.isPending ? "Registering visit…" : "Generating link…"}
                      </>
                    ) : (
                      <><LinkIcon className="w-4 h-4 mr-2" />Mark Direct Visit</>
                    )}
                  </Button>
                </div>
              ) : (
                /* Existing user — two-column layout */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Student details card */}
                  <div
                    className="rounded-xl p-5"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1F2937" }}>
                        <User className="w-4 h-4" style={{ color: "#B3261E" }} />
                        Student Details
                      </h3>
                      <Badge variant="success">Existing Lead</Badge>
                    </div>
                    <div className="space-y-3">
                      <InfoRow icon={<User className="w-4 h-4" />} label={searchResult.studentInfo?.name || "N/A"} />
                      <InfoRow icon={<Phone className="w-4 h-4" />} label={searchResult.studentInfo?.phone || searchedPhone} />
                      <InfoRow
                        icon={<Briefcase className="w-4 h-4" />}
                        label={
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                          >
                            Application ID: {searchResult.applicationId}
                          </span>
                        }
                      />
                      {searchResult.studentInfo?.language && (
                        <InfoRow
                          icon={<Globe className="w-4 h-4" />}
                          label={<span className="capitalize">{searchResult.studentInfo.language}</span>}
                        />
                      )}
                    </div>
                  </div>

                  {/* Visit status card */}
                  <div
                    className="rounded-xl p-5"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1F2937" }}>
                        <MapPin className="w-4 h-4" style={{ color: "#B3261E" }} />
                        Visit Status
                      </h3>
                    </div>

                    {getCompletionMutation.isPending ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#9CA3AF" }} />
                      </div>
                    ) : completionData ? (
                      <div className="space-y-5">
                        {completionData.completionAvailable && completionData.personalDetails != null && (
                          <ProgressBar
                            label="Personal Details"
                            value={completionData.personalDetails}
                            color={completionData.personalDetails >= 100 ? "#B3261E" : "#F59E0B"}
                            valueColor={completionData.personalDetails >= 100 ? "#B3261E" : "#B45309"}
                          />
                        )}
                        {completionData.completionAvailable && completionData.visitedCampus != null && (
                          <ProgressBar
                            label="Campus Visited"
                            value={completionData.visitedCampus}
                            color={completionData.visitedCampus >= 100 ? "#B3261E" : "#F59E0B"}
                            valueColor={completionData.visitedCampus >= 100 ? "#B3261E" : "#B45309"}
                          />
                        )}
                        {!completionData.completionAvailable && (
                          <div
                            className="text-sm flex items-start gap-2 p-3 rounded-lg"
                            style={{ backgroundColor: "#F9FAFB", color: "#6B7280" }}
                          >
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#9CA3AF" }} />
                            <span>Completion data not available. Use the button below to record the campus visit.</span>
                          </div>
                        )}

                        {/* Action */}
                        <div className="pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                          {markVisitedMutation.isSuccess ? (
                            <div
                              className="flex items-center gap-2 text-sm font-semibold p-3 rounded-lg justify-center"
                              style={{ backgroundColor: "#FFF1F1", color: "#B3261E" }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Campus Visit Recorded
                            </div>
                          ) : completionData.completionAvailable &&
                            completionData.visitedCampus != null &&
                            completionData.visitedCampus >= 100 ? (
                            <div
                              className="flex items-center gap-2 text-sm font-semibold p-3 rounded-lg justify-center"
                              style={{ backgroundColor: "#FFF1F1", color: "#B3261E" }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Campus Visit Completed
                            </div>
                          ) : (
                            <Button
                              onClick={handleMarkVisited}
                              isLoading={markVisitedMutation.isPending}
                              className="w-full"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirm Campus Visit
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Link modal */}
      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Visit Link Generated">
        <div className="space-y-5">
          <div
            className="p-3 rounded-lg text-xs font-mono break-all select-all"
            style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151" }}
          >
            {generatedUrl}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
              className="text-white hover:opacity-90"
              onClick={() =>
                window.open(
                  `https://wa.me/${searchedPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Here is your campus visit link: ${generatedUrl}`
                  )}`,
                  "_blank"
                )
              }
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: "#6B7280" }}>
      <span className="shrink-0" style={{ color: "#9CA3AF" }}>{icon}</span>
      <span className="text-sm" style={{ color: "#374151" }}>{label}</span>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  valueColor,
}: {
  label: string;
  value: number;
  color: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: "#6B7280" }}>{label}</span>
        <span className="font-semibold" style={{ color: valueColor ?? color }}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
