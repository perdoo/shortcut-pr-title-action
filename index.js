const core = require("@actions/core");
const github = require("@actions/github");
const { ShortcutClient } = require("@useshortcut/client");

const PR_TITLE_UPDATE_KEYWORD = "sc";

function getShortcutStoryIdsFromPullRequest(pullRequest) {
  const storyIds = [];
  const branchName = pullRequest.head.ref;
  const branchStoryId = branchName.match(/^sc-(\d+)\/|\/sc-(\d+)\//);

  if (branchStoryId) {
    storyIds.push(branchStoryId[1] ? branchStoryId[1] : branchStoryId[2]);
  }

  const body = pullRequest.body != null ? pullRequest.body : "";
  const bodyRegex = /\[sc-(\d+)\]/g;
  let match = bodyRegex.exec(body);

  while (match != null) {
    storyIds.push(match[1]);
    match = bodyRegex.exec(body);
  }

  return storyIds;
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

async function getBody(shortcutClient, pullRequest, shortcutStoryIds) {
  let body = pullRequest.body;
  let previousStoryUrl = null;

  for (const storyId of shortcutStoryIds) {
    const { app_url: appUrl, name } = await getShortcutStory(
      shortcutClient,
      storyId
    );

    if (!body.includes(appUrl)) {
      const markdownUrl = `Shortcut: [${name}](${appUrl})`;

      if (previousStoryUrl) {
        body = body.replace(
          `](${previousStoryUrl})`,
          `](${previousStoryUrl})\n${markdownUrl}`
        );
      } else {
        body = `${markdownUrl}\n${body}`;
      }
    }

    previousStoryUrl = appUrl;
  }

  if (pullRequest.body == body) {
    core.info("No changes were made to the PR's body.");
  }

  return body;
}

async function updatePrTitleAndBody(shortcutClient, octokit, pullRequest) {
  const shortcutStoryIds = getShortcutStoryIdsFromPullRequest(pullRequest);

  if (!shortcutStoryIds.length) {
    core.info("PR isn't linked to any Shortcut story.");
    return;
  } else {
    core.info(`PR linked to Shortcut stories ${shortcutStoryIds.join(", ")}.`);
  }

  const data = {
    repo: pullRequest.head.repo.name,
    owner: pullRequest.head.repo.owner.login,
    pull_number: pullRequest.number,
    body: await getBody(shortcutClient, pullRequest, shortcutStoryIds),
  };

  if (pullRequest.title == PR_TITLE_UPDATE_KEYWORD) {
    data.title = await getTitle(shortcutClient, shortcutStoryIds[0]);
  } else {
    core.info(
      `PR title isn't set to keyword '${PR_TITLE_UPDATE_KEYWORD}'. Skipping title update.`
    );
  }

  await octokit.rest.pulls.update(data);
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

    await updatePrTitleAndBody(shortcutClient, octokit, pullRequest);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (process.env.GITHUB_ACTIONS) {
  run();
}

exports.getShortcutStoryIdsFromPullRequest = getShortcutStoryIdsFromPullRequest;
