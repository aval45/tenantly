export type AppErrorCode =
  "dashboard_unavailable" | "unauthorized" | "session_restore_failed";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly recoveryLabel?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
