const workspaceHub = require("./workspaceHub");

/**
 * Notify all users who should refresh GET /projects (owner, assignees, creators on this project),
 * plus any extra IDs (e.g. previous assignee after reassignment).
 */
async function notifyProjectWorkspace(projectsRepository, projectId, extraUserIds = []) {
  let primary = [];
  try {
    primary = await projectsRepository.listProjectStakeholderUserIds(projectId);
  } catch {
    primary = [];
  }
  const set = new Set(primary);
  for (const id of extraUserIds) {
    if (id) set.add(id);
  }
  workspaceHub.broadcastMany([...set], { type: "workspace_changed", projectId });
}

module.exports = { notifyProjectWorkspace };
