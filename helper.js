/**
 * this file prepares input by converting it into arrays of arrays prior to calling the 
 * actual comparison algorithm
 */

async function compareFiles(leftFile, rightFile) {
    clear();
    write("sending " + leftFile.name + " and " + rightFile.name + " to web workers");
    //https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
    [leftAOA, rightAOA] = await Promise.all([getAOAFromFile(leftFile), getAOAFromFile(rightFile)]);
    compareAOAs(leftFile.name, leftAOA, rightFile.name, rightAOA);
}

function compareText(leftText, rightText) {
    var leftAOA = getAOAFromRawText(leftText);
    var rightAOA = getAOAFromRawText(rightText);
    compareAOAs('left-text.xlsx', leftAOA, 'right-text.xlsx', rightAOA);
}

function compareAOAs(leftName, leftAOA, rightName, rightAOA) {
    var diffs = compare(leftAOA, rightAOA);
    downloadDiff(diffs.leftAOA, leftName);
    downloadDiff(diffs.rightAOA, rightName);
}

function downloadDiff(aoa, name) {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, "diff --- " + name); // triggers download
}

function getAOAFromFile(file) {
    //https://stackoverflow.com/questions/41423905/wait-for-several-web-workers-to-finish
    return new Promise((resolve, reject) => {
        var worker = new Worker('worker.js');
        worker.addEventListener('message', function (e) {
            write(file.name + " returned from web worker")
            resolve(e.data);
        });
        worker.postMessage(file);
    });
};

function getAOAFromRawText(rawText) {
    var array = [];
    for (var line of rawText.split('\n')) {
        array.push([line]);
    }
    return array;
}