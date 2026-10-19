import { describe, expect, it } from "vitest";
import { computeStats } from "./stats";
import { deadlineInfo, zonedToUtc } from "./dates";

const now = new Date("2026-10-21T12:00:00Z"); // Wednesday
const t = (due: string, status = "todo", completed_at: string | null = null) => ({
  due_at: due, status, completed_at, has_due_time: false, course_id: null,
});

describe("stats", () => {
  const tasks = [
    t("2026-10-21T20:00:00Z"),
    t("2026-10-19T10:00:00Z"),
    t("2026-10-23T10:00:00Z", "completed", "2026-10-20T10:00:00Z"),
    t("2026-10-24T10:00:00Z"),
  ];
  const s = computeStats(tasks, "UTC", 1, now);
  it("counts due today", () => expect(s.dueToday).toBe(1));
  it("counts overdue", () => expect(s.overdue).toBe(1));
  it("counts completed this week", () => expect(s.completedThisWeek).toBe(1));
  it("completion rate is completed / all tasks", () => expect(s.completionRate).toBe(25));
});

describe("dates", () => {
  it("labels overdue", () => expect(deadlineInfo("2026-10-20T10:00:00Z", "UTC", false, now).label).toBe("Overdue"));
  it("labels due in 3 days", () => expect(deadlineInfo("2026-10-24T10:00:00Z", "UTC", false, now).label).toBe("Due in 3 days"));
  it("converts zone wall time to UTC", () =>
    expect(zonedToUtc("2026-10-21", "09:00", "America/New_York").toISOString()).toBe("2026-10-21T13:00:00.000Z"));
});
