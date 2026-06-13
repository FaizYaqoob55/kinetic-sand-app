#!/usr/bin/env node
/**
 * Build manifest.json from local patterns-zanvora-sand clone (or GitHub API fallback).
 *
 * Setup clone first:
 *   npm run patterns:clone
 *
 * Generate manifest:
 *   npm run patterns:manifest
 *
 * Then push manifest.json from patterns-zanvora-sand/ to GitHub.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCAL_REPO = path.join(ROOT, 'patterns-zanvora-sand');
const OUT_APP = path.join(ROOT, 'pattern-manifest', 'manifest.json');
const OUT_REPO = path.join(LOCAL_REPO, 'manifest.json');

const API = 'https://api.github.com/repos/FaizYaqoob55/patterns-zanvora-sand/contents';
const BASE = 'https://raw.githubusercontent.com/FaizYaqoob55/patterns-zanvora-sand/main';

const slugToName = (slug) =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const slugToId = (slug) => `z_${slug.replace(/[^a-zA-Z0-9]/g, '_')}`;

function listLocalDir(dir) {
  return fs.readdirSync(dir).map((name) => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    return { name, size: stat.size, type: stat.isDirectory() ? 'dir' : 'file' };
  });
}

async function listRemoteDir(folder) {
  const res = await fetch(`${API}/${folder}?ref=main`);
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${folder}`);
  return res.json();
}

function buildManifest(thrFiles, svgFiles) {
  const svgSet = new Set(
    svgFiles.filter((f) => f.type === 'file' && f.name.endsWith('.svg'))
      .map((f) => f.name.replace(/\.svg$/, '')),
  );

  const patterns = [];
  const missingSvg = [];

  thrFiles
    .filter((f) => f.type === 'file' && f.name.endsWith('.thr'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((f, index) => {
      const slug = f.name.replace(/\.thr$/, '');
      if (!svgSet.has(slug)) {
        missingSvg.push(slug);
        return;
      }
      patterns.push({
        id: slugToId(slug),
        slug,
        name: slugToName(slug),
        category: index < 12 ? 'featured' : 'all',
        file: f.name,
        previewSvg: `previews/${slug}.svg`,
        machinePath: `patterns/${f.name}`,
        fileSize: f.size,
        duration: 0,
        difficulty: 'smooth',
        description: '',
        isNew: false,
      });
    });

  return {
    manifest: {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      baseUrl: BASE,
      total: patterns.length,
      patterns,
    },
    missingSvg,
  };
}

async function loadFromLocal() {
  const thrDir = path.join(LOCAL_REPO, 'patterns');
  const svgDir = path.join(LOCAL_REPO, 'previews');
  if (!fs.existsSync(thrDir) || !fs.existsSync(svgDir)) return null;

  console.log('Reading local clone:', LOCAL_REPO);
  return buildManifest(listLocalDir(thrDir), listLocalDir(svgDir));
}

async function loadFromGitHub() {
  console.log('Local clone not found — fetching from GitHub API...');
  const [thrFiles, svgFiles] = await Promise.all([
    listRemoteDir('patterns'),
    listRemoteDir('previews'),
  ]);
  return buildManifest(thrFiles, svgFiles);
}

async function main() {
  const result = (await loadFromLocal()) || (await loadFromGitHub());
  const { manifest, missingSvg } = result;

  fs.mkdirSync(path.dirname(OUT_APP), { recursive: true });
  fs.writeFileSync(OUT_APP, JSON.stringify(manifest, null, 2));
  console.log(`✅ pattern-manifest/manifest.json → ${manifest.total} patterns`);

  if (fs.existsSync(LOCAL_REPO)) {
    fs.writeFileSync(OUT_REPO, JSON.stringify(manifest, null, 2));
    console.log(`✅ patterns-zanvora-sand/manifest.json → written`);
    console.log('\nPush to GitHub:');
    console.log('  cd patterns-zanvora-sand');
    console.log('  git add manifest.json');
    console.log('  git commit -m "Add pattern manifest"');
    console.log('  git push');
  }

  if (missingSvg.length) {
    console.warn(`⚠️  ${missingSvg.length} .thr files missing matching .svg (skipped)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
