import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Search, MoreVertical, Pencil, Trash2, CheckCircle2, Send, XCircle } from "lucide-react";

const statusColors = {
  Draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const filtered = projects.filter(p => {
    const matchSearch = !search || (p.project_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.client_company || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Projects</h1>
      <p className="text-sm text-[#737373] mb-6">Manage all your proposals and bids</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
            className="bg-[#141414] border-[#1f1f1f] text-white pl-10 focus:border-orange-500/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-[#141414] border-[#1f1f1f] text-white w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[#1f1f1f]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project List */}
      <div className="space-y-2">
        {filtered.map(project => (
          <Card key={project.id} className="bg-[#141414] border-[#1f1f1f] p-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl(`NewProposal?id=${project.id}`)} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                  {(project.project_name || "P")[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">{project.project_name || "Untitled"}</div>
                  <div className="text-xs text-[#737373] truncate">
                    {[project.client_company, project.project_type, project.address].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white">${(project.total_price || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[#737373]">
                    {project.created_date && format(new Date(project.created_date), "MMM d")}
                  </div>
                </div>
                <Badge className={`${statusColors[project.status || "Draft"]} border text-[10px]`}>
                  {project.status || "Draft"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-[#737373] hover:text-white hover:bg-[#1a1a1a] h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#141414] border-[#1f1f1f] text-white" align="end">
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: project.id, data: { status: "Sent" } })}
                      className="hover:bg-[#1a1a1a] cursor-pointer">
                      <Send className="w-3.5 h-3.5 mr-2" />Mark as Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: project.id, data: { status: "Accepted" } })}
                      className="hover:bg-[#1a1a1a] cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" />Mark as Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: project.id, data: { status: "Declined" } })}
                      className="hover:bg-[#1a1a1a] cursor-pointer">
                      <XCircle className="w-3.5 h-3.5 mr-2" />Mark as Declined
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteMutation.mutate(project.id)}
                      className="hover:bg-red-500/10 text-red-400 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-[#737373]">
            <p className="text-sm">No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
}