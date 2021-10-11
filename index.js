const core = require("@actions/core");
const github = require("@actions/github");
const { ShortcutClient } = require("@useshortcut/client");

const PR_TITLE_UPDATE_KEYWORD = "sc";

function getShortcutStoryIdFromPullRequest(pullRequest) {
  const branchName = pullRequest.head.ref;
  const branchStoryId = branchName.match(/^sc-(\d+)\/|\/sc-(\d+)\//);

  if (branchStoryId) {
    return branchStoryId[1] ? branchStoryId[1] : branchStoryId[2];
  }

  const body = pullRequest.body != null ? pullRequest.body : "";
  const bodyStoryId = body.match(/\[sc-(\d+)\]/);

  return bodyStoryId ? bodyStoryId[1] : null;
}

async function getShortcutStory(shortcutClient, storyId) {
  return shortcutClient
    .getStory(storyId)
    .then((response) => (response ? response.data : null));
}

async function getShortcutEpic(shortcutClient, epicId) {
  return shortcutClient
    .getEpic(epicId)
    .then((response) => (response ? response.data : null));
}

async function getTitle(shortcutClient, shortcutStoryId) {
  const story = await getShortcutStory(shortcutClient, shortcutStoryId);
  const epic = story.epic_id
    ? await getShortcutEpic(shortcutClient, story.epic_id)
    : null;

  return epic ? `${epic.name} | ${story.name}` : story.name;
}

async function updatePrTitle(shortcutClient, octokit, pullRequest) {
  const storyId = getShortcutStoryIdFromPullRequest(pullRequest);

  if (!storyId) {
    core.info(`PR isn't linked to a Shortcut story.`);
    return;
  }

  await octokit.rest.pulls.update({
    repo: pullRequest.head.repo.name,
    owner: pullRequest.head.repo.owner.login,
    pull_number: pullRequest.number,
    title: await getTitle(shortcutClient, storyId),
  });
}

async function run() {
  try {
    const shortcutToken = core.getInput("shortcutToken");
    const ghToken = core.getInput("ghToken");
    const shortcutClient = new ShortcutClient(shortcutToken);
    const octokit = github.getOctokit(ghToken);
    const { number: prNumber, repository } = github.context.payload;
    const { data: pullRequest } = await octokit.rest.pulls.get({
      repo: repository.name,
      owner: repository.owner.login,
      pull_number: prNumber,
    });

    core.setSecret("shortcutToken");
    core.setSecret("ghToken");

    if (pullRequest.title !== PR_TITLE_UPDATE_KEYWORD) {
      core.info(
        `PR title isn't set to keyword '${PR_TITLE_UPDATE_KEYWORD}'. Skipping update.`
      );
      return;
    }

    await updatePrTitle(shortcutClient, octokit, pullRequest);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (process.env.GITHUB_ACTIONS) {
  run();
}

exports.getShortcutStoryIdFromPullRequest = getShortcutStoryIdFromPullRequest;
