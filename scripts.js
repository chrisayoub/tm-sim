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
    tapeText.offsetX(tapeText.width() / 2);
    tapeText.offsetY(tapeText.height() / 2);

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
    box.offsetX(box.width() / 2);
    box.offsetY(box.height() / 2);

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

    // Example code
    let prev = [
        {
            'tape': sampleTm,
            'state': 'a',
            'stateIndex': 0
        },
        {
            'tape': sampleTm,
            'state': 'b',
            'stateIndex': 1
        },
        {
            'tape': sampleTm,
            'state': 'e',
            'stateIndex': 6
        }
    ]

    const curr = {
        'tape': sampleTm,
        'state': 'd',
        'stateIndex': 3
    }
    const fwd = [
        {
            'tape': sampleTm,
            'state': 'j',
            'stateIndex': 5
        },
        {
            'tape': sampleTm,
            'state': 'k',
            'stateIndex': 4
        }
    ]

    const currBox = drawTmState(curr.tape, curr.state, curr.stateIndex, layer, width / 2, height / 2);
    // Can set color of our 'current' TM state
    currBox.fill('#85b942');

    // Helper values
    const X_GAP = 20;
    const Y_GAP = 10;
    const colSep = (currBox.width() * 1.5) + X_GAP;
    const getInitY = (arrLength) => currBox.y() - currBox.height() / 2 + (arrLength / 2 * (Y_GAP + currBox.height()));
    const yChange = Y_GAP + currBox.height();

    const drawLineHelper = (startBox, endBox) => {
        const x1 = startBox.x() + (startBox.width() / 2);
        const y1 = startBox.y();
        const x2 = endBox.x() - (endBox.width() / 2);
        const y2 = endBox.y();
        drawLine(x1, y1, x2, y2, layer);
    }

    // Previous boxes
    const prevX = currBox.x() - colSep;
    let prevY = getInitY(prev.length);
    for (let c of prev) {
        const newBox = drawTmState(c.tape, c.state, c.stateIndex, layer, prevX, prevY);
        drawLineHelper(newBox, currBox);
        prevY -= yChange;
    }

    // Next boxes
    const nextX = currBox.x() + colSep;
    let nextY = getInitY(fwd.length);
    for (let c of fwd) {
        const newBox = drawTmState(c.tape, c.state, c.stateIndex, layer, nextX, nextY);
        drawLineHelper(currBox, newBox);
        nextY -= yChange;
    }

    stage.add(layer);
}
