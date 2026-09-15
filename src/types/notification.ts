export type NotificationSeverity = "info" | "warning" | "error" | "success";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string;
  read: boolean;
}
