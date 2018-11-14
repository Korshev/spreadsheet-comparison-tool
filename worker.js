/**
 * this xlsx lib uses a lot of memory so isolating it in it's own worker lets us reclaim 
 * memory faster and load the files in 'parallel'
 */

importScripts("https://unpkg.com/xlsx/dist/xlsx.full.min.js");

self.addEventListener('message', function (e) {
    var file = e.data;

    var reader = new FileReader();
    reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: 'array' });

        var sheets = workbook.SheetNames;
        var sheet = workbook.Sheets[sheets[0]];
        var json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        self.postMessage(json);
        self.close();
    }
    reader.readAsArrayBuffer(file);
})