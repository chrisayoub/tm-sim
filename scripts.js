function getInputElem() {
    return document.getElementById("inputArea");
}

const TAPE_BLANK = '_';

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
# Use a '` + TAPE_BLANK + `' to indicate a blank.

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

// Parse inputted rules, and checks for errors at the same time
function parseRules(lines) {
    if (lines.length % 2 !== 0){
        alert("Error: incomplete rule pair detected.");
        return false;
    }

    const letterRegex = RegExp("[a-z]");
    const numRegex = RegExp("[01-]");
    const directionRegex = RegExp("[<>]");

    let readWriteMap = new Map();
    let movementMap = new Map();

    for (let i = 0; i < lines.length - 1; i += 2) {
        const firstLine = lines[i];
        const secondLine = lines[i + 1];

        const firstToks = firstLine.split(',');
        const secondToks = secondLine.split(',');

        const firstLen = firstToks.length;
        const secondLen = secondToks.length;

        if (firstLen <= 0 || firstLen > 2) {
            alert("Error: cannot have more than 2 tokens on a line.");
            return false;
        } else if (secondLen !== 2) {
            alert("Error: second line in a rule must have 2 tokens.");
            return false;
        }

        if (firstLen === 1) {
            // Movement rule
            const startSymbol = firstToks[0];
            const destSymbol = secondToks[1];
            const move = secondToks[0];
            if (!letterRegex.test(startSymbol) || !letterRegex.test(destSymbol) || !directionRegex.test(move)) {
                alert("Error: invalid input in movement rules");
                return false;
            }

            // Map the key to an array of possible transitions
            if (!movementMap.get(firstLine)) {
                movementMap.set(firstLine, []);
            }
            movementMap.get(firstLine).push([move, destSymbol]);
        } else {
            // R/W rule
            const startSymbol = firstToks[0];
            const readBit = firstToks[1];
            const writeBit = secondToks[0];
            const destSymbol = secondToks[1];

            if (!letterRegex.test(startSymbol) || !letterRegex.test(destSymbol) ||
                !numRegex.test(readBit) || !numRegex.test(writeBit)) {
                alert("Error: invalid input in read/write rules");
                return false;
            }

            // Map the key to an array of possible transitions
            if (!readWriteMap.get(firstLine)) {
                readWriteMap.set(firstLine, []);
            }
            readWriteMap.get(firstLine).push([writeBit, destSymbol]);
        }
    }

    return {
        readWriteMap,
        movementMap
    }
}

// Global ID used for nodes, edges
let globalId = 0;

// Return a list of possible states from the current state
// This is a recursive function that uses backtracking to compute
function resolveStates(currentState, currentDepth, readWriteRules, movementRules) {
    const resultNodes = [];
    const resultEdges = [];

    // Limit on our depth here
    // TODO we should have a UI control for this value to let the user limit as desired
    if (currentDepth >= 5) {
        return {
            resultNodes,
            resultEdges
        };
    }

    // Adorn extra properties needed for graph display
    const id = globalId++; // Use global counter for unique IDs
    currentState.id = id;
    currentState.depth = currentDepth;
    // Place deep copy of object in result
    resultNodes.push(JSON.parse(JSON.stringify(currentState)));

    // Backup our initial values, to restore later
    const initState = currentState.state;
    const initIndex = currentState.stateIndex;
    const initTape = [...currentState.tape];
    const initBit = initTape[initIndex];

    // Two possible rule types...
    const transforms = [
        // Read/write
        {
            key: initState + ',' + initBit, // Defines key into readWriteRules map
            ruleSet: readWriteRules,
            // Function on how to apply a R/W rule
            fn: (toChange, rule) => {
                const writeBit = rule[0];
                const destState = rule[1];

                toChange.tape[initIndex] = writeBit;
                toChange.state = destState;
            }
        },
        // Movement
        {
            key: initState, // Defines key into movementRules map
            ruleSet: movementRules,
            // Function on how to apply a movement rule
            fn: (toChange, rule) => {
                const move = rule[0];
                const destState = rule[1];

                toChange.state = destState;
                if (move === '<') {
                    // Move left
                    if (initIndex === 0) {
                        // Add blank to front if at left end of tape
                        toChange.tape.unshift(TAPE_BLANK);
                    } else {
                        // Adjust index only if did not add to front of list
                        toChange.stateIndex = initIndex - 1;
                    }
                } else if (move === '>') {
                    // Move right
                    if (initIndex === toChange.tape.length - 1) {
                        // Add blank to end if at right end of tape
                        toChange.tape.push(TAPE_BLANK);
                    }
                    // Always adjust index
                    toChange.stateIndex = initIndex + 1;
                }
            }
        }
    ];

    // For all kinds of transformation rules...
    for (let t of transforms) {
        // Grab the transform key and relevant function
        const key = t.key;
        const ruleSet = t.ruleSet;
        const transform = t.fn;

        // Get rules from the set, based on the defined key
        let rules = ruleSet.get(key);
        if (!rules) {
            // If no rules resolve, just make empty list (do nothing below)
            rules = [];
        }

        // For all rules that apply...
        for (let rule of rules) {
            // Apply the transition given
            transform(currentState, rule);

            // Try to recurse on this
            const newDepth = currentDepth + 1;
            const subResult = resolveStates(currentState, newDepth, readWriteRules, movementRules);

            // Calculate any edges
            const newEdges = subResult.resultNodes.filter(n => n.depth === newDepth)
                .map(n => {
                    return {
                        id: globalId++,
                        source: id,
                        target: n.id
                    }
                });

            // Add to total result
            resultNodes.push(...subResult.resultNodes);
            resultEdges.push(...subResult.resultEdges);
            resultEdges.push(...newEdges);

            // Restore the state completely for next transformation in the loop
            currentState.tape = [...initTape];
            currentState.state = initState;
            currentState.stateIndex = initIndex;
        }
    }

    // Return final result
    return {
        resultNodes,
        resultEdges
    };
}

