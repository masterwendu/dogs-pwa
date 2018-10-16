const ASSETS_CACHE_NAME = 'dog-pwa-assets-9'
const DOGS_CACHE_NAME = 'dog-pwa-dog-urls-3'
const DOGS_IMAGES_CACHE_NAME = 'dog-pwa-dog-images-3'

const urlsToCache = [
  'index.html',
  'js/index.js',
  'js/toastr.min.js',
  'js/jquery-3.3.1.min.js',
  'css/main.css',
  'css/toastr.min.css',
  'css/main.css',
  'images/icons/icon-48x48.png',
  'images/icons/icon-72x72.png',
  'images/icons/icon-96x96.png',
  'images/icons/icon-128x128.png',
  'images/icons/icon-144x144.png',
  'images/icons/icon-152x152.png',
  'images/icons/icon-192x192.png',
  'images/icons/icon-512x512.png',
  'images/favicon.ico',
  'manifest.json',
]

const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const postMessageToAll = async (message) => {
  const clients = await self.clients.matchAll()
  await Promise.all(clients.map(async (client) => {
    await client.postMessage(message)
  }))
}

const saveDogToCache = async (cache, number, dog) => {
  await cache.put(`https://dog.ceo/api/breeds/image/random/${number}`, dog.clone())
  const dogImageSrc = await dog.json()
  const cacheImages = await caches.open(DOGS_IMAGES_CACHE_NAME)
  await cacheImages.put(dogImageSrc.message, await fetch(dogImageSrc.message, { mode: 'no-cors' }))
}

const runInitialCache = async () => {
  try {
    const cache = await caches.open(ASSETS_CACHE_NAME)

    const dogsCache = await caches.open(DOGS_CACHE_NAME)

    // load 5 random dog images for offline usage
    const getSomeDogs = Array.apply(null, Array(5)).map(async (_, key) => {
      return saveDogToCache(dogsCache, key, await fetch('https://dog.ceo/api/breeds/image/random'))
    })

    await Promise.all([
      cache.addAll(urlsToCache),
      ...getSomeDogs,
    ])
  } catch (error) {
    console.error('Service worker install error', error)
  }
}

const getDogFromNetwork = async (request, cache, number) => {
  try {
    const dogRepsonse = await fetch(request)
    if (dogRepsonse.ok) {
      await saveDogToCache(cache, number, dogRepsonse.clone())
      return postMessageToAll(await dogRepsonse.json())
    }
  } catch (error) {
    console.log('error bei getDogFromNetwork')
  }
  return postMessageToAll('offline')
}

const fetchHandler = async (event) => {
  try {
    const request = event.request

    if (request && request.url === 'https://dog.ceo/api/breeds/image/random') {
      const cache = await caches.open(DOGS_CACHE_NAME)
      const matches = await cache.keys()

      // if there are already dogs in the cache
      if (matches.length > 0) {
        const randomCacheKey = matches[getRandom(0, matches.length)]
        const cachedResponse = await caches.match(randomCacheKey)
        const cachedData = await cachedResponse.json()

        event.waitUntil(getDogFromNetwork(request, cache, matches.length))
        return new Response(JSON.stringify({
          ...cachedData,
          cached: true,
        }))
      } else {
        const dogRepsonse = await fetch(request)
        if (dogRepsonse.ok) {
          event.waitUntil(saveDogToCache(cache, 0, dogRepsonse.clone()))
        }
        return dogRepsonse
      }
    } else {
      const response = await caches.match(request)
      if (response) {
        return response
      }
    
      return fetch(request)
    }    
  } catch (error) {
    console.error('Service worker fetch error', event.request, error)
  }  
}

const activateServiceWorker = async () => {
  // claim all clients when service worker is isntalled
  const claim = self.clients.claim();

  // delete all old unused caches
  const cacheNames = await caches.keys()
  return Promise.all([
    claim,
    ...cacheNames.map((cacheName) => {
      if (![ASSETS_CACHE_NAME, DOGS_CACHE_NAME, DOGS_IMAGES_CACHE_NAME].includes(cacheName)) {
        return caches.delete(cacheName)
      }
    }),
  ])
}


self.addEventListener('install', (event) => {
  event.waitUntil(runInitialCache())
})
self.addEventListener('fetch', (event) => {
  event.respondWith(fetchHandler(event))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(activateServiceWorker())
})