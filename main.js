/**
 * intermediary file for handling conversion of the xlsx to two-dimensional array
 * and then calling the comparison algorithm
 */

async function doTheThing(leftFile, rightFile) {
    //https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
    [leftJson, rightJson] = await Promise.all([getJson(leftFile), getJson(rightFile)]);
    console.clear()
    console.log('--- raw json ---')
    console.log(leftJson);
    console.log(rightJson);
    pullTheLever(leftJson,rightJson);
}

function getJson(file) {
    //https://stackoverflow.com/questions/41423905/wait-for-several-web-workers-to-finish
    return new Promise((resolve, reject) => {
        var worker = new Worker('worker.js');
        worker.addEventListener('message', function (e) {
            resolve(e.data);
        });
        worker.postMessage(file);
    });
};