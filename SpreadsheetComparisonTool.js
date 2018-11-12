var leftFiles;
var rightFiles;

var leftWorkbook;
var rightWorkbook;

var leftRaw = document.getElementById("left-raw");
var rightRaw = document.getElementById("right-raw");

var leftPreview = document.getElementById("left-preview");
var rightPreview = document.getElementById("right-preview");

var displayRawCheckbox = document.getElementById("raw-checkbox");
var displayLinesCheckbox = document.getElementById("lines-checkbox");

// state variables...
var displayRaw = true;
var displayLines = true;

if (displayRawCheckbox.checked !== displayRaw) {
    displayRawCheckbox.checked = displayRaw;
}

if (displayLinesCheckbox.checked !== displayLines) {
    displayLinesCheckbox.checked = displayLines;
    displayLines = !displayLines;
    toggleDisplayLines();
}

function toggleDisplayRaw() {
    displayRaw = !displayRaw;
}

function toggleDisplayLines() {
    displayLines = !displayLines;
    if (displayLines) {
        var divs = document.getElementsByTagName('div');
        for (var i = 0; i < divs.length; i++) {
            divs[i].classList.add("debugging");
        }
    } else {
        var divs = document.getElementsByTagName('div');
        for (var i = 0; i < divs.length; i++) {
            divs[i].classList.remove("debugging");
        }
    }
}

// event listeners 

// https://stackoverflow.com/questions/19655189/javascript-click-event-listener-on-class
var dropzones = document.getElementsByClassName("dropzone");
Array.from(dropzones,
    dz => {
        dz.addEventListener("dragenter", dragenter, false);
        dz.addEventListener("dragover", dragover, false);
        dz.addEventListener("drop", drop, false);
    }
);

// https://stackoverflow.com/questions/5897122/accessing-elements-by-type-on-javascript
var inputs = document.querySelectorAll("input[type=file]");
Array.from(inputs,
    input => {
        input.addEventListener("change", handleInput, false);
    }
);

// events 

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    handleDrop(e);
}

function handleDrop(e) {
    var files = e.dataTransfer.files;
    var button = e.target.nextElementSibling;
    button.files = files; // calls handleInput(e)
}

function handleInput(e) {
    var dropzone = e.target.previousElementSibling;
    var left = dropzone.parentElement.id.includes("left");

    var files = this.files;
    // if no file was selected...
    if (files.length === 0 && (left ? leftFiles !== undefined : rightFiles !== undefined)) {
        this.files = left ? leftFiles : rightFiles;
        return;
    }

    clearComparisonWindow();

    left ? leftFiles = files : rightFiles = files;

    // update dropzone
    dropzone.classList.add("drop");
    dropzone.innerText = getMessage(files);

    // loadSpreadsheet
    loadSpreadsheet(files[0], left);
}

// stupid event cleanup code 

function clearComparisonWindow() {
    leftPreview.innerText = "";
    rightPreview.innerText = "";
}

// ALGORITHM code

function loadSpreadsheet(file, left) {

    var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        if (!rABS)
            data = new Uint8Array(data);

        if (left) {
            leftWorkbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' })
        } else {
            rightWorkbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' })
        }

        if (displayRaw) {
            if (left) {
                leftRaw.innerHTML = getHtml(leftWorkbook);
            } else {
                rightRaw.innerHTML = getHtml(rightWorkbook);
            }
        }

    }
    if (rABS)
        reader.readAsBinaryString(file);
    else
        reader.readAsArrayBuffer(file);
}

