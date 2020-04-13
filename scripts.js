function getInputElem() {
    return document.getElementById("inputArea");
}

// Executes once page loads
window.onload = () => {
    // Set update button functionality
    document.getElementById("update").onclick = doUpdate;

    // TODO alter this call, simply here for testing
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

function drawTmState(tape, state, stateIndex, layer, x, y) {
    const tapeVal = tape.join('') + "\n" + ' '.repeat(stateIndex) + state

    const tapeText = new Konva.Text({
        x: x,
        y: y,
        text: tapeVal,
        fontSize: 20,
        fontFamily:  'Courier',
        fontStyle: 'bold',
        padding: 16
    });

    const box = new Konva.Rect({
        x: x,
        y: y,
        stroke: '#555',
        strokeWidth: 1,
        fill: '#ddd',
        width: tapeText.width(),
        height: tapeText.height(),
        cornerRadius: 20
    });

    layer.add(box);
    layer.add(tapeText);

    return box;
}

function drawLine(x1, y1, x2, y2, layer) {
    const line = new Konva.Arrow({
        points: [x1, y1, x2, y2],
        pointerLength: 10,
        pointerWidth: 10,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 2
    });
    layer.add(line);
}

// TODO update this
// https://konvajs.org/docs/overview.html
function configCanvas(rules, tape) {
    const elem = document.getElementById('content');
    const height = elem.clientHeight;
    const width = elem.clientWidth;

    const stage = new Konva.Stage({
        container: 'content',
        width: width,
        height: height
    });

    const layer = new Konva.Layer();

    const sampleTm = '0011010'.split('');

    const box1 = drawTmState(sampleTm, 'b', 3, layer, 20, 60);
    const box2 = drawTmState(sampleTm, 'c', 2, layer, 200, 100);

    // Forward line example
    const x1 = box1.x() + box1.width();
    const y1 = box1.y() + (box1.height() / 2);

    const x2 = box2.x();
    const y2 = box2.y() + (box2.height() / 2);

    drawLine(x1, y1, x2, y2, layer);

    stage.add(layer);
}
