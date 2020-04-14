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

    // validate that the rules are valid
    const letterRegex = RegExp("[a-z]");
    const numRegex = RegExp("[01]");
    const directionRegex = RegExp("[<>]");
    
    movementCheck = false;
    
    for (let [lineNum, l] of lines.entries()){
        if(l.length == 1 && letterRegex.test(l[0])){
            movementCheck = true;
        }

        // Check read/write rules
        if(!movementCheck){
            if(lineNum % 2 == 0){
                if(l.length != 3 || !letterRegex.test(l[0]) || l[1] != ',' || !numRegex.test(l[2])){
                    alert('Error: invalid input in read/write rules');
                }
            }
            else{
                if(l.length != 3 || !numRegex.test(l[0]) || l[1] != ',' || !letterRegex.test(l[2])){
                    alert('Error: invalid input in read/write rules');
                }
            }
        }
        // Check movement rules
        else{
            if(lineNum % 2 == 0){
                if(l.length != 1 || !letterRegex.test(l[0])){
                    alert('Error: invalid input in movement rules');
                }
            }
            else{
                if(l.length != 3 || !directionRegex.test(l[0]) || l[1] != ',' || !letterRegex.test(l[2])){
                    alert('Error: invalid input in movement rules');
                }
            }
        }
    }


    

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

    // Function to create the text on a node
    const getNodeLbl = (tm, level) => {
        let result = tm.tape.join('') + "\n";
        result += ' '.repeat(tm.stateIndex) + tm.state + "\n";
        result += "Level: " + level;
        return result;
    }

    // Nodes and edges need unique IDs
    let id = 0;

    // Setup the graph
    const cy = cytoscape({
        container: document.getElementById('content'),
        autounselectify: true, // Disable selection
        autoungrabify: true, // Disable grabbing
        minZoom: 0.1, // Set zoom limits
        maxZoom: 2,
        style: [
            {
                selector: 'node',
                style: {
                    label: 'data(lbl)', // Grab label from data
                    'font-family': 'Courier', // Label style
                    'font-size': 20,
                    'font-style': 'bold',
                    padding: 12, // Node padding
                    'background-color': '#d1d1d1', // Node color and border
                    'border-width': '1',
                    'border-color': 'black',
                    width: 'label', // Node dimensions and shape
                    height: 'label',
                    shape: 'rectangle',
                    'text-justification': 'left', // Label position
                    'text-valign': 'center',
                    'text-wrap': 'wrap'
                }
            },
            {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier', // Directed edges
                    'target-arrow-shape': 'triangle',
                    'width': 5,
                }
            }
        ]
    });

    // Node for current
    const currId = id;
    const currLevel = 0;
    cy.add({
        data: {
            id: id++,
            lbl: getNodeLbl(curr, currLevel),
        }
    })

    // Previous nodes and edges *to* current
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

    // Next nodes and edges *from* current
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

    // DAG layout from left-to-right
    cy.layout({
        name: 'dagre',
        rankDir: 'LR',
        spacingFactor: 1.1,
    }).run();
}
