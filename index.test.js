const index = require("./index");

test("extracts Shortcut story ID from the PR's branch name when formatted as [story_id]/[name]", () => {
  const pullRequest = {
    head: {
      ref: "sc-123/foo",
    },
  };

  expect(index.getShortcutStoryIdFromPullRequest(pullRequest)).toEqual("123");
});

test("extracts Shortcut story ID from the PR's branch name when formatted as [name]/[story_id]/[name2]", () => {
  const pullRequest = {
    head: {
      ref: "foo/sc-123/bar",
    },
  };

  expect(index.getShortcutStoryIdFromPullRequest(pullRequest)).toEqual("123");
});

test("extracts Shortcut story ID from the PR's body", () => {
  const pullRequest = {
    head: {
      ref: "foo",
    },
    body: "Lorem ipsum\ndolor sit [sc-123], consectetur adipiscing elit.",
  };

  expect(index.getShortcutStoryIdFromPullRequest(pullRequest)).toEqual("123");
});

test("returns null if the PR's branch name and body don't contain a Shortcut story ID", () => {
  const pullRequest = {
    head: {
      ref: "foo",
    },
    body: "Lorem ipsum\ndolor sit, consectetur adipiscing elit.",
  };

  expect(index.getShortcutStoryIdFromPullRequest(pullRequest)).toEqual(null);
});
