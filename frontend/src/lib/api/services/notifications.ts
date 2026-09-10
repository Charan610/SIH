export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: "recommendation" | "training" | "assessment" | "profile" | "system";
  read: boolean;
  link?: string;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Statutory Scheme Eligibility Confirmed",
    message: "Your profile fulfills PM-AJAY GIA norms (income < ₹3.00L, age within 14-45 range).",
    timestamp: "10m ago",
    category: "assessment",
    read: false,
    link: "/recommendations",
  },
  {
    id: "notif-2",
    title: "New NSQF Batch Available in Guntur",
    message: "Electric Vehicle Maintenance Technician batch opens Monday at Government ITI.",
    timestamp: "2h ago",
    category: "training",
    read: false,
    link: "/courses/1",
  },
  {
    id: "notif-3",
    title: "ML Recommendation Updated",
    message: "Your pathway match index was updated with regional demand signals from DSDP.",
    timestamp: "1d ago",
    category: "recommendation",
    read: true,
    link: "/opportunities",
  },
  {
    id: "notif-4",
    title: "Profile Completion Reminder",
    message: "Add your preferred district and training center choice to reach 100% profile score.",
    timestamp: "2d ago",
    category: "profile",
    read: true,
    link: "/profile",
  },
  {
    id: "notif-5",
    title: "System Update: NCVET Catalog Synchronized",
    message: "Official 2025 qualification packs for green jobs and solar PV have been refreshed.",
    timestamp: "3d ago",
    category: "system",
    read: true,
    link: "/about/data-sources",
  }
];

export const notificationsService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (typeof window === "undefined") return defaultNotifications;
    const stored = localStorage.getItem("sih_notifications");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // use default
      }
    }
    localStorage.setItem("sih_notifications", JSON.stringify(defaultNotifications));
    return defaultNotifications;
  },

  async markAsRead(id: string): Promise<NotificationItem[]> {
    const list = await this.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    if (typeof window !== "undefined") {
      localStorage.setItem("sih_notifications", JSON.stringify(updated));
    }
    return updated;
  },

  async markAllAsRead(): Promise<NotificationItem[]> {
    const list = await this.getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    if (typeof window !== "undefined") {
      localStorage.setItem("sih_notifications", JSON.stringify(updated));
    }
    return updated;
  }
};

export function getLocalizedNotification(
  notif: NotificationItem,
  t: (key: string, fallback?: string) => string,
  lang: string
): NotificationItem {
  const keyBase = notif.id.replace("notif-", "n");
  const title = t(`notifications_content.${keyBase}_title`, notif.title);
  const message = t(`notifications_content.${keyBase}_message`, notif.message);

  const categoryMap: Record<string, Record<string, string>> = {
    assessment: { en: "Assessment", te: "అంచనా", hi: "मूल्यांकन" },
    training: { en: "Training", te: "శిక్షణ", hi: "प्रशिक्षण" },
    recommendation: { en: "Recommendation", te: "సిఫార్సు", hi: "सिफारिश" },
    profile: { en: "Profile", te: "ప్రొఫైల్", hi: "प्रोफ़ाइल" },
    system: { en: "System", te: "సిస్టమ్", hi: "सिस्टम" },
  };

  const timeMap: Record<string, Record<string, string>> = {
    "10m ago": { en: "10m ago", te: "10 నిమిషాల క్రితం", hi: "10 मिनट पहले" },
    "2h ago": { en: "2h ago", te: "2 గంటల క్రితం", hi: "2 घंटे पहले" },
    "1d ago": { en: "1d ago", te: "1 రోజు క్రితం", hi: "1 दिन पहले" },
    "2d ago": { en: "2d ago", te: "2 రోజుల క్రితం", hi: "2 दिन पहले" },
    "3d ago": { en: "3d ago", te: "3 రోజుల క్రితం", hi: "3 दिन पहले" },
  };

  return {
    ...notif,
    title,
    message,
    category: (categoryMap[notif.category]?.[lang] as any) || notif.category,
    timestamp: timeMap[notif.timestamp]?.[lang] || notif.timestamp,
  };
}
