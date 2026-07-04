"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EMAIL_STATUS_META } from "@/lib/status";
import { VERTICAL_OPTIONS } from "@/lib/format";
import type { EmailStatus, Publication, Vertical } from "@/lib/db/types";
import { useMediaParams } from "./use-media-params";

const EMAIL_OPTIONS = (Object.keys(EMAIL_STATUS_META) as EmailStatus[]).map((value) => ({
  value,
  label: EMAIL_STATUS_META[value].label,
}));

export function JournalistFilters({
  vertical,
  publicationId,
  emailStatus,
  search,
  publications,
}: {
  vertical: Vertical | "all";
  publicationId: string | "all";
  emailStatus: EmailStatus | "all";
  search: string;
  publications: Publication[];
}) {
  const { setParams } = useMediaParams();
  const [term, setTerm] = React.useState(search);
  const firstRender = React.useRef(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep the input in sync when the URL changes from elsewhere (e.g. Clear), but
  // never clobber what the user is actively typing.
  React.useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setTerm(search);
  }, [search]);

  // Debounce search pushes.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      if (term !== search) setParams({ q: term || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(id);
  }, [term, search, setParams]);

  const hasFilters =
    vertical !== "all" ||
    publicationId !== "all" ||
    emailStatus !== "all" ||
    search.trim().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search name or beat"
          className="pl-8"
          aria-label="Search journalists"
        />
      </div>

      <Select
        value={vertical}
        onValueChange={(v) => setParams({ vertical: v }, { resetPage: true })}
      >
        <SelectTrigger className="w-40" aria-label="Filter by vertical">
          <SelectValue placeholder="Vertical" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All verticals</SelectItem>
          {VERTICAL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={publicationId}
        onValueChange={(v) => setParams({ publication: v }, { resetPage: true })}
      >
        <SelectTrigger className="w-48" aria-label="Filter by publication">
          <SelectValue placeholder="Publication" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All publications</SelectItem>
          {publications.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={emailStatus}
        onValueChange={(v) => setParams({ email: v }, { resetPage: true })}
      >
        <SelectTrigger className="w-44" aria-label="Filter by email status">
          <SelectValue placeholder="Email status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All email states</SelectItem>
          {EMAIL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setParams(
              { vertical: null, publication: null, email: null, q: null },
              { resetPage: true },
            )
          }
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
