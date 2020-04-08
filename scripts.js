function getInputElem() {
    return document.getElementById("inputArea");
}

// TODO update this
function configCanvas() {
    let stage = new Konva.Stage({
        container: 'content',
        width: 500,
        height: 500
    });
}

// Executes once page loads
window.onload = () => {
    // Set update button functionality
    document.getElementById("update").onclick = doUpdate;

    // Configure canvas
    configCanvas();

    // Set default text of text area
    getInputElem().value =
`# Commented-lines here are expressed with '#'

# Syntax for read/write rules:
# a,1
# 0,b
# This means that if in state 'a' and we read a '1', write a '0' and move to state 'b'.

# Syntax for movement rules:
# b
# <,a
# This means that if in state 'b', move left and enter state 'a'.
# Possible movements are left '<' and right '>'

# This example is included below, feel free to delete.

a,1
0,b

b
<,a
`;
};

// Function that grabs input and updates the display to reflect the input
function doUpdate() {
    const inputData = getInputElem().value;
    alert(inputData);
    // TODO complete
}

