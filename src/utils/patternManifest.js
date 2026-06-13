// Normalize manifest entries for Redux / UI
import bundledManifest from '../../pattern-manifest/manifest.json';
import { rawFileUrl } from '../constants/patternRepo';

const slugToName = (slug) =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const slugToId = (slug) => `z_${slug.replace(/[^a-zA-Z0-9]/g, '_')}`;

export const normalizePattern = (raw, index = 0) => {
  const slug = raw.slug || raw.file?.replace(/\.thr$/, '') || raw.id;
  return {
    id: raw.id || slugToId(slug),
    slug,
    name: raw.name || slugToName(slug),
    category: raw.category || (index < 12 ? 'featured' : 'all'),
    file: raw.file || `${slug}.thr`,
    previewSvg: raw.previewSvg || `previews/${slug}.svg`,
    machinePath: raw.machinePath || `patterns/${slug}.thr`,
    fileSize: raw.fileSize || 0,
    duration: raw.duration || 0,
    difficulty: raw.difficulty || 'smooth',
    description: raw.description || '',
    isNew: !!raw.isNew,
    isRemote: true,
    previewUrl: rawFileUrl(raw.previewSvg || `previews/${slug}.svg`),
    machineUrl: rawFileUrl(raw.machinePath || `patterns/${slug}.thr`),
  };
};

export const patternsFromManifest = (manifest) =>
  (manifest?.patterns || []).map((p, i) => normalizePattern(p, i));

export const BUNDLED_PATTERNS = patternsFromManifest(bundledManifest);

export const BUNDLED_META = {
  version: bundledManifest.version,
  updatedAt: bundledManifest.updatedAt,
  total: bundledManifest.total || BUNDLED_PATTERNS.length,
};

export default BUNDLED_PATTERNS;
