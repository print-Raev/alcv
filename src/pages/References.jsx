import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, Quote } from "lucide-react";

const PROJECT_TYPES = ["Retail", "Restaurant", "Medical", "Office", "Residential", "Industrial", "Education", "Hospitality"];
const typeColors = {
  Retail: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Restaurant: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medical: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Office: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Residential: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Industrial: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Education: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Hospitality: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const emptyRef = { project_name: "", project_type: "", client_name: "", client_company: "", location: "", square_footage: 0, testimonial: "", contact_info: "" };

export default function References() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRef);
  const queryClient = useQueryClient();

  const { data: references = [] } = useQuery({
    queryKey: ["references"],
    queryFn: () => base44.entities.Reference.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reference.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["references"] }); setOpen(false); setForm(emptyRef); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reference.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["references"] }); setOpen(false); setEditing(null); setForm(emptyRef); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reference.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  const handleEdit = (ref) => {
    setEditing(ref);
    setForm({ project_name: ref.project_name, project_type: ref.project_type, client_name: ref.client_name || "", client_company: ref.client_company || "", location: ref.location || "", square_footage: ref.square_footage || 0, testimonial: ref.testimonial || "", contact_info: ref.contact_info || "" });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">References</h1>
          <p className="text-sm text-[#737373] mt-1">Past projects auto-matched to new proposals by type</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyRef); } }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
              <Plus className="w-4 h-4" />Add Reference
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-[#1f1f1f] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Reference" : "New Reference"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs text-[#737373]">Project Name</Label>
                <Input value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#737373]">Project Type</Label>
                  <Select value={form.project_type} onValueChange={v => setForm({ ...form, project_type: v })}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                      {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#737373]">Square Footage</Label>
                  <Input type="number" value={form.square_footage} onChange={e => setForm({ ...form, square_footage: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#737373]">Client Name</Label>
                  <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#737373]">Company</Label>
                  <Input value={form.client_company} onChange={e => setForm({ ...form, client_company: e.target.value })}
                    className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#737373]">Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#737373]">Testimonial</Label>
                <Textarea value={form.testimonial} onChange={e => setForm({ ...form, testimonial: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#737373]">Contact Info</Label>
                <Input value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })}
                  className="bg-[#0a0a0a] border-[#1f1f1f] text-white mt-1" />
              </div>
              <Button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                {editing ? "Update" : "Create"} Reference
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {references.map(ref => (
          <Card key={ref.id} className="bg-[#141414] border-[#1f1f1f] p-5 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#737373]" />
                <Badge className={`${typeColors[ref.project_type] || typeColors.Office} border text-[10px]`}>
                  {ref.project_type}
                </Badge>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#737373] hover:text-white hover:bg-[#1a1a1a]"
                  onClick={() => handleEdit(ref)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#737373] hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => deleteMutation.mutate(ref.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-white mb-1">{ref.project_name}</h3>
            <p className="text-xs text-[#737373] mb-3">
              {ref.client_company} · {ref.location} · {(ref.square_footage || 0).toLocaleString()} sqft
            </p>
            {ref.testimonial && (
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1f1f1f]">
                <Quote className="w-3 h-3 text-orange-400 mb-1" />
                <p className="text-xs text-[#a3a3a3] italic leading-relaxed">"{ref.testimonial}"</p>
                <p className="text-[10px] text-[#737373] mt-2">— {ref.client_name}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}