function compare() {
    if (!leftWorkbook || !rightWorkbook) {
        alert('Missing!');
        return;
    }

    // v3
    // var l3 = buildMapV3(leftWorkbook);
    // var r3 = buildMapV3(rightWorkbook);

    // console.log(l3);
    // console.log(r3);

    // for (key of l3.keys()) {
    //     var llf = l3.get(key);
    //     var rlf = r3.get(key);
    //     if (rlf !== undefined) {
    //         var sub = (rlf.frequency > llf.frequency) ? llf.frequency : rlf.frequency;
    //         llf.frequency -= sub;
    //         rlf.frequency -= sub;

    //         if (llf.frequency === 0) {
    //             l3.delete(key);
    //         } else {
    //             l3.set(key, llf);
    //         }
    //         if (rlf.frequency === 0) {
    //             r3.delete(key);
    //         } else {
    //             r3.set(key, rlf);
    //         }
    //     }
    // }

    // console.log(l3);
    // console.log(r3);

    // if (l3.size === 0 & r3.size === 0)
    //     alert("the files match");

    // // display differences
    // leftPreview.innerText = getString(l3);
    // rightPreview.innerText = getString(r3);

    // v2
    // same hash, same index, same line  -- perfect
    // same hash, same index, diff line  -- BAD: hash collision
    // same hash, diff index, same line  -- same line in a different spot, there might be a better match for this line
    // same hash, diff index, diff line  -- BAD: hash collision
    // diff hash, same index, same line  -- BAD: hash collision
    // diff hash, same index, diff line  -- partial match, original position
    // diff hash, diff index, same line  -- BAD: hash collision
    // diff hash, diff index, diff line  -- partial match, line moved

    // same hash, same index, same line  -- (1) perfect match, original position
    // same hash, diff index, same line  -- (2) perfect match, different position
    // diff hash, same index, diff line  -- (3) partial match, original position
    // diff hash, diff index, diff line  -- (4) partial match, different position

    // nearest original position or nearest perfect neighbor's position

    var testLeft = buildMapV2(leftWorkbook);
    var testRight = buildMapV2(rightWorkbook);

    console.log(testLeft);
    console.log(testRight);

    // perfect
    for (var hash of testLeft.keys()) {
        if (testRight.has(hash)) {
            var leftIndexes = testLeft.get(hash);
            for (var index of leftIndexes.keys()) {
                var rightIndexes = testRight.get(hash);
                if (rightIndexes.delete(index)) {
                    leftIndexes.delete(index);
                }
            }
            if (leftIndexes.size === 0) {
                testLeft.delete(hash);
            }
            if (rightIndexes.size === 0)
                testRight.delete(hash);
        }
    }


    /*
        near perfect

        now that we've found all the perfect matches (same hash and same line index) 
        it's time to find all the near perfect matches (same hash, differnt nearby line)
        in this case the best near perfect match for a line on the left side is the
        closest line on the right side with the same hash... BUT they only match if the 
        left line is also the RIGHT lines best nearest match
    */

    // make copies
    var left = testLeft;
    var right = testRight;

    function getNearest(hashMap, hash, targetIndex, start) {
        // stop if it doesn't have the hash;
        if (!hashMap.has(hash)) {
            return null;
        }
        var diff = null;
        var closestIndex = null;
        for (var index of hashMap.get(hash).keys()) {
            // skip index less that start
            if (index < start) {
                continue;
            }

            temp = Math.abs(targetIndex - index);
            if (temp < diff || diff === null || closestIndex === null) {
                diff = temp;
                closestIndex = index;
            }

            // stop when we pass the target index since the diff will only get bigger
            if (index > targetIndex) {
                break;
            }
        }
        return closestIndex;
    };

    // for every hash in the left side
    for (var hash of left.keys()) {
        // for every left side index with that hash
        for (leftIndex of left.get(hash).keys()) {
            var start = 0;
            // finds it nearest perfect match on the right side
            var rightIndex = getNearest(right, hash, leftIndex, 0);
            // if we find one check if the left side is the right sides nearest perfect match
            while (rightIndex != null) {
                // if (rightIndex === null) {
                //     break;
                // }
                var nearestMatchForRight = getNearest(left, hash, rightIndex, 0);
                // stop if there are no matches
                if (nearestMatchForRight === null) {
                    break;
                }
                if (leftIndex === nearestMatchForRight) {
                    // we've got a match -> delete from both
                    left.delete(leftIndex);
                    right.delete(rightIndex);
                } else {
                    // we need to search for the next best match
                    rightIndex = getNearest(right, hash, leftIndex, rightIndex + 1);
                }
            }
        }
    }

    /*
        The following lines share the same hash:
            left: 3, 7
            right: 6, 9

            left 3 will not match with a single pass through the loop... 
            because right 6/9 match better to left 7...
    */

    // // near perfect
    // for (var hash of testLeft.keys()) {
    //     if (testRight.has(hash)) {
    //         var leftIndexes = testLeft.get(hash);
    //         for (leftIndex of leftIndexes.keys()) {

    //             // find closest in right indexes
    //             var rightIndexes = testRight.get(hash);
    //             if (rightIndexes.get(leftIndex))
    //                 alert('This shouldn\'t be possible!');
    //             // after deleting there may not be any more matches
    //             if (rightIndexes.size <= 0)
    //                 break;
    //             var closestIndex = rightIndexes.keys().next().value;
    //             var closestDiff = Math.abs(leftIndex - closestIndex);
    //             for (rightIndex of rightIndexes.keys()) {

    //                 var tempDiff = Math.abs(leftIndex - rightIndex);
    //                 if (closestDiff > tempDiff) {
    //                     closestDiff = tempDiff;
    //                     closestIndex = rightIndex;
    //                 }

    //                 if (rightIndex > leftIndex)
    //                     break;
    //             }

    //             console.log("Left Index = " + leftIndex + ", Right Index = " + closestIndex + ", Diff = " + closestDiff);

    //             // now that we've found the closest rightIndex, make sure the 
    //             // leftIndex is closest for the rightIndex
    //             var risClosestIndex = leftIndexes.keys().next().value;
    //             var risClosestDiff = Math.abs(closestIndex - risClosestIndex);
    //             for (li of leftIndexes.keys()) {
    //                 var tempDiff = Math.abs(closestIndex - li);
    //                 if (risClosestDiff > tempDiff) {
    //                     risClosestDiff = tempDiff;
    //                     risClosestIndex = li;
    //                 }

    //                 if (li > risClosestIndex)
    //                     break;
    //             }

    //             console.log("Right Index = " + closestIndex + ", Left Index = " + risClosestIndex + ", Diff = " + risClosestDiff);

    //             // ???
    //             if (leftIndex === risClosestIndex) {
    //                 leftIndexes.delete(leftIndex);
    //                 rightIndexes.delete(closestIndex);
    //             } else {
    //                 // we need to repeat excluding this index from the search
    //             }
    //         }
    //     }
    // }

    // best
    // near best

    console.log(testLeft);
    console.log(testRight);

    if (testLeft.size === 0 & testRight.size === 0)
        alert("the files match");

    // display differences
    leftPreview.innerText = getOutput(testLeft);
    rightPreview.innerText = getOutput(testRight);
}

