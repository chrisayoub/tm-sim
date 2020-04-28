function getInputElem() {
    return document.getElementById("inputArea");
}

// Updates level skip slider
function updateSlider() {
    document.getElementById("sliderVal").innerHTML = document.getElementById("slider").value;
}

const TAPE_BLANK = '_';

// Executes once page loads
//TODO: Add comment supporting regular TM rules
window.onload = () => {
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

# Use the state alphabet of '[a-z]'
# This example is included below, feel free to delete.

a,1
0,b

b
<,a
`;

    // Set initial level skip slider value
    updateSlider();
};

//letterRegex is useful outside of parseRules and it makese sense to define these all together
const letterRegex = RegExp("[a-z]");
const numRegex = RegExp("[01-]");
const directionRegex = RegExp("[<>]");


// Parse inputted rules, and checks for errors at the same time
// TODO: Could parse standard rules and transform to bennett
function parseRules(lines) {
    if (lines.length % 2 !== 0){
        alert("Error: incomplete rule pair detected.");
        return false;
    }

    let readWriteMap = new Map();
    let movementMap = new Map();

    let reverseReadWriteMap = new Map();
    let reverseMovementMap = new Map();

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

            // Map the key to an array of possible transitions but in reverse
            if (!reverseMovementMap.get(destSymbol)) {
                reverseMovementMap.set(destSymbol, []);
            }
            reverseMovementMap.get(destSymbol).push([getReverseMove(move), startSymbol])

        } else {
            // R/W rule
            const startSymbol = firstToks[0];
            const readBit = firstToks[1];
            const writeBit = secondToks[0];
            const destSymbol = secondToks[1];
            const reverseLine = secondToks[1] + ',' + secondToks[0];

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

            // Map the key to an array of possible transitions but in reverse
            if (!reverseReadWriteMap.get(reverseLine)) {
                reverseReadWriteMap.set(reverseLine, []);
            }
            reverseReadWriteMap.get(reverseLine).push([readBit, startSymbol]);
        }
    }

    return {
        readWriteMap,
        movementMap,
        reverseReadWriteMap,
        reverseMovementMap
    }
}

// Helper function to return the opposite of left/right move
function getReverseMove(move) {
    if (move === '>') {
        return '<';
    } else {
        return '>';
    }
}

// Global ID used for nodes, edges
let globalId = 0;

// Return a list of possible states from the current state
// This is a recursive function that uses backtracking to compute
function resolveStates(currentConfig, currentDepth, readWriteRules, movementRules, minDepth, maxDepth, forward) {
    const resultNodes = [];
    const resultEdges = [];

    // Limit on our depth here
    if ((forward && currentDepth > maxDepth) || (!forward && currentDepth < minDepth)) {
        return {
            resultNodes,
            resultEdges
        };
    }

    // Adorn extra properties needed for graph display
    const id = globalId++; // Use global counter for unique IDs
    currentConfig.id = id;
    currentConfig.depth = currentDepth;

    // Place deep copy of object in result
    //Don't duplicate the 0th node
    if(!(currentDepth === 0 && !forward)) {
        resultNodes.push(JSON.parse(JSON.stringify(currentConfig)));
    }

    // Backup our initial values, to restore later
    const initState = currentConfig.state;
    const initIndex = currentConfig.stateIndex;
    const initTape = [...currentConfig.tape];
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
            transform(currentConfig, rule);

            // Try to recurse on this
            let newDepth

            if(forward) {
                newDepth = currentDepth + 1;
            } else {
                newDepth = currentDepth - 1;
            }
            const subResult = resolveStates(currentConfig, newDepth, readWriteRules, movementRules, minDepth, maxDepth, forward);

            // Calculate any edges
            const newEdges = subResult.resultNodes.filter(n => n.depth === newDepth)
                .map(n => {
                    if (forward) {
                        return {
                            id: globalId++,
                            source: id,
                            target: n.id
                        }
                    } else if (currentDepth === 0 && !forward) {
                        return {
                            id: globalId++,
                            source: n.id,
                            target: 0
                        }
                    } else {
                        return {
                            id: globalId++,
                            source: n.id,
                            target: id
                        }
                    }
                });

            // Add to total result
            resultNodes.push(...subResult.resultNodes);
            resultEdges.push(...subResult.resultEdges);
            resultEdges.push(...newEdges);

            // Restore the config completely for next transformation in the loop
            currentConfig.tape = [...initTape];
            currentConfig.state = initState;
            currentConfig.stateIndex = initIndex;
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

    // Must restart counting
    globalId = 0;

    const tapeValue = document.getElementById("tape").value;
    const initState = document.getElementById("initState").value;
    let initStateIndex = document.getElementById("initStateIndex").value;
    const ruleText = getInputElem().value;

    // Validate tape input
    const tapeRegex = RegExp("^[01_]+$");
    if (!tapeRegex.test(tapeValue)) {
        alert("Error: tape is empty or contains invalid characters.");
        return;
    }

	// Validate initial state name
    if (!initState || !letterRegex.test(initState) || (initState.length !== 1)) {
        alert("Error: initial state should be a single lowercase letter.");
        return;
    }

    // Validate initial state index
    if (!initStateIndex || isNaN(initStateIndex)) {
        alert("Error: initial state index should be a number.");
        return;
    }

    initStateIndex = parseInt(initStateIndex);
    if (initStateIndex < 0 || initStateIndex >= tapeValue.length) {
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
    const reverseReadWriteMap = result.reverseReadWriteMap;
    const reverseMovementMap = result.reverseMovementMap;

    // Represent current tape with array
    let tape = tapeValue.split("");
    const initConfig = {
        tape,
        'state': initState,
        'stateIndex': initStateIndex
    };

    // Limits on recursion
    const maxDepth = document.getElementById("maxLevel").value;   // maximum level displayed
    const minDepth = document.getElementById("minLevel").value;   // minimum level displayed

    // Now, in a recursive fashion, let us figure out all possible "forward" states from the "current"
    // We will impose a temporary limit on the "depth".
    // We also need to note down a mapping of "edges".
    const forwardResult = resolveStates(initConfig, 0, readWriteMap, movementMap, minDepth, maxDepth, true);
    const forwardNodes = forwardResult.resultNodes;
    const forwardEdges = forwardResult.resultEdges;

    // Now, we will reverse the rules in the maps and recursively get the backward states
    const reverseResult = resolveStates(initConfig, 0, reverseReadWriteMap, reverseMovementMap, minDepth, maxDepth, false);
    const reverseNodes = reverseResult.resultNodes;
    const reverseEdges = reverseResult.resultEdges;

    // MARK -- Formulate output / display
    const cy = drawGraph(forwardNodes, forwardEdges, reverseNodes, reverseEdges);

    // Special styles / coloring can be applied on selected nodes
    const initNodeId = forwardNodes[0].id;
    cy.style()
        .selector('#' + initNodeId)
        .style({
            'background-opacity': '1',
        })
        .update();
}

// Draws the nodes/edges in a graph using a display layout based on BFS
function drawGraph(forwardNodes, forwardEdges, reverseNodes, reverseEdges) {
    // Levels we should skip by
    const skipBy = parseInt(document.getElementById("slider").value);

    // Skipping levels based on user selection (slider value)
    // TODO need to fix this code...
    forwardNodes = forwardNodes.filter(node => node.depth % skipBy === 0);
    reverseNodes = reverseNodes.filter(node => node.depth % skipBy === 0);

    forwardEdges = forwardEdges.filter(e => e.source % skipBy === 0);
    forwardEdges = forwardEdges.map(e => {
        return {
            id: e.id,
            source: e.source,
            target: e.target + skipBy - 1
        }
    }).filter(e => {
        for (let n of forwardNodes){
            if (n.id === e.target){
                return true;
            }
        }
        return false;
    });

    reverseEdges = reverseEdges.filter(e => e.source % skipBy === 0);
    reverseEdges = reverseEdges.map(e => {
        return {
            id: e.id,
            source: e.source,
            target: e.target + skipBy - 1
        }
    }).filter(e => {
        for (let n of reverseNodes){
            if ((n.id === e.target) || (0 === e.target)){
                return true;
            }
        }
        return false;
    });
    // TODO end fix this code

    // Function to create the text on a node
    const getNodeLbl = (tm) => {
        let result = tm.tape.join('') + "\n";

        const HEAD = '^';
        result += ' '.repeat(tm.stateIndex) + HEAD + "\n";

        const MARK = '•';
        const toEnd = tm.tape.length - tm.stateIndex - 1;
        result += MARK.repeat(tm.stateIndex) + tm.state + MARK.repeat(toEnd) + "\n";

        result += "Lvl: " + tm.depth;
        return result;
    };

    // Setup the graph
    const boxTextBorderColor = "#332648";
    const arrowColor = "steelblue";
    const cy = cytoscape({
        container: document.getElementById('content'),
        autounselectify: true, // Disable selection
        autoungrabify: true, // Disable grabbing
        minZoom: 0.01, // Set zoom limits
        maxZoom: 2,
        style: [
            {
                selector: 'node',
                style: {
                    label: 'data(lbl)', // Grab label from data
                    'font-family': 'Courier', // Label style
                    'font-size': 20,
                    'font-style': 'bold',
                    'color': boxTextBorderColor,
                    padding: 12, // Node padding
                    'background-color': '#b5b5b5', // Node color and border
                    'background-opacity': '0.2',
                    'border-width': '1',
                    'border-color': boxTextBorderColor,
                    width: 'label', // Node dimensions and shape
                    height: 'label',
                    shape: 'round-rectangle',
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
                    'target-arrow-color': arrowColor,
                    'line-color': arrowColor
                }
            }
        ]
    });

    // Nodes
    for (let n of reverseNodes) {
        cy.add({
            data: {
                id: n.id,
                lbl: getNodeLbl(n),
            }
        })
    }
    for (let n of forwardNodes) {
        cy.add({
            data: {
                id: n.id,
                lbl: getNodeLbl(n),
            }
        })
    }


    // Edges
    for (let e of reverseEdges) {
        cy.add({
            data: e
        })
    }
    for (let e of forwardEdges) {
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
