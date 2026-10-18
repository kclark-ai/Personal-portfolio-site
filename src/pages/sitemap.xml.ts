import { getCollection } from 'astro:content';
export async function GET() {
 const entries = [...(await getCollection('projects')).map(e => `/projects/${e.id}`), ...(await getCollection('writing')).map(e => `/writing/${e.id}`)];
 const urls = ['/', ...entries, ...(await getCollection('work')).map(e=>`/work/${e.id}/`)];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(p => `<url><loc>https://kevinclark.ai${p}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
}
