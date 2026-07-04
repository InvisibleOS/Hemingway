/**
 * Thrown by "shell" real providers that are documented but not yet integrated.
 * Each mock row in docs/providers.md becomes one API key + one real provider
 * file to go live; until then the real path throws this with integration notes.
 */
export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}
