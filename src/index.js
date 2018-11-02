
const data = [];
let load = false;
let sw;

const addData = (info) => {
  if (!load) {
    data.push(info);
  } else {
    sw.active.postMessage(info);
  }
};

export const addStatic = reg => (addData({ type: 'static', reg }));
export const addLayer = reg => (addData({ type: 'static', reg }));
export const start = () => {
  if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('https://unpkg.com/@rxmap/offlinestorage@0.3.0/dist/esm/sw-offline.js').then((reg) => {
        data.forEach(item => reg.active.postMessage(item));
        sw = reg;
        load = true;
      });
    });
  }
};
