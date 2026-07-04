"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createCampaignAction, updateCampaignDetailsAction } from "../actions";

type CampaignInitial = {
  id: string;
  name: string;
  story_angle: string | null;
  data_study_title: string | null;
  data_study_summary: string | null;
  data_study_url: string | null;
};

export function CampaignFormDialog({
  mode,
  clientId,
  campaign,
  trigger,
}: {
  mode: "create" | "edit";
  clientId?: string;
  campaign?: CampaignInitial;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState(campaign?.name ?? "");
  const [storyAngle, setStoryAngle] = React.useState(campaign?.story_angle ?? "");
  const [studyTitle, setStudyTitle] = React.useState(campaign?.data_study_title ?? "");
  const [studySummary, setStudySummary] = React.useState(campaign?.data_study_summary ?? "");
  const [studyUrl, setStudyUrl] = React.useState(campaign?.data_study_url ?? "");

  const resetToInitial = () => {
    setName(campaign?.name ?? "");
    setStoryAngle(campaign?.story_angle ?? "");
    setStudyTitle(campaign?.data_study_title ?? "");
    setStudySummary(campaign?.data_study_summary ?? "");
    setStudyUrl(campaign?.data_study_url ?? "");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !storyAngle.trim()) return;
    const values = {
      name,
      storyAngle,
      dataStudyTitle: studyTitle,
      dataStudySummary: studySummary,
      dataStudyUrl: studyUrl,
    };
    startTransition(async () => {
      try {
        if (mode === "create") {
          if (!clientId) throw new Error("Select a client first.");
          const res = await createCampaignAction(clientId, values);
          setOpen(false);
          router.push(`/campaigns/${res.id}`);
        } else if (campaign) {
          await updateCampaignDetailsAction(campaign.id, values);
          toast("Campaign updated");
          setOpen(false);
          router.refresh();
        }
      } catch (err) {
        toast.error(mode === "create" ? "Could not create campaign" : "Could not save campaign", {
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
        if (next) resetToInitial();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New campaign" : "Edit campaign"}</DialogTitle>
          <DialogDescription>
            The story angle and data study drive matching and pitch drafting.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Monsoon Menu Launch"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-story">Story angle</Label>
            <Textarea
              id="campaign-story"
              value={storyAngle}
              onChange={(e) => setStoryAngle(e.target.value)}
              placeholder="The one-paragraph angle journalists will respond to, with the hook up front."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-study-title">Data study title</Label>
            <Input
              id="campaign-study-title"
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              placeholder="How Bengaluru eats through the monsoon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-study-summary">Data study summary</Label>
            <Textarea
              id="campaign-study-summary"
              value={studySummary}
              onChange={(e) => setStudySummary(e.target.value)}
              placeholder="The key finding, in one or two sentences."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-study-url">Data study URL</Label>
            <Input
              id="campaign-study-url"
              value={studyUrl}
              onChange={(e) => setStudyUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim() || !storyAngle.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {mode === "create" ? "Create campaign" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
