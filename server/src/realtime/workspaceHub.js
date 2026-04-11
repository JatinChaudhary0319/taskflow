/**
 * In-memory SSE fan-out per user (projects list / workspace). Single API instance only.
 * @type {Map<string, Set<import('http').ServerResponse>>}
 */
const byUserId = new Map();

function subscribe(userId, res) {
  let set = byUserId.get(userId);
  if (!set) {
    set = new Set();
    byUserId.set(userId, set);
  }
  set.add(res);

  const cleanup = () => {
    set.delete(res);
    if (set.size === 0) byUserId.delete(userId);
  };
  res.on("close", cleanup);
  res.on("finish", cleanup);
  return cleanup;
}

function broadcastUser(userId, payload) {
  const set = byUserId.get(userId);
  if (!set?.size) return;
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const r of set) {
    try {
      if (!r.writableEnded) r.write(line);
    } catch {
      /* client gone */
    }
  }
}

function broadcastMany(userIds, payload) {
  const seen = new Set();
  for (const uid of userIds) {
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    broadcastUser(uid, payload);
  }
}

module.exports = { subscribe, broadcastUser, broadcastMany };
