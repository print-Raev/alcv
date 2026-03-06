import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, DollarSign, Clock, TrendingUp, Zap } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Dashboard() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const totalRevenue = projects.filter(p => p.status === "Accepted").reduce((s, p) => s + (p.total_price || 0), 0);
  const pendingValue = projects.filter(p => p.status === "Sent" || p.status === "Draft").reduce((s, p) => s + (p.total_price || 0), 0);
  const winRate = projects.length > 0
    ? Math.round((projects.filter(p => p.status === "Accepted").length / projects.filter(p => p.status !== "Draft").length) * 100) || 0
    : 0;

  const stats = [
    { label: "Total Proposals", value: projects.length, icon: FileText, color: "orange" },
    { label: "Won Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "emerald" },
    { label: "Pipeline Value", value: `$${pendingValue.toLocaleString()}`, icon: Clock, color: "blue" },
    { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, color: "purple" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#737373] mt-1">AllClear Services — Bidding & Lead Generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("WarRoom")}>
            <Button variant="outline" className="border-[#1f1f1f] bg-[#141414] text-[#737373] hover:text-white font-semibold gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              War Room
            </Button>
          </Link>
          <Link to={createPageUrl("NewProposal")}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
              <Plus className="w-4 h-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bento-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mono-data">{stat.value}</div>
            <div className="text-xs text-[#737373] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Proposals */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#737373] mb-4">Recent Proposals</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-[#141414] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-[#141414] border-[#1f1f1f] p-12 text-center">
            <FileText className="w-10 h-10 text-[#737373] mx-auto mb-3" />
            <p className="text-white font-medium">No proposals yet</p>
            <p className="text-sm text-[#737373] mt-1">Create your first proposal to get started</p>
            <Link to={createPageUrl("NewProposal")}>
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">Create Proposal</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project, idx) => {
              const isDraft = project.status === "Draft";
              const isHighValue = (project.total_price || 0) > 2000;
              const isBig = isDraft && isHighValue && idx < 2;
              return (
                <Link
                  key={project.id}
                  to={createPageUrl(`NewProposal?id=${project.id}`)}
                  className={isBig ? "sm:col-span-2 lg:col-span-2" : ""}
                >
                  <div className="bento-card rounded-2xl p-4 cursor-pointer group hover:border-white/12 transition-all duration-200 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl border border-orange-500/15 flex items-center justify-center text-orange-400 font-black text-sm shrink-0">
                          {(project.project_name || "P")[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                            {project.project_name || "Untitled"}
                          </div>
                          <div className="text-[11px] text-[#737373] mt-0.5 truncate">
                            {project.client_company || project.address || "No details"}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${statusColors[project.status || "Draft"]} border text-[10px] shrink-0`}>
                        {project.status || "Draft"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="mono-data text-sm font-bold text-white">
                        ${(project.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-[#737373]">
                        {project.created_date ? format(new Date(project.created_date), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}