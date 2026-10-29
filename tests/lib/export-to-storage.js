// Turns an exported backup into the localStorage a device would hold, so a test can start the app "on that device".
"use strict";
function exportToStorage(d) {
  const ls = {};
  const put = (k, v) => { if (v !== undefined && v !== null) ls["frverbs." + k] = JSON.stringify(v); };
  put("settings", Object.assign({ schema: 1 }, d.settings));
  put("progress", d.progress); put("schedule", d.schedule); put("formsched", d.formsched);
  put("review", d.review); put("timing", d.timing); put("history", d.history); put("session", d.session);
  put("lastbackup", undefined);
  return ls;
}
module.exports = { exportToStorage };
