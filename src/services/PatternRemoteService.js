// src/services/PatternRemoteService.js
// Sync patterns from patterns-zanvora-sand GitHub repo
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import PATTERN_REPO, { manifestUrl, rawFileUrl } from '../constants/patternRepo';
import bundledManifest from '../../pattern-manifest/manifest.json';
import { normalizePattern } from '../utils/patternManifest';
import Storage, { STORAGE_KEYS } from '../utils/storage';
import FluidNCService from './FluidNCService';

const CACHE_KEY = 'patternManifestCache';
const SYNC_KEY = 'patternLastSyncAt';
const KNOWN_IDS_KEY = 'patternKnownIds';

const CACHE_DIR = `${FileSystem.documentDirectory}patterns/`;
const SVG_DIR = `${CACHE_DIR}svg/`;
const THR_DIR = `${CACHE_DIR}thr/`;

const slugToId = (slug) => `z_${slug.replace(/[^a-zA-Z0-9]/g, '_')}`;

class PatternRemoteService {
  constructor() {
    this.syncing = false;
    this.previewInflight = new Map();
  }

  async ensureDirs() {
    if (!FileSystem.documentDirectory) return;
    try {
      for (const dir of [CACHE_DIR, SVG_DIR, THR_DIR]) {
        const info = await FileSystem.getInfoAsync(dir);
        if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    } catch {
      // Web or restricted env — previews still work via remote URL
    }
  }

  normalizeEntry(raw, index = 0) {
    return normalizePattern(raw, index);
  }

  async bootstrapFromGitHub() {
    const [thrRes, svgRes] = await Promise.all([
      axios.get(`${PATTERN_REPO.apiUrl}/contents/${PATTERN_REPO.patternsDir}?ref=${PATTERN_REPO.branch}`, { timeout: 60000 }),
      axios.get(`${PATTERN_REPO.apiUrl}/contents/${PATTERN_REPO.previewsDir}?ref=${PATTERN_REPO.branch}`, { timeout: 60000 }),
    ]);

    const svgSlugs = new Set(
      svgRes.data.filter((f) => f.name?.endsWith('.svg')).map((f) => f.name.replace(/\.svg$/, '')),
    );

    const patterns = thrRes.data
      .filter((f) => f.name?.endsWith('.thr') && svgSlugs.has(f.name.replace(/\.thr$/, '')))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f, i) => {
        const slug = f.name.replace(/\.thr$/, '');
        return this.normalizeEntry({
          id: slugToId(slug),
          slug,
          file: f.name,
          previewSvg: `previews/${slug}.svg`,
          machinePath: `patterns/${f.name}`,
          fileSize: f.size,
          category: i < 12 ? 'featured' : 'all',
        }, i);
      });

    return {
      version: 'bootstrap',
      updatedAt: new Date().toISOString(),
      baseUrl: PATTERN_REPO.baseUrl,
      total: patterns.length,
      patterns,
    };
  }

  async fetchManifest() {
    try {
      const res = await axios.get(manifestUrl(), { timeout: 30000 });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 404) {
        if (bundledManifest?.patterns?.length) {
          console.warn('[Patterns] remote manifest missing — using bundled manifest');
          return bundledManifest;
        }
        console.warn('[Patterns] manifest.json not found — bootstrapping from GitHub API');
        return this.bootstrapFromGitHub();
      }
      throw err;
    }
  }

  async shouldSync() {
    const last = await Storage.get(SYNC_KEY, 0);
    return Date.now() - last > PATTERN_REPO.syncIntervalMs;
  }

  async sync({ force = false } = {}) {
    if (this.syncing) {
      const cached = await Storage.get(CACHE_KEY, null);
      return cached?.patterns?.length ? cached : null;
    }

    if (!force && !(await this.shouldSync())) {
      const cached = await Storage.get(CACHE_KEY, null);
      if (cached?.patterns?.length) return cached;
    }

    this.syncing = true;
    try {
      await this.ensureDirs();
      const remote = await this.fetchManifest();
      const knownIds = await Storage.get(KNOWN_IDS_KEY, []);
      const knownSet = new Set(knownIds);

      const patterns = (remote.patterns || []).map((p, i) => {
        const entry = this.normalizeEntry(p, i);
        entry.isNew = knownIds.length > 0 && !knownSet.has(entry.id);
        return entry;
      });

      const newCount = patterns.filter((p) => p.isNew).length;
      const payload = {
        version: remote.version,
        updatedAt: remote.updatedAt,
        total: patterns.length,
        patterns,
        newCount,
      };

      await Storage.set(CACHE_KEY, payload);
      await Storage.set(SYNC_KEY, Date.now());
      await Storage.set(KNOWN_IDS_KEY, patterns.map((p) => p.id));

      return payload;
    } finally {
      this.syncing = false;
    }
  }

  async getCachedManifest() {
    return Storage.get(CACHE_KEY, null);
  }

  async getPreviewUri(pattern) {
    if (!pattern?.slug) return null;
    const url = pattern.previewUrl || rawFileUrl(pattern.previewSvg);

    // Web: use remote SVG URL directly (no local cache)
    if (typeof window !== 'undefined' && (!FileSystem.documentDirectory || typeof FileSystem.downloadAsync !== 'function')) {
      return url;
    }

    await this.ensureDirs();
    const localPath = `${SVG_DIR}${pattern.slug}.svg`;
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) return localPath;
    } catch {
      return url;
    }

    const key = pattern.slug;
    if (this.previewInflight.has(key)) return this.previewInflight.get(key);

    const task = (async () => {
      try {
        const result = await FileSystem.downloadAsync(url, localPath);
        return result.uri;
      } catch {
        return url;
      } finally {
        this.previewInflight.delete(key);
      }
    })();

    this.previewInflight.set(key, task);
    return task;
  }

  async isOnSD(filename) {
    try {
      const files = await FluidNCService.getFileList();
      const names = Array.isArray(files)
        ? files.map((f) => (typeof f === 'string' ? f : f.name || f.path || ''))
        : [];
      const target = filename.replace(/^\//, '');
      return names.some((n) => n === target || n.endsWith(`/${target}`) || n.endsWith(target));
    } catch {
      return false;
    }
  }

  async downloadThr(pattern) {
    await this.ensureDirs();
    const localPath = `${THR_DIR}${pattern.file}`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;

    const url = pattern.machineUrl || rawFileUrl(pattern.machinePath);
    const result = await FileSystem.downloadAsync(url, localPath);
    return result.uri;
  }

  async ensureOnTable(pattern) {
    const onSd = await this.isOnSD(pattern.file);
    if (onSd) return pattern.file;

    const localUri = await this.downloadThr(pattern);
    await FluidNCService.uploadPatternFromUri(pattern.file, localUri);
    return pattern.file;
  }

  async playPattern(pattern, { speed, onPlaying, onError } = {}) {
    const filename = await this.ensureOnTable(pattern);
    if (speed != null) await FluidNCService.setSpeed(speed);
    await FluidNCService.runPattern(filename);
    if (onPlaying) onPlaying(pattern);
    return filename;
  }
}

export default new PatternRemoteService();
