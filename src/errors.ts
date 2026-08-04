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
