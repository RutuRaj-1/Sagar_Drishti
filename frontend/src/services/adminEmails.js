// SAGAR-DRISHTI hard-coded admin allowlist.
// These accounts always resolve to the 'admin' role, regardless of what is
// stored in Firestore (and even when Firestore is unreachable).
// Kept free of Firebase imports so auth code can check it without loading the SDK.

export const ADMIN_EMAILS = [
  "bhomeruturaj@gmail.com",
];

export const isAdminEmail = (email) => ADMIN_EMAILS.includes((email || "").trim().toLowerCase());
