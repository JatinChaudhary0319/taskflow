/**
 * In-memory SSE fan-out per project. Single API instance only (see README).
 * @type {Map<string, Set<import('http').ServerResponse>>}
 */
const byProject = new Map();

function subscribe(projectId, res) {
  let set = byProject.get(projectId);
  if (!set) {
    set = new Set();
    byProject.set(projectId, set);
  }
  set.add(res);

  const cleanup = () => {
    set.delete(res);
    if (set.size === 0) byProject.delete(projectId);
  };
  res.on("close", cleanup);
  res.on("finish", cleanup);
  return cleanup;
}

function broadcast(projectId, payload) {
  const set = byProject.get(projectId);
  if (!set?.size) return;
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      if (!res.writableEnded) res.write(line);
    } catch {
      /* client gone */
    }
  }
}

module.exports = { subscribe, broadcast };
