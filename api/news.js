// GET /api/news
// → { videos[], posts[], warnings[] }
//
// Dua sumber digabung karena keduanya "berita BMKG" dan sama-sama rapuh:
//   video  → cuaca.bmkg.go.id/api/public/weather/video-latest
//   artikel→ cuaca.bmkg.go.id/blog/wp-json/wp/v2/posts  (WordPress, sering 502)
// Salah satu gagal tidak menggagalkan semuanya: isi `warnings[]` supaya
// pemanggil tahu ada bagian yang kosong dan kenapa. TIDAK ada artikel contoh.
import { defineEndpoint } from '../lib/endpoint.js';
import { normalizeVideos, normalizeWpPosts } from '../lib/normalize.js';
import { bmkgFetch } from '../lib/upstream.js';

export const config = { runtime: 'nodejs' };

export default defineEndpoint({
  async run() {
    const warnings = [];

    const videos = await (async () => {
      try {
        const up = await bmkgFetch('api/public/weather/video-latest', { hashtag: 'infobmkgpws' });
        if (!up.ok) throw new Error(`HTTP ${up.status}`);
        return normalizeVideos(JSON.parse(up.body)).videos;
      } catch (e) {
        warnings.push(`video: ${String(e.message ?? e).slice(0, 80)}`);
        return [];
      }
    })();

    const posts = await (async () => {
      try {
        const up = await bmkgFetch('blog/wp-json/wp/v2/posts', { per_page: 5, _embed: 1 });
        if (!up.ok) throw new Error(`HTTP ${up.status}`);
        return normalizeWpPosts(JSON.parse(up.body)).posts;
      } catch (e) {
        warnings.push(`artikel: ${String(e.message ?? e).slice(0, 80)}`);
        return [];
      }
    })();

    if (!videos.length && !posts.length) {
      const e = new Error('Sumber berita BMKG tidak tersedia');
      e.status = 502;
      e.code = 'UPSTREAM_ERROR';
      e.reason = warnings.join('; ');
      throw e;
    }
    return { videos, posts, warnings };
  },
});
