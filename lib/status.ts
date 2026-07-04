/**
 * Enum state to status-pill mapping. This is the single source of truth that
 * mirrors design/README.md: every enum state from docs/data-model.md maps to one
 * semantic hue. Accent (orange) is reserved for two states only: pitch
 * `approved` and monitor `won`. Everything else uses a muted status hue.
 *
 * The hue keys line up with the --status-<hue>-bg / --status-<hue>-fg tokens in
 * app/globals.css; `accent` uses the brand subtle tokens.
 */
import type {
  CampaignStatus,
  EmailStatus,
  MonitorEventStatus,
  MonitorSource,
  PitchStatus,
  PlacementType,
  SendingDomainStatus,
} from "@/lib/db/types";

export type StatusHue =
  | "neutral"
  | "info"
  | "progress"
  | "signal"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export type StatusMeta = {
  label: string;
  hue: StatusHue;
  /** Category or terminal-but-idle states render at a calmer weight. */
  dim?: boolean;
};

export const EMAIL_STATUS_META: Record<EmailStatus, StatusMeta> = {
  unverified: { label: "Unverified", hue: "neutral" },
  pattern_guess: { label: "Pattern guess", hue: "warning" },
  verified: { label: "Verified", hue: "success" },
  bounced: { label: "Bounced", hue: "danger" },
};

export const SENDING_DOMAIN_STATUS_META: Record<SendingDomainStatus, StatusMeta> = {
  not_setup: { label: "Not set up", hue: "neutral" },
  warming: { label: "Warming", hue: "warning" },
  ready: { label: "Ready", hue: "success" },
  degraded: { label: "Degraded", hue: "danger" },
};

export const CAMPAIGN_STATUS_META: Record<CampaignStatus, StatusMeta> = {
  draft: { label: "Draft", hue: "neutral" },
  matching: { label: "Matching", hue: "info" },
  pitching: { label: "Pitching", hue: "progress" },
  active: { label: "Active", hue: "success" },
  closed: { label: "Closed", hue: "neutral", dim: true },
};

export const PITCH_STATUS_META: Record<PitchStatus, StatusMeta> = {
  drafted: { label: "Drafted", hue: "neutral" },
  edited: { label: "Edited", hue: "info" },
  approved: { label: "Approved", hue: "accent" },
  pushed: { label: "Pushed", hue: "progress" },
  replied: { label: "Replied", hue: "signal" },
  placed: { label: "Placed", hue: "success" },
  declined: { label: "Declined", hue: "danger" },
  bounced: { label: "Bounced", hue: "danger" },
};

export const MONITOR_EVENT_STATUS_META: Record<MonitorEventStatus, StatusMeta> = {
  new: { label: "New", hue: "info" },
  drafted: { label: "Drafted", hue: "progress" },
  responded: { label: "Responded", hue: "success" },
  won: { label: "Won", hue: "accent" },
  ignored: { label: "Ignored", hue: "neutral", dim: true },
};

// monitor_source is a category, not a status, so these read as calmer tags.
export const MONITOR_SOURCE_META: Record<MonitorSource, StatusMeta> = {
  expert_platform: { label: "Expert request", hue: "info" },
  journo_request: { label: "Journalist request", hue: "progress" },
  brand_mention: { label: "Brand mention", hue: "signal" },
};

export const PLACEMENT_TYPE_META: Record<PlacementType, StatusMeta> = {
  feature: { label: "Feature", hue: "progress", dim: true },
  quote: { label: "Quote", hue: "info", dim: true },
  listicle: { label: "Listicle", hue: "signal", dim: true },
  directory: { label: "Directory", hue: "neutral", dim: true },
  mention: { label: "Mention", hue: "neutral", dim: true },
};

export const emailStatusMeta = (s: EmailStatus): StatusMeta => EMAIL_STATUS_META[s];
export const sendingDomainStatusMeta = (s: SendingDomainStatus): StatusMeta =>
  SENDING_DOMAIN_STATUS_META[s];
export const campaignStatusMeta = (s: CampaignStatus): StatusMeta => CAMPAIGN_STATUS_META[s];
export const pitchStatusMeta = (s: PitchStatus): StatusMeta => PITCH_STATUS_META[s];
export const monitorEventStatusMeta = (s: MonitorEventStatus): StatusMeta =>
  MONITOR_EVENT_STATUS_META[s];
export const monitorSourceMeta = (s: MonitorSource): StatusMeta => MONITOR_SOURCE_META[s];
export const placementTypeMeta = (s: PlacementType): StatusMeta => PLACEMENT_TYPE_META[s];
