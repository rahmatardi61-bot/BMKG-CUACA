// GET /v3/api-docs → spesifikasi OpenAPI 3.0 (bentuk URL meniru springdoc)
//
// TANPA auth, disengaja: dokumentasi harus bisa dibaca sebelum punya token.
// Yang ada di sini hanya bentuk respons — tidak ada data cuaca, tidak ada
// rahasia. Endpoint aslinya tetap di balik token.
import { buildOpenApi } from '../../lib/openapi.js';

export const config = { runtime: 'nodejs' };

export default {
  fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
      });
    }
    // origin dipakai sebagai server pertama, supaya "Try it out" di Swagger
    // menembak ke host tempat dokumen ini dibuka, bukan host tebakan.
    const origin = new URL(req.url).origin;
    return new Response(JSON.stringify(buildOpenApi(origin), null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  },
};
