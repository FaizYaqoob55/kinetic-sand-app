// Remote patterns repo — Zanvora Sand (GitHub)
export const PATTERN_REPO = {
  owner: 'FaizYaqoob55',
  repo: 'patterns-zanvora-sand',
  branch: 'main',
  baseUrl: 'https://raw.githubusercontent.com/FaizYaqoob55/patterns-zanvora-sand/main',
  apiUrl: 'https://api.github.com/repos/FaizYaqoob55/patterns-zanvora-sand',
  patternsDir: 'patterns',
  previewsDir: 'previews',
  manifestPath: 'manifest.json',
  /** Re-check manifest if older than this (ms) */
  syncIntervalMs: 24 * 60 * 60 * 1000,
};

export const manifestUrl = () =>
  `${PATTERN_REPO.baseUrl}/${PATTERN_REPO.manifestPath}`;

export const rawFileUrl = (relativePath) =>
  `${PATTERN_REPO.baseUrl}/${relativePath}`;

export default PATTERN_REPO;
