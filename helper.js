/**
 * this file prepares input by converting it into arrays of arrays prior to calling the 
 * actual comparison algorithm
 */

async function compareFiles(leftFile, rightFile, ignoredColumns) {
    clear();
    write("sending " + leftFile.name + " and " + rightFile.name + " to web workers");
    //https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
    [leftAOA, rightAOA] = await Promise.all([getAOAFromFile(leftFile), getAOAFromFile(rightFile)]);
    prepareAOAs(leftAOA, rightAOA, ignoredColumns);
    compareAOAs(leftFile.name, leftAOA, rightFile.name, rightAOA);
}

async function compareFilesWB(leftFile, rightFile, ignoredColumns) {
    clear();
    write("sending " + leftFile.name + " and " + rightFile.name + " to WB workers");
    //https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
    [leftWB, rightWB] = await Promise.all([getWBFromFile(leftFile), getWBFromFile(rightFile)]);
    prepareWBs(leftWB, rightWB, ignoredColumns);
    compareWBs(leftFile.name, leftWB, rightFile.name, rightWB);
}

function prepareWBs(leftWB, rightWB, ignoredColumns){
    for (tab of leftWB){
        removeColumns(tab, ignoredColumns);
    }
    for (tab of rightWB){
        removeColumns(tab, ignoredColumns);
    }
}

function prepareAOAs(leftAOA, rightAOA, ignoredColumns){
    removeColumns(leftAOA, ignoredColumns);
    removeColumns(rightAOA, ignoredColumns);
}

function removeColumns(AOA, ignoredColumns){
    if (ignoredColumns.length <= 0)
        return;
        
    for (var row of AOA){
        for (var col of ignoredColumns){
            row.splice(col-1,1); //columns come in one based, reset to zero based
        }
    }
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

function compareWBs(leftName, leftWB, rightName, rightWB) {
    var diffs = compareWB(leftWB, rightWB);
    downloadDiffWB(diffs, leftName, rightName);
}

function downloadDiff(aoa, name) {
    if (aoa && aoa.length === 0){
        return;
    }

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0,31)); //XLSX limits sheet names to 31 characters
    XLSX.writeFile(wb, "diff --- " + name); // triggers download
}

function downloadDiffWB(wb, leftName, rightName) {
    if (wb && wb.length === 0){
        return;
    }

    var leftWBDiffs = XLSX.utils.book_new();

    for (var index in wb){
        var ws = XLSX.utils.aoa_to_sheet(wb[index].leftAOA);
        XLSX.utils.book_append_sheet(leftWBDiffs, ws, "Sheet " + index);
    }
    
    XLSX.writeFile(leftWBDiffs, "diff --- " + leftName); // triggers download



    var rightWBDiffs = XLSX.utils.book_new();

    for (var index in wb){
        var ws = XLSX.utils.aoa_to_sheet(wb[index].rightAOA);
        XLSX.utils.book_append_sheet(rightWBDiffs, ws, "Sheet " + index);
    }
    
    XLSX.writeFile(rightWBDiffs, "diff --- " + rightName); // triggers download
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

function getWBFromFile(file) {
    //https://stackoverflow.com/questions/41423905/wait-for-several-web-workers-to-finish
    return new Promise((resolve, reject) => {
        var worker = new Worker('wbWorker.js');
        worker.addEventListener('message', function (e) {
            write(file.name + " returned from wbWorker")
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