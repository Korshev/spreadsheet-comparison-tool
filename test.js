// DEPRECATED

// handle file upload
async function handleFiles(files) {
    if (files.length !== 2) {
        alert("Please select 2 files to compare.");
        return;
    }
    console.log("start leftMap: " + performance.now());
    var leftMap = await read(files[0]);  //BIG
    console.log("leftMap finished" + performance.now());
    console.log("start rightMap" + performance.now());
    var rightMap = await read(files[1]);  //BIG
    console.log("rightMap finished" + performance.now());

    compare(leftMap, rightMap);
};

function read(file) {
    var reader = new FileReader();

    // https://blog.shovonhasan.com/using-promises-with-filereader/
    return new Promise((resolve, reject) => {
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Error parsing file!"));
        };

        reader.onload = (e) => {
            console.log("get data: " + performance.now());
            var data = new Uint8Array(e.target.result); //BIG
            console.log("got data: " + performance.now());
            console.log("get workbook: " + performance.now());
            var workbook = XLSX.read(data, { type: 'array' }); //BIG
            console.log("got workbook: " + performance.now());

            /* DO SOMETHING WITH workbook HERE */
            var sheets = workbook.SheetNames;
            var sheet = workbook.Sheets[sheets[0]]; //BIG
            console.log("get json: " + performance.now());
            var json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); //BIG
            console.log("got json: " + performance.now());
            // console.log(json);
            console.log("get map: " + performance.now());
            var map = getMap(json); //BIG
            console.log("got map: " + performance.now());
            resolve(map);
        };

        reader.readAsArrayBuffer(file);
    });
};

function handleHtml(files){
    console.log(files);
};

function compare(leftMap, rightMap) {
    console.log("start compare" + performance.now());

    leftMap.forEach(function (leftEntry, hash) {
        var row = leftEntry.row;
        var indexes = leftEntry.index;
        if (rightMap.has(hash)) {
            var rightEntry = rightMap.get(hash);

            if (leftEntry.index.length === rightEntry.index.length) {
                leftMap.delete(hash);
                rightMap.delete(hash);
            } else if (leftEntry.index.length > rightEntry.index.length) {
                leftEntry.index = leftEntry.index.slice(0, -rightEntry.index.length);
                rightMap.delete(hash);
            } else if (leftEntry.index.length < rightEntry.index.length) {
                rightEntry.index = rightEntry.index.slice(0, -leftEntry.index.length);
                leftMap.delete(hash);
            } else {
                return new DOMException("Run Screaming!");
            }
        }
    });

    console.log("compare finished" + performance.now());

    console.log(leftMap);
    console.log(rightMap);

    if (leftMap.size === 0 && rightMap.size === 0) {
        alert("The two files are equal");
    } else {
        alert("There are " + leftMap.size + " unmatchable rows in the first file and " + rightMap.size + " unmatchable rows in the second file");
        if (confirm("Attempt to match leftovers?")) {
            matchedPairs = sortLeftovers(leftMap, rightMap);
            var message = "";
            matchedPairs.forEach(function (item) {
                message += "\n Left Index: " + item.leftIndex + ", Right Index: " + item.rightIndex + ", Similarity Count: " + item.similarityCount;
            })
            alert("The following lines were matched together: " + message);
        }
    }
};

function sortLeftovers(leftMap, rightMap) {
    var matchedPairs = [];

    leftMap.forEach(function (leftEntry, hash) {
        var rightMatch = findBestMatch(leftEntry, rightMap);
        var leftMatch = findBestMatch(rightMatch.match, leftMap);
        console.log(rightMatch);
        console.log(leftMatch);
        console.log(leftEntry === leftMatch);

        if (leftEntry && leftMatch && leftEntry === leftMatch.match) {

            matchedPairs.push({
                leftIndex: leftMatch.match.index.pop(),
                rightIndex: rightMatch.match.index.pop(),
                similarityCount: leftMatch.similarityCount
            });

            if (leftMatch.match.index.length <= 0) {
                leftMap.delete(hash);
            }

            if (rightMatch.match.index.length <= 0) {
                rightMap.delete(hash);
            }
        }
    });

    return matchedPairs;
};
function findBestMatch(targetEntry, rightMap) {
    if (targetEntry === null) {
        return null;
    }
    var max = 0;
    var bestMatch = null;
    for (var hash of rightMap.keys()) {
        var rightEntry = rightMap.get(hash);
        var currentRow = rightEntry.row;
        var similarityCount = getSimilarity(targetEntry.row, currentRow);
        if (similarityCount > max) {
            max = similarityCount;
            bestMatch = rightEntry;
        }
    };
    console.log(targetEntry);
    console.log(bestMatch);
    console.log(max);
    return {
        match: bestMatch,
        similarityCount: max
    };
}

function getSimilarity(target, current) {
    var similarityCount = 0;
    for (var i = 0; i < target.length && i < current.length; ++i) {
        if (current[i] === target[i]) {
            ++similarityCount;
        }
    }
    return similarityCount;
};

function getMap(json) {
    var map = new Map();

    json.forEach(function (row, index) {
        var hash = hashRow(row);
        if (map.has(hash)) {
            map.get(hash).index.push(index);
        } else {
            map.set(hash, { row: row, index: [index] });
        }
    });

    return map;
};

function hashRow(array) {
    return hashString(array.toString());
};

// hash algorithm
function hashString(row) {
    row = row.trim();
    var hash = 0, i, char;
    if (row.length === 0) return hash;
    for (i = 0; i < row.length; ++i) {
        char = row.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};