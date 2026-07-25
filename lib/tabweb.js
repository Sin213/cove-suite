// Pure decision helpers for the Foxy Mode (v5) tab-web host. Kept out of
// main.js so the lifecycle rules can be tested without an Electron runtime.

// What should happen when a tab_ready message arrives?
//   'ignore' - not a tab-web run, bad URL, duplicate, or post-fallback
//   'record' - remember the URL but build no view (the tab was closed while
//              the app was still starting; nobody would see the view)
//   'attach' - remember the URL and build the hosted view
function tabReadyDecision(entry, proto, url, isValidUrl) {
  if (!entry || entry.openMode !== 'tab-web') return 'ignore';
  if (typeof url !== 'string' || !isValidUrl(url)) return 'ignore';
  if (!proto) return 'attach';
  if (proto.tabUrl || proto.tabFallback) return 'ignore';
  return proto.tabClosed ? 'record' : 'attach';
}

// May a paused session (tab closed, app still alive) be rebuilt from the URL
// the app already reported?
function canResumeHostedView(entry, isValidUrl) {
  if (!entry || entry.openMode !== 'tab-web') return false;
  if (!['launching', 'running'].includes(entry.status)) return false;
  const url = entry.protocol?.tabUrl;
  if (typeof url !== 'string' || !isValidUrl(url)) return false;
  return true;
}

module.exports = { tabReadyDecision, canResumeHostedView };
