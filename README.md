# Shortcut PR Title Action

Update your PR's title to the linked Shortcut story's title and add a link to the story in the PR's body.

To trigger the update, set your PRs title to `sc`.

## Inputs

### `shortcutToken`

_Required._ Shortcut API auth token.

### `ghToken`

_Required._ GitHub API auth token.

## Example usage

```yaml
uses: perdoo/shortcut-pr-title-action@v2.0.0
with:
  shortcutToken: ${{ secrets.SHORTCUT_TOKEN }}
  ghToken: ${{ secrets.GITHUB_TOKEN }}
```
