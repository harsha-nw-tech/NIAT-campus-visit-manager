export const MOCK_USERS: Record<
  string,
  {
    userId: string;
    applicationId: string;
    name: string;
    language: string;
    bookedCampusVisit: number;
    officeVisit: number;
    scenario: string;
  }
> = {
  "0000000001": {
    userId: "mock-user-001",
    applicationId: "mock-app-001",
    name: "Test User — Booked Not Visited",
    language: "ENGLISH",
    bookedCampusVisit: 100,
    officeVisit: 0,
    scenario: "Booked campus visit, office visit NOT yet recorded → shows Confirm Campus Visit button",
  },
  "0000000004": {
    userId: "mock-user-004",
    applicationId: "mock-app-004",
    name: "Test User 2 — Booked Not Visited",
    language: "HINDI",
    bookedCampusVisit: 100,
    officeVisit: 0,
    scenario: "Booked campus visit, office visit NOT yet recorded → shows Confirm Campus Visit button",
  },
  "0000000002": {
    userId: "mock-user-002",
    applicationId: "mock-app-002",
    name: "Test User — Already Visited",
    language: "HINDI",
    bookedCampusVisit: 100,
    officeVisit: 100,
    scenario: "Both complete → shows Campus Visit Recorded (no action needed)",
  },
  "0000000003": {
    userId: "mock-user-003",
    applicationId: "mock-app-003",
    name: "Test User — Not Booked Yet",
    language: "TELUGU",
    bookedCampusVisit: 0,
    officeVisit: 0,
    scenario: "Campus visit not booked at all → no visit button shown",
  },
};

export function getMockUser(phoneNumber: string) {
  return MOCK_USERS[phoneNumber] ?? null;
}
