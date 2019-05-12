// this method should take two arrays of arrays and compare them, return diffs as two more AOAs

function compareWB(leftWB, rightWB) {
    if (leftWB.length != rightWB.length){
        alert("files have different number of tabs...");
        return;
    }
    var diffsWB = [];
    for (var index in leftWB){
        var diffsTab = compare(leftWB[index],rightWB[index]);
        diffsWB.push(diffsTab);
    }
    return diffsWB;
};

function compare(leftAOA, rightAOA) {
    write("begin converting AOAs into maps");
    var leftMap = getMap(leftAOA);
    var rightMap = getMap(rightAOA);
    write("done converting AOAs into maps - begin finding hash matches");

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
    write("done finding hash matches - begin matching leftover rows")
    var diffs = sortLeftovers(leftMap, rightMap);
    write("done matching leftover rows");

    if (diffs.leftAOA.length === 0 && diffs.rightAOA.length === 0) {
        write("the two files are equal");
    } else {
        // var message = buildMessage(leftAOA, rightAOA, diffs.leftAOA, diffs.rightAOA);
        // write(message);
        write("the files are different");
    }
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

    var leftAOA = [];
    var rightAOA = [];

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
                        leftAOA.push(bestMatchLeftEntry.row);
                        rightAOA.push(bestMatchRightEntry.row);
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
    pushLeftovers(leftMap, leftAOA);
    pushLeftovers(rightMap, rightAOA);

    return { leftAOA: leftAOA, rightAOA: rightAOA };
};

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
    for (var hash of map.keys()) {
        var entry = map.get(hash);
        for (var index in entry.indexes) {
            aoa.push(entry.row);
        }
    }
}