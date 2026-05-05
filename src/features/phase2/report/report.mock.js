export function submitReport(payload) {
  return { reportId: Date.now(), ...payload, submitted: true };
}

