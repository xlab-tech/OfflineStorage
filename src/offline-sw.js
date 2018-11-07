/* eslint no-restricted-globals: 0, no-console:0 */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

const makeid = (len = 5) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < len; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const staticFiles = [
  new RegExp('.+leaflet.+(.css$|.js$)'),
  new RegExp('^.+arcgis((?!tile).)*$'),
  new RegExp('.+googleapis.com.+js.+'),
];
const resourcesFiles = [
  new RegExp('.+fonts.gstatic.com.+'),
  new RegExp('.+leaflet.+(.png$|.jpg$)'),
  new RegExp('.+gstatic.+(.png$|.jpg$|.cur$)'),
];

const layersFiles = [
  {
    name: 'osmLayer',
    reg: new RegExp('.+tile.osm.org.+.png$'),
    type: 'cache', // 'network
    maxFile: 30000,
    time: 30 * 24 * 60 * 60,
  },
  {
    name: 'googleLayers',
    reg: new RegExp('.+googleapis.com.+vt.+'),
  },
  {
    name: 'esriLayer',
    reg: new RegExp('.+arcgisonline.com.+tile.+'),
  },
];

const addStaticRoute = reg => workbox.routing.registerRoute(
  reg,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'static',
  }),
);

const addLayerRoute = (info) => {
  if (!info.reg) {
    return false;
  }
  const type = info.type || 'cache';
  const name = info.name || `layer-${makeid(5)}`;
  const maxEntries = info.maxFile || 30000;
  const maxAgeSeconds = info.time || 30 * 24 * 60 * 60;// 30 Days
  const strategy = type === 'cache' ? workbox.strategies.cacheFirst : workbox.strategies.networkFirst;

  return workbox.routing.registerRoute(
    info.reg,
    strategy({
      cacheName: name,
      plugins: [
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.Plugin({
          maxEntries,
          maxAgeSeconds,
        }),
      ],
    }),
  );
};

if (workbox) {
  console.log('RxMap Storage is loaded 🎉');
  staticFiles.forEach(reg => addStaticRoute(reg));
  resourcesFiles.forEach(reg => addStaticRoute(reg));
  layersFiles.forEach(reg => addLayerRoute(reg));
} else {
  console.log('Boo! RxMap Storage  didn\'t load 😬');
}

self.addEventListener('message', (event) => {
  console.log(`SW Received Message: ${event.data}`);
  let { data } = event;
  if (!Array.isArray(data)) {
    data = [data];
  }
  data.forEach((item) => {
    if (item.type === 'static') {
      return addStaticRoute(item.reg);
    }
    if (item.type === 'layer') {
      return addLayerRoute(item.layer);
    }
    return null;
  });
});
