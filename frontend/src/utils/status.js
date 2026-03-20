export function getStatusBadgeClass(status = "") {
  const normalized = String(status).trim().toLowerCase();

  if (!normalized) return "";

  if (
    normalized.includes("approved") ||
    normalized.includes("paid") ||
    normalized.includes("booked") ||
    normalized.includes("completed") ||
    normalized.includes("resolved") ||
    normalized.includes("confirmed") ||
    normalized.includes("read") ||
    normalized.includes("active") ||
    normalized.includes("on track")
  ) {
    return "success";
  }

  if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("declined") ||
    normalized.includes("failed")
  ) {
    return "danger";
  }

  if (
    normalized.includes("submitted") ||
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("open") ||
    normalized.includes("applied") ||
    normalized.includes("interview")
  ) {
    return "warning";
  }

  return "";
}
