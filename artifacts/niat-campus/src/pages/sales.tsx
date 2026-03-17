import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Link as LinkIcon, CheckCircle2, Copy, MessageCircle, MapPin, User, Phone, Briefcase, Loader2, Globe } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useSearchUser, useGetCompletion, useGenerateLink, useMarkVisited, useUpdateUserField, SearchUserResponse, GetCompletionResponse } from "@workspace/api-client-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";

const searchSchema = z.object({
  phoneNumber: z.string().min(5, "Valid phone number required")
});

export default function SalesDashboard() {
  const { getHeaders } = useAuth();
  const { toast } = useToast();
  
  const [searchResult, setSearchResult] = useState<SearchUserResponse | null>(null);
  const [completionData, setCompletionData] = useState<GetCompletionResponse | null>(null);
  const [searchedPhone, setSearchedPhone] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [fieldUpdated, setFieldUpdated] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{phoneNumber: string}>({
    resolver: zodResolver(searchSchema)
  });

  const searchMutation = useSearchUser({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data, variables) => {
        setSearchResult(data);
        setSearchedPhone(variables.data.phoneNumber);
        setCompletionData(null);
        setFieldUpdated(false);
        if (!data.isNewUser && data.userId && data.applicationId) {
          getCompletionMutation.mutate({
            data: { userId: data.userId, applicationId: data.applicationId }
          });
        }
      },
      onError: (err: any) => {
        toast({ title: "Search Failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    }
  });

  const getCompletionMutation = useGetCompletion({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data) => setCompletionData(data),
      onError: () => toast({ title: "Failed to load progress", variant: "destructive" })
    }
  });

  const updateFieldMutation = useUpdateUserField({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        setFieldUpdated(true);
        toast({ title: "User field updated", description: "You can now generate the visit link." });
      },
      onError: (err: any) => toast({
        title: "Field update failed",
        description: err.message || "Please try again.",
        variant: "destructive"
      })
    }
  });

  const linkMutation = useGenerateLink({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: (data) => {
        setGeneratedUrl(data.redirectUrl ?? "");
        setIsLinkModalOpen(true);
      },
      onError: () => toast({
        title: "Failed to generate link",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  });

  const markVisitedMutation = useMarkVisited({
    request: { headers: getHeaders() },
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Campus marked as visited!" });
        // Optimistic update
        if (completionData) {
          setCompletionData({ ...completionData, visitedCampus: 100 });
        }
      },
      onError: (err: any) => toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  });

  const onSearch = (data: {phoneNumber: string}) => {
    searchMutation.mutate({ data });
  };

  const handleGenerateLink = () => {
    if (!searchResult || !searchResult.userId || !searchResult.applicationId) return;
    linkMutation.mutate({
      data: {
        userId: searchResult.userId,
        applicationId: searchResult.applicationId,
        phoneNumber: searchedPhone
      }
    });
  };

  const handleMarkVisited = () => {
    if (!searchResult || !searchResult.userId || !searchResult.applicationId) return;
    markVisitedMutation.mutate({
      data: {
        userId: searchResult.userId,
        applicationId: searchResult.applicationId,
        phoneNumber: searchedPhone
      }
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900">Student Search</h1>
          <p className="text-lg text-slate-500">Find existing applicants or generate visit links for new students.</p>
        </div>

        <Card className="p-2 pl-4 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSearch)} className="flex items-center gap-4">
            <Search className="w-6 h-6 text-slate-400 shrink-0" />
            <input 
              {...register("phoneNumber")}
              className="flex-1 h-12 bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-400"
              placeholder="Enter phone number (e.g. +919876543210)"
            />
            <Button type="submit" size="lg" isLoading={searchMutation.isPending} className="shrink-0">
              Search
            </Button>
          </form>
          {errors.phoneNumber && <p className="text-destructive text-sm mt-2 px-4">{errors.phoneNumber.message}</p>}
        </Card>

        <AnimatePresence mode="wait">
          {searchResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-8"
            >
              {searchResult.isNewUser ? (
                <Card className="p-8 text-center max-w-2xl mx-auto border-dashed border-2 border-blue-200 bg-blue-50/50">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">New Prospect Found</h3>
                  <p className="text-slate-600 mb-8">
                    This phone number is not registered. First update the user's field, then generate the visit link.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* Step 1: Update user field */}
                    <Button
                      size="lg"
                      variant={fieldUpdated ? "outline" : "default"}
                      onClick={() => {
                        if (!searchResult.userId || !searchResult.applicationId) return;
                        updateFieldMutation.mutate({
                          data: { userId: searchResult.userId, applicationId: searchResult.applicationId }
                        });
                      }}
                      isLoading={updateFieldMutation.isPending}
                      disabled={updateFieldMutation.isPending || fieldUpdated}
                      className="w-full sm:w-auto"
                    >
                      {updateFieldMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Updating Field…</>
                      ) : fieldUpdated ? (
                        <><CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />Field Updated</>
                      ) : (
                        <>Update User Field</>
                      )}
                    </Button>

                    {/* Step 2: Generate link — only enabled after field update */}
                    <Button
                      size="lg"
                      onClick={handleGenerateLink}
                      isLoading={linkMutation.isPending}
                      disabled={!fieldUpdated || linkMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {linkMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating…</>
                      ) : (
                        <><LinkIcon className="w-5 h-5 mr-2" />Generate Direct Visit Link</>
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* User Info Card */}
                    <Card className="p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <User className="text-primary w-5 h-5" /> 
                          Student Details
                        </h3>
                        <Badge variant="success">Existing Lead</Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                          <User className="w-4 h-4" />
                          <span className="font-medium text-slate-900">{searchResult.studentInfo?.name || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{searchResult.studentInfo?.phone || searchedPhone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">App ID: {searchResult.applicationId}</span>
                        </div>
                        {searchResult.studentInfo?.language && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <Globe className="w-4 h-4" />
                            <span className="capitalize">{searchResult.studentInfo.language}</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Progress Card */}
                    <Card className="p-6 space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 pb-4">
                        <MapPin className="text-primary w-5 h-5" /> 
                        Visit Status
                      </h3>
                      
                      {getCompletionMutation.isPending ? (
                        <div className="flex justify-center py-8 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      ) : completionData ? (
                        <div className="space-y-6">
                          {completionData.completionAvailable && completionData.bookedCampusVisit != null && (
                            <div>
                              <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-slate-600">Application Progress</span>
                                <span className="text-primary">{completionData.bookedCampusVisit}%</span>
                              </div>
                              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${completionData.bookedCampusVisit}%` }} />
                              </div>
                            </div>
                          )}

                          {completionData.completionAvailable && completionData.visitedCampus != null && (
                            <div>
                              <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-slate-600">Campus Visited</span>
                                <span className={completionData.visitedCampus === 100 ? "text-emerald-600" : "text-amber-600"}>
                                  {completionData.visitedCampus}%
                                </span>
                              </div>
                              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all duration-1000", completionData.visitedCampus === 100 ? "bg-emerald-500" : "bg-amber-400")} 
                                  style={{ width: `${completionData.visitedCampus}%` }} 
                                />
                              </div>
                            </div>
                          )}

                          {(!completionData.completionAvailable) && (
                            <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>Completion data requires user-level access. Use the action below to record the campus visit.</span>
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100">
                            {markVisitedMutation.isSuccess ? (
                              <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-4 rounded-xl justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                                Campus Visit Recorded
                              </div>
                            ) : completionData.completionAvailable && completionData.visitedCampus != null && completionData.visitedCampus >= 100 ? (
                              <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-4 rounded-xl justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                                Campus Visit Completed
                              </div>
                            ) : (
                              <Button 
                                onClick={handleMarkVisited} 
                                isLoading={markVisitedMutation.isPending}
                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-amber-600 text-white"
                              >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Mark Campus as Visited
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </Card>

                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Visit Link Generated!">
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl break-all text-sm font-mono text-slate-700 select-all">
              {generatedUrl}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" /> Copy Link
              </Button>
              <Button 
                className="bg-[#25D366] hover:bg-[#128C7E] text-white border-transparent"
                onClick={() => window.open(`https://wa.me/${searchedPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`Here is your campus visit link: ${generatedUrl}`)}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Share
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </Layout>
  );
}
