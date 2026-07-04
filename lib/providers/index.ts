/**
 * Provider hub. This is the single place that resolves each external service to
 * its mock or real implementation from the `<NAME>_PROVIDER` env var. The rest
 * of the app imports the resolved providers from here and never learns which
 * mode is active, nor imports an SDK, nor calls an external API directly
 * (CLAUDE.md, the most important rule).
 */
import { providerMode } from "./mode";

import { mockScraper } from "./scraper/mock";
import { realScraper } from "./scraper/real";
import type { ScraperProvider } from "./scraper/types";

import { mockLlm } from "./llm/mock";
import { realLlm } from "./llm/real";
import type { LlmProvider } from "./llm/types";

import { mockSeoData } from "./seoData/mock";
import { realSeoData } from "./seoData/real";
import type { SeoDataProvider } from "./seoData/types";

import { mockVerifier } from "./verifier/mock";
import { realVerifier } from "./verifier/real";
import type { VerifierProvider } from "./verifier/types";

import { mockSender } from "./sender/mock";
import { realSender } from "./sender/real";
import type { SenderProvider } from "./sender/types";

import { mockExpertFeeds } from "./expertFeeds/mock";
import { realExpertFeeds } from "./expertFeeds/real";
import type { ExpertFeedsProvider } from "./expertFeeds/types";

import { mockDomainHealth } from "./domainHealth/mock";
import { realDomainHealth } from "./domainHealth/real";
import type { DomainHealthProvider } from "./domainHealth/types";

export const scraper: ScraperProvider =
  providerMode("SCRAPER") === "real" ? realScraper : mockScraper;

export const llm: LlmProvider =
  providerMode("LLM") === "real" ? realLlm : mockLlm;

export const seoData: SeoDataProvider =
  providerMode("SEODATA") === "real" ? realSeoData : mockSeoData;

export const verifier: VerifierProvider =
  providerMode("VERIFIER") === "real" ? realVerifier : mockVerifier;

export const sender: SenderProvider =
  providerMode("SENDER") === "real" ? realSender : mockSender;

export const expertFeeds: ExpertFeedsProvider =
  providerMode("EXPERTFEEDS") === "real" ? realExpertFeeds : mockExpertFeeds;

export const domainHealth: DomainHealthProvider =
  providerMode("DOMAINHEALTH") === "real" ? realDomainHealth : mockDomainHealth;

export { providerMode, type ProviderMode } from "./mode";
export { NotImplementedError } from "./errors";
export * from "./registry";
export type * from "./scraper/types";
export type * from "./llm/types";
export type * from "./seoData/types";
export type * from "./verifier/types";
export type * from "./sender/types";
export type * from "./expertFeeds/types";
export type * from "./domainHealth/types";
