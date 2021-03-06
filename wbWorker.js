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

        var wb = [];
        var sheetNames = workbook.SheetNames;
        for (var index in sheetNames){
            var sheet = workbook.Sheets[sheetNames[index]];
            var aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            wb.push(aoa);
        }

        self.postMessage({wb, sheetNames});
        self.close();
    }
    reader.readAsArrayBuffer(file);
})