// Function that grabs input and updates the display to reflect the input
function doUpdate() {
    // MARK -- Parse and validate input

    const tapeValue = document.getElementById("tape").value;
    let stateIndex = document.getElementById("stateIndex").value;
    const ruleText = getInputElem().value;

    // Validate tape input
    const tapeRegex = RegExp("^[01_]+$");
    if (!tapeRegex.test(tapeValue)) {
        alert("Error: tape is empty or contains invalid characters.");
        return;
    }

    // Validate state index
    if (!stateIndex || isNaN(stateIndex)) {
        alert("Error: initial state index should be a number.");
        return;
    }

    stateIndex = parseInt(stateIndex);
    if (stateIndex < 0 || stateIndex >= tapeValue.length) {
        alert("Error: initial state index should be in-bounds of the tape.");
        return;
    }

    // Clean rules input
    // https://stackoverflow.com/questions/1418050/string-strip-for-javascript
    let lines = ruleText.split("\n")
        .map(line => line.replace(/^\s+|\s+$/g, '')) // Trim strings
        .filter(line => !line.startsWith("#") && line.length > 0); // Remove comments and blank lines

    // Parse and validate that the rules are valid
    const result = parseRules(lines);
    if (result === false) {
        return;
    }

    // Saving TM rules in read/write and movement maps
    const readWriteMap = result.readWriteMap;
    const movementMap = result.movementMap;

    // Represent current tape with array
    // Initial position is index `stateIndex`, initial state is 'a'
    // TODO instead of assuming 'a', let's take this in as user input
    let tape = tapeValue.split("");
    const initState = {
        tape,
        'state': 'a',
        stateIndex
    };

    // Now, in a recursive fashion, let us figure out all possible "forward" states from the "current"
    // We will impose a temporary limit on the "depth".
    // We also need to note down a mapping of "edges".
    const forwardResult = resolveStates(initState, 0, readWriteMap, movementMap);
    const forwardNodes = forwardResult.resultNodes;
    const forwardEdges = forwardResult.resultEdges;

    // Now, we will reverse the rules in the maps and recursively get the backward states
    // TODO implement this!
    // TODO for the resulting edges, will need to flip them
    // Or, set some flag in resolveStates

    // MARK -- Formulate output / display
    const cy = drawGraph(forwardNodes, forwardEdges);

    // Special styles / coloring can be applied on selected nodes
    const initNodeId = forwardNodes[0].id;
    cy.style()
        .selector('#' + initNodeId)
        .style({
            'background-color': 'lawngreen',
        })
        .update();
}

// Draws the nodes/edges in a graph using a display layout based on BFS
function drawGraph(nodes, edges) {
    // Function to create the text on a node
    const getNodeLbl = (tm) => {
        let result = tm.tape.join('') + "\n";
        result += ' '.repeat(tm.stateIndex) + tm.state + "\n";
        result += "Level: " + tm.depth;
        return result;
    };

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

    // Nodes
    for (let n of nodes) {
        cy.add({
            data: {
                id: n.id,
                lbl: getNodeLbl(n),
            }
        })
    }

    // Edges
    for (let e of edges) {
        cy.add({
            data: e
        })
    }

    // DAG layout from left-to-right
    cy.layout({
        name: 'dagre',
        rankDir: 'LR',
        spacingFactor: 1.1,
    }).run();

    return cy;
}
