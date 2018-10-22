// handle file upload
async function handleFiles(files) {
    if (files.length !== 2) {
        alert("Please select 2 files to compare.");
        return;
    }

    var leftMap = await read(files[0]);  //BIG
    var rightMap = await read(files[1]);  //BIG

    compare(leftMap,rightMap);

    // console.log(leftMap);
    // console.log(rightMap);

    // alert(files[0].name);
    // alert(files[1].name);
};

function read(file) {
    var reader = new FileReader();

    // https://blog.shovonhasan.com/using-promises-with-filereader/
    return new Promise((resolve,reject) => {
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Error parsing file!"));
        };
        
        reader.onload = (e) => {
            var data = new Uint8Array(e.target.result); //BIG
            var workbook = XLSX.read(data, { type: 'array' }); //BIG
    
            /* DO SOMETHING WITH workbook HERE */
            var sheets = workbook.SheetNames;
            var sheet = workbook.Sheets[sheets[0]]; //BIG
            var json = XLSX.utils.sheet_to_json(sheet, {header:1}); //BIG
            // console.log(json);
            var map = getMap(json); //BIG
            resolve(map);
        };
        
        reader.readAsArrayBuffer(file);
    });
};

function compare(leftMap,rightMap){
    leftMap.forEach(function (leftEntry, hash){
        var row = leftEntry.row;
        var indexes = leftEntry.index;
        if (rightMap.has(hash)){
            var rightEntry = rightMap.get(hash);

            if (leftEntry.index.length === rightEntry.index.length){
                leftMap.delete(hash);
                rightMap.delete(hash);
            } else if (leftEntry.index.length > rightEntry.index.length) {
                leftEntry.index = leftEntry.index.slice(0,-rightEntry.index.length);
                rightMap.delete(hash);
            } else if (leftEntry.index.length < rightEntry.index.length) {
                rightEntry.index = rightEntry.index.slice(0,-leftEntry.index.length);
                leftMap.delete(hash);
            } else {
                return new DOMException("Run Screaming!");
            }
        }
    });

    console.log(leftMap);
    console.log(rightMap);

    if (leftMap.size === 0 && rightMap.size === 0){
        alert("The two files are equal");
    } else {

        alert("There are " + leftMap.size + " unmatchable rows in the first file and " + rightMap.size + " unmatchable rows in the second file");
    }
};

function getMap(json){
    var map = new Map();

    json.forEach(function(row, index) {
        var hash = hashRow(row);
        if (map.has(hash)){
            map.get(hash).index.push(index);
        } else {
            map.set(hash, {row:row,index:[index]});
        }
    });
    
    return map;
};

function hashRow(array){
    return hashString(array.toString());
};

// hash algorithm
function hashString(row) {
    var hash = 0, i, char;
    if (row.length === 0) return hash;
    for (i = 0; i < row.length; ++i) {
        char = row.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};