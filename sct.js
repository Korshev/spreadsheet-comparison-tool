/**
 * This JavaScript file should only handle html events. 
 * The actual comparison should happen elsewhere.
 */

// drag and drop
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
    button.files = files; // triggers inputChange
}

// input file
function inputChange(e) {
    var files = this.files;

    if (files.length === 0) {
        //do nothing
    } else if (files.length === 1) {
        // do nothing
    } else if (files.length === 2) {
        var other = (this.id === 'left')
            ? document.getElementById('right')
            : document.getElementById('left');

        // https://stackoverflow.com/questions/47119426/how-to-set-file-objects-and-length-property-at-filelist-object-where-the-files-a/47172409#47172409
        var dt = new DataTransfer();
        dt.items.add(files[0]);
        this.files = dt.files;

        dt = new DataTransfer();
        dt.items.add(files[1]);
        other.files = dt.files;

        return; //no need to go further since we're re-triggering this method
    } else if (files.length > 2) {
        this.value = ''; // reset
        alert('Please select 1 or 2 files!');
    }

    var file = this.files[0];
    var dropzone = e.target.previousElementSibling;
    dropzone.innerText = (file)
        ? file.name + ' (' + file.size + ' bytes)'
        : 'Drag and drop one or two files here...';
    dropzone.classList.add("drop");
    if (!file) {
        dropzone.classList.remove("drop");
    }
}

// compare
function clickCompare() {
    var leftFile = document.getElementById('left').files[0];
    var rightFile = document.getElementById('right').files[0];

    if (leftFile && rightFile) {
        compareFiles(leftFile, rightFile);
    } else {
        alert("Please select two files to compare!")
    }
}

// register event listeners
// https://stackoverflow.com/questions/19655189/javascript-click-event-listener-on-class
var dropzones = document.getElementsByClassName("dropzone");
Array.from(dropzones,
    dropzone => {
        dropzone.addEventListener("dragenter", dragenter, false);
        dropzone.addEventListener("dragover", dragover, false);
        dropzone.addEventListener("drop", drop, false);
    }
);

// https://stackoverflow.com/questions/5897122/accessing-elements-by-type-on-javascript
var inputs = document.querySelectorAll("input[type=file]");
Array.from(inputs,
    input => {
        input.addEventListener("change", inputChange, false);
    }
);