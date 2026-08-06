export class LinkedInClientNotInitializedError extends Error {
  constructor() {
    super("Client not initialized. Please call Client({ JSESSIONID, li_at }) first.");
    this.name = "LinkedInClientNotInitializedError";
  }
}

export class LinkedInAuthRedirectError extends Error {
  public readonly status: number;
  public readonly location: string | null;

  constructor(input: { status: number; location: string | null }) {
    super(
      `LinkedIn authentication required (HTTP ${input.status})${
        input.location ? ` -> ${input.location}` : ""
      }`,
    );
    this.name = "LinkedInAuthRedirectError";
    this.status = input.status;
    this.location = input.location;
  }
}

export class LinkedInUnexpectedHtmlError extends Error {
  public readonly length: number;
  public readonly location: string | null;

  constructor(input: { length: number; location: string | null }) {
    super(
      `LinkedIn returned an HTML page (${input.length} bytes) instead of JSON. Session cookies are probably expired or invalid.${
        input.location ? ` Redirect target: ${input.location}` : ""
      }`,
    );
    this.name = "LinkedInUnexpectedHtmlError";
    this.length = input.length;
    this.location = input.location;
  }
}
