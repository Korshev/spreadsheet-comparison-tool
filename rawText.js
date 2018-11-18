// DEPRECATED: move into comparison.js

function handleRawText() {
    var leftRaw = document.getElementById('left').value;
    var rightRaw = document.getElementById('right').value;

    var leftAOA = getAOAFromRawText(leftRaw);
    var rightAOA = getAOAFromRawText(rightRaw);
    compare(leftAOA, rightAOA);

}

function getAOAFromRawText(rawText) {
    var array = [];
    for (var line of rawText.split('\n')){
        array.push([line]);
    }
    return array;
}