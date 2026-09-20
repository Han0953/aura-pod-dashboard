export type ViewId = "overview" | "monitoring" | "device" | "analytics" | "assistant" | "settings";

export interface NavItem {
  id: ViewId;
  label: string;
  badge?: string;
  disabled?: boolean;
}
