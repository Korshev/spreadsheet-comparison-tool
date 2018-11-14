// DEPRECATED: move into comparison.js

function handleRawText(){
    var leftRaw = document.getElementById('left').value;
    var rightRaw = document.getElementById('right').value;

    var leftMap = getMapFromRawText(leftRaw);
    var rightMap = getMapFromRawText(rightRaw);
    compare(leftMap,rightMap);

}

function getMapFromRawText(rawText){
    var array = rawText.split('\n');
    return getMap(array);   
}