// map of hash to line frequency objects
function buildMapV3(workbook) {
    var lines = getLines(workbook);

    var hashToLineFrequency = new Map();
    for (var index in lines) {
        var line = lines[index];
        var hash = hash(line);

        var lineFrequency = hashToLineFrequency.get(hash);
        if (lineFrequency === undefined) {
            lineFrequency = {
                line: line,
                frequency: 0
            };
        }
        lineFrequency.frequency++;
        hashToLineFrequency.set(hash, lineFrequency);
    }

    return hashToLineFrequency;
}

// build a map of hash to a map of index to line
function buildMapV2(workbook) {
    var lines = getLines(workbook);
    var hashToIndexes = new Map();
    for (var index in lines) {
        var line = lines[index];
        var hash = hash(line);

        var indexMap = hashToIndexes.get(hash);
        if (indexMap === undefined) {
            indexMap = new Map();
            hashToIndexes.set(hash, indexMap);
        }
        indexMap.set(index, line);
    }
    return hashToIndexes;
}

// helper functions

function getOutput(hilm) {
    var output = '';
    for (hash of hilm.keys()) {
        for (index of hilm.get(hash).keys()) {
            output += index + ' - ' + hilm.get(hash).get(index) + '\n';
        }
    }
    return output;
}

function getString(map) {
    var message = '';
    for (var hash of map.keys()) {
        var lf = map.get(hash);
        message += lf.frequency + ' - ' + lf.line + '\n';
    }
    return message;
}

function getHtml(workbook) {
    sheets = workbook.SheetNames;
    var sheet = workbook.Sheets[sheets[0]];
    var html = XLSX.utils.sheet_to_html(sheet, { strip: true });
    return html;
}

function getLines(workbook) {
    var sheets = workbook.SheetNames;
    var sheet = workbook.Sheets[sheets[0]];
    var csv = XLSX.utils.sheet_to_csv(sheet/*, { strip: true, blankrows: false }*/);
    var lines = csv.split('\n');
    //        lines.pop(); // remove extra blank line

    return lines;
}



function getMessage(files) {
    var message = 'Loading...'
    if (files.length === 0) {
        message = 'No files currently selected for upload';
    } else {
        var f = files[0];
        message = f.name + ' (' + f.size + ' bytes)';
    }
    return message;
}

// hash algorithm

function hash(string) {
    var hash = 0, i, chr;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

