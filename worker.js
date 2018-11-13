importScripts("https://unpkg.com/xlsx/dist/xlsx.full.min.js");

self.addEventListener('message', function (e) {
    var file = e.data;
    var message = 'Worker received: ' + file.name;

    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: 'binary' });

        var sheets = workbook.SheetNames;
        var sheet = workbook.Sheets[sheets[0]];
        var json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        self.postMessage(json);
        self.close();
    }
    reader.readAsBinaryString(file);

    // self.postMessage(message);
    // self.close();
})