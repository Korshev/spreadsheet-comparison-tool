importScripts("https://unpkg.com/xlsx/dist/xlsx.full.min.js");

self.addEventListener('message', function(e) {
    var message = e.data.name + ' to myself!';
    self.postMessage(message);
    self.close();
  })