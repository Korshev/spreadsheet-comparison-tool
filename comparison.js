// this method should take two arrays of arrays and compare them, return diffs as two more AOAs

function compareWB(leftWB, rightWB, names) {
    if (leftWB.length != rightWB.length){
        alert("files have different number of tabs...");
        return;
    }
    var diffsWB = [];
    for (var index in leftWB){
        write("Begin converting the tabs named " + names[index] + " into maps. ");
        
        var diffsTab = compare(leftWB[index], rightWB[index]);

        if (diffsTab.leftAOA.length === 0 && diffsTab.rightAOA.length === 0) {
            write("The tabs named '" + names[index] + "' are the same. ");
        } else {
            // var message = buildMessage(leftAOA, rightAOA, diffs.leftAOA, diffs.rightAOA);
            // write(message);
            write("The tabs named '" + names[index] + "' are DIFFERENT. ");
        }

        diffsWB.push(diffsTab);
    }
    return diffsWB;
};

function compare(leftAOA, rightAOA) {
    var leftMap = getMap(leftAOA);
    var rightMap = getMap(rightAOA);
    write("\tdone converting AOAs into maps - begin finding hash matches");

    leftMap.forEach(function (leftEntry, hash) {
        if (rightMap.has(hash)) {
            var rightEntry = rightMap.get(hash);

            if (leftEntry.indexes.length === rightEntry.indexes.length) {
                leftMap.delete(hash);
                rightMap.delete(hash);
            } else if (leftEntry.indexes.length > rightEntry.indexes.length) {
                leftEntry.indexes = leftEntry.indexes.slice(0, -rightEntry.indexes.length);
                rightMap.delete(hash);
            } else if (leftEntry.indexes.length < rightEntry.indexes.length) {
                rightEntry.indexes = rightEntry.indexes.slice(0, -leftEntry.indexes.length);
                leftMap.delete(hash);
            } else {
                return new DOMException("Run Screaming!");
            }
        }
    });
    write("\tdone finding hash matches - begin matching leftover rows")
    var diffs = sortLeftovers(leftMap, rightMap);
    write("\tdone matching leftover rows");
    return diffs;
};

function getMap(aoa) {
    var map = new Map();

    aoa.forEach(function (row, index) {
        var hash = hashRow(row);
        if (map.has(hash)) {
            map.get(hash).indexes.push(index);
        } else {
            map.set(hash, { hash: hash, row: row, indexes: [index] });
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
    if (row.length === 0) {
        return hash;
    }

    var hash = 0, i, char;
    for (i = 0; i < row.length; ++i) {
        char = row.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function sortLeftovers(leftMap, rightMap) {

    var max = 0;
    for (var key of leftMap.keys()){
        var temp = leftMap.get(key).row.length;
        if (temp > max){
            max = temp;
        }
    } 

    var A = 'A'.charCodeAt(0);
    var header = ['line #'];
    for (var i=0; i<max; ++i){
        header.push(String.fromCharCode(A+i))
    }

    var leftAOA = [header];
    var rightAOA = [header];

    // keep looping over all remaining hashes as long as we keep finding best matches
    var foundAtLeastOneMatchForAnyRow = true;
    while (leftMap.size > 0 && rightMap.size > 0 && foundAtLeastOneMatchForAnyRow) {
        foundAtLeastOneMatchForAnyRow = false;

        // map of hash to object, object of indexes array and raw row array
        for (var leftHash of leftMap.keys()) {
            var leftEntry = leftMap.get(leftHash);

            // keep looping over remaining indexes in the current hash as long as we keep finding best matches
            var foundMatchForCurrentRow = true;
            while (leftEntry.indexes.length > 0 && foundMatchForCurrentRow) {
                foundMatchForCurrentRow = false;

                // bestMatchRightEntry is the entry from the rightMap that best matches the current row from the left map
                // we need to make sure the current left row is the best match for this right row
                var bestMatchRightEntry = findBestMatch(leftEntry.row, rightMap);
                var bestMatchLeftEntry = findBestMatch(bestMatchRightEntry.row, leftMap);

                if (leftEntry.row === bestMatchLeftEntry.row) {
                    foundMatchForCurrentRow = true;
                    foundAtLeastOneMatchForAnyRow = true;

                    var numberOfMatches = (bestMatchLeftEntry.indexes.length > bestMatchRightEntry.indexes.length)
                        ? bestMatchRightEntry.indexes.length
                        : bestMatchLeftEntry.indexes.length;

                    // push matches together (equal to number of matches)
                    for (var i = 0; i < numberOfMatches; ++i) {
                        var bestMatch = getDifferencesOnly(bestMatchLeftEntry.row, bestMatchRightEntry.row);
                        leftAOA.push([bestMatchLeftEntry.indexes[i], ...bestMatchLeftEntry.row]);
                        rightAOA.push([bestMatchRightEntry.indexes[i], ...bestMatchRightEntry.row]);
                    }

                    // slice off as many matches as we can
                    bestMatchLeftEntry.indexes = bestMatchLeftEntry.indexes.slice(numberOfMatches);
                    bestMatchRightEntry.indexes = bestMatchRightEntry.indexes.slice(numberOfMatches);

                    // remove if reduced to zero (at least one should be)
                    if (bestMatchLeftEntry.indexes.length <= 0) {
                        leftMap.delete(bestMatchLeftEntry.hash);
                    }
                    if (bestMatchRightEntry.indexes.length <= 0) {
                        rightMap.delete(bestMatchRightEntry.hash);
                    }
                }
            }
        }
    }

    // push any unmatched left overs
    var extra = pushLeftovers(leftMap, leftAOA);
    for (i=0; i<extra; ++i){
        rightAOA.push([]);
    }
    pushLeftovers(rightMap, rightAOA);

    return { leftAOA: leftAOA, rightAOA: rightAOA };
}

function getDifferencesOnly(left, right){
    var length = left.length > right.length ? left.length : right.length;
    for (var index = 0; index < length; ++index){
        if (!left[index]){
            left[index] = "EMPTY";
        }
        if (!right[index]){
            right[index] = "EMPTY";
        }
        if (left[index] === right[index]){
            left[index] = "";
            right[index] = "";
        }
    }
    console.log(left, right);
}

function findBestMatch(targetRow, map) {
    var bestMatchScore = 0;
    var bestMatchEntry = {};
    for (var hash of map.keys()) {
        var entry = map.get(hash);
        var matchScore = getMatchScore(targetRow, entry.row);
        if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestMatchEntry = entry;
        }
    }
    return bestMatchEntry;
}

function getMatchScore(leftRow, rightRow) {
    var score = 0;
    for (var index in leftRow) {
        score += leftRow[index] === rightRow[index];
    }
    return score;
}

function pushLeftovers(map, aoa) {
    var count = 0;
    for (var hash of map.keys()) {
        var entry = map.get(hash);
        for (var index of entry.indexes) {
            aoa.push([index, ...entry.row]);
            ++count;
        }
    }
    return count;
}