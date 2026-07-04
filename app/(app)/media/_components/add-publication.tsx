"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIER_OPTIONS, VERTICAL_OPTIONS } from "@/lib/format";
import type { PublicationTier, Vertical } from "@/lib/db/types";
import { addPublicationAction } from "../actions";

export function AddPublicationButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [vertical, setVertical] = React.useState<Vertical | "">("");
  const [tier, setTier] = React.useState<PublicationTier>("regional");
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setUrl("");
    setVertical("");
    setTier("regional");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !vertical) return;
    startTransition(async () => {
      try {
        const res = await addPublicationAction({ url, vertical, tier });
        toast("Ingestion started", { description: `${res.name} is being profiled in the background.` });
        setOpen(false);
        reset();
        router.push("/media?tab=publications");
        router.refresh();
      } catch (err) {
        toast.error("Could not add publication", {
          description: err instanceof Error ? err.message : "Try again.",
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add publication
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add publication</DialogTitle>
          <DialogDescription>
            Map a publication and ingest its journalists. Scraping, classification and email
            verification run in the background.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publication-url">Publication URL</Label>
            <Input
              id="publication-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="thehindu.com"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vertical</Label>
              <Select value={vertical} onValueChange={(v) => setVertical(v as Vertical)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  {VERTICAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as PublicationTier)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !url.trim() || !vertical}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Start ingestion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
