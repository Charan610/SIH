import { NSQFCourse } from "@/types/api";
import { getApiBaseUrl } from "../config";

export const coursesService = {
  async getCourses(sector?: string): Promise<{ total: number; courses: NSQFCourse[] }> {
    const url = new URL(`${getApiBaseUrl()}/courses`);
    if (sector) url.searchParams.set("sector", sector);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Failed to fetch course catalog: ${res.statusText}`);
    return res.json();
  },

  async getCourseById(id: number | string): Promise<NSQFCourse> {
    const res = await fetch(`${getApiBaseUrl()}/courses/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Course not found (ID: ${id})`);
    return res.json();
  }
};
