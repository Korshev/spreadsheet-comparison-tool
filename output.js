var out = document.getElementById('output');
function write(message){
    out.textContent += getTime() + "\t" + message + "\n";
}

function getTime(){
    return new Date().toLocaleTimeString();
}

function clear() {
    out.textContent = '';
    console.clear();
}