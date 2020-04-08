function getInputElem() {
    return document.getElementById("inputArea");
}

// Executes once page loads
window.onload = () => {
    // Set update button functionality
    document.getElementById("update").onclick = doUpdate;

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

# Note that the initial state is always 'a'. Use the state alphabet of '[a-z]'
# This example is included below, feel free to delete.

a,1
0,b

b
<,a
`;
};

// Function that grabs input and updates the display to reflect the input
function doUpdate() {
    // MARK -- Parse and validate input

    const tapeValue = document.getElementById("tape").value;
    const ruleText = getInputElem().value;

    // Validate tape input
    const tapeRegex = RegExp("^[01]+$");
    if (!tapeRegex.test(tapeValue)) {
        alert("Error: tape is empty or contains invalid characters.")
        return;
    }

    // Clean rule input
    // https://stackoverflow.com/questions/1418050/string-strip-for-javascript
    let lines = ruleText.split("\n")
        .map(line => line.replace(/^\s+|\s+$/g, '')) // Trim strings
        .filter(line => !line.startsWith("#") && line.length > 0); // Remove comments and blank lines

    // TODO validate that the rules are valid

    // Represent current tape with array
    // Initial position is index 0, initial state is 'a'
    let tape = tapeValue.split("");

    // TODO figure out some way to internally represent the rules and possible transitions from current state

    // MARK -- Formulate output / display

    // TODO complete, need to draw elements on the Canvas with possible forward/backward states
    // Can adhere to some limit
}

// TODO update this
// https://konvajs.org/docs/overview.html
function configCanvas(rules, tape) {
    let stage = new Konva.Stage({
        container: 'content',
    });

    let layer = new Konva.Layer();

}
