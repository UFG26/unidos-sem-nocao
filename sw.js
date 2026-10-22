const CACHE_FAMILY='unidos-fight-game-';
const CACHE_BUILD='ufg26-fix-20261022-1';
const SHELL_CACHE=CACHE_FAMILY+CACHE_BUILD+'-shell';
const ASSET_CACHE=CACHE_FAMILY+CACHE_BUILD+'-assets';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL_CACHE);
 await cache.addAll(['./index.html','./manifest.webmanifest','./app-icon-192.png','./app-icon-512.png']);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(n=>n.startsWith(CACHE_FAMILY)&&n!==SHELL_CACHE&&n!==ASSET_CACHE).map(n=>caches.delete(n)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 // Never cache partial media responses (206); Cache.put rejects them.
 if(request.headers.has('range'))return;
 if(url.pathname.includes('/assets/')){
  event.respondWith((async()=>{
   const cache=await caches.open(ASSET_CACHE),hit=await cache.match(request);
   if(hit)return hit;
   const response=await fetch(request);
   // Storage quota errors must never turn a successful resource into a 503.
   if(response.status===200){const copy=response.clone();event.waitUntil(cache.put(request,copy).catch(()=>{}));}
   return response;
  })());return;
 }
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(request);if(response.ok){const copy=response.clone();event.waitUntil(caches.open(SHELL_CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{}));}return response;}
   catch(error){return await caches.match('./index.html')||new Response('Abra o jogo conectado para preparar o modo offline.',{status:503});}
  })());
 }
});
