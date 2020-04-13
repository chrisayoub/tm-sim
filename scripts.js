function getInputElem() {
    return document.getElementById("inputArea");
}

// Executes once page loads
window.onload = () => {
    // Set update button functionality
    document.getElementById("update").onclick = doUpdate;

    // TODO DELETE THIS, here for testing
    drawGraph()

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
    const stateIndex = document.getElementById("stateIndex").value;
    const ruleText = getInputElem().value;

    // Validate tape input
    const tapeRegex = RegExp("^[01]+$");
    if (!tapeRegex.test(tapeValue)) {
        alert("Error: tape is empty or contains invalid characters.")
        return;
    }

    // Validate state index
    if (!stateIndex || isNaN(stateIndex) || stateIndex < 0 || stateIndex >= tapeValue.length) {
        alert("Error: initial state index should be in-bounds of the tape, and a number.")
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
    // TODO rather than assuming this initial position, let's add something to accept this as input (?)
    let tape = tapeValue.split("");

    // TODO figure out some way to internally represent the rules and possible transitions from current state

    // MARK -- Formulate output / display

    // TODO complete, need to draw elements on the graph with possible forward/backward states
    // Can adhere to some limit

}

function drawGraph() {
    // Sample DATA - Example instances, note that the transitions do not make sense
    const sampleTm = '0011010'.split('');
    const prev = [
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

    const getNodeLbl = (tm, level) => {
        let result = tm.tape.join('') + "\n";
        result += ' '.repeat(tm.stateIndex) + tm.state + "\n";
        result += "Level: " + level;
        return result;
    }
    const elem = document.getElementById('content');
    const height = elem.clientHeight;
    const width = elem.clientWidth;

    let id = 0;
    const cy = cytoscape({
        container: document.getElementById('content'),
        autounselectify: true,
        autoungrabify: true,
        minZoom: 0.1,
        maxZoom: 2,
        style: [
            {
                selector: 'node',
                style: {
                    label: 'data(lbl)',
                    'font-family': 'Courier',
                    'font-size': 20,
                    'font-style': 'bold',
                    padding: 12,
                    'background-color': '#d1d1d1',
                    'border-width': '1',
                    'border-color': 'black',
                    width: 'label',
                    height: 'label',
                    shape: 'rectangle',
                    'text-justification': 'left',
                    'text-valign': 'center',
                    'text-wrap': 'wrap'
                }
            },
            {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'width': 5,
                }
            }
        ]
    });

    const currId = id;
    const currLevel = 0;
    cy.add({
        data: {
            id: id++,
            lbl: getNodeLbl(curr, currLevel),
        },
        position: {
            x: width / 2,
            y: height / 2,
        }
    })

    for (let p of prev) {
        const thisId = id++;
        cy.add({
            data: {
                id: thisId,
                lbl: getNodeLbl(p, currLevel - 1),
            }
        })
        cy.add({
            data: {
                id: id++,
                source: thisId,
                target: currId,
            }
        })
    }

    for (let n of fwd) {
        const thisId = id++;
        cy.add({
            data: {
                id: thisId,
                lbl: getNodeLbl(n, currLevel + 1),
            }
        })
        cy.add({
            data: {
                id: id++,
                source: currId,
                target: thisId
            }
        })
    }

    cy.layout({
        name: 'dagre',
        rankDir: 'LR',
        spacingFactor: 1.1,
    }).run();
}
