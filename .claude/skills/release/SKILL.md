---
name: release
description: Use when preparing a Bloomsweeper release or hotfix for GitHub Pages.
---

# Release checklist

1. All unit tests, the validator on all pages and the Playwright suite are green in CI.
2. Bump `VERSION` and the service-worker cache name together; add any new files to the cache list.
3. "What's new" only for minor versions, never for hotfixes.
4. Update `docs/DECISIONS.md` if the release carries a decision.
5. In the PR, list the device checks for Kondrat (iPhone and iPad) from
   `docs/qa/device-checklist.md` that this release touches.
6. After merge, open the live Pages URL, check the version label and that offline reload works.
