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
const numRegex = RegExp("[01_]");
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

// Defines a move transformation
function doMoveTransform(toChange, rule) {
    const initIndex = toChange.stateIndex;
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

// Defines a read/write transformation
function doReadWriteTransform(toChange, rule) {
    const initIndex = toChange.stateIndex;
    const writeBit = rule[0];
    const destState = rule[1];

    toChange.tape[initIndex] = writeBit;
    toChange.state = destState;
}

// Return a list of possible states from the current state
// This is a recursive function that uses backtracking to compute (however, written iteratively)
function resolveStates(initConfig, readWriteRules, movementRules, depthLimit, forward, skipBy) {
    // Result arrays
    const resultNodes = [];
    const resultEdges = [];

    // Treat as stack
    const workList = [];

    // Add starter element
    initConfig.depth = 0;
    workList.push({
        currentConfig: initConfig,
        parent: null,
    });

    // Useful for going backwards
    let initNodeId = 0;

    // While we still have elements to consider...
    while (workList.length !== 0) {
        const work = workList.pop();
        const currentConfig = work.currentConfig;
        const currentDepth = currentConfig.depth;
        const thisParent = work.parent;

        // Limit on our depth here
        if ((forward && currentDepth > depthLimit) || (!forward && currentDepth < depthLimit)) {
            // Ignore this node, at end of limit
            continue;
        }

        // Adorn extra properties needed for graph display
        const id = globalId++; // Use global counter for unique IDs
        currentConfig.id = id;
        if (currentDepth === 0) {
            initNodeId = id;
        }

        // Whether we "skip" this node in the output
        const doSkip = currentDepth % skipBy !== 0;

        // Place deep copy of object in result
        // Don't duplicate the 0th node
        if (!(currentDepth === 0 && !forward)) {
            // Only add to output if adhering to skipBy
            if (!doSkip) {
                resultNodes.push(JSON.parse(JSON.stringify(currentConfig)));

                // Create edge from our parent to us
                if (thisParent != null) {
                    let edge;
                    let otherNode;

                    if (!forward && thisParent === initNodeId) {
                        otherNode = 0;
                    } else {
                        otherNode = thisParent;
                    }

                    if (forward) {
                        edge = {
                            id: globalId++,
                            source: otherNode,
                            target: id
                        };
                    } else {
                        edge = {
                            id: globalId++,
                            source: id,
                            target: otherNode
                        };
                    }
                    resultEdges.push(edge);
                }
            }
        }

        // Need to push down parent if skipping
        let parent;
        if (doSkip) {
            parent = thisParent;
        } else {
            // We are the parent!
            parent = id;
        }

        // Extract some useful value
        const initState = currentConfig.state;
        const initBit = currentConfig.tape[currentConfig.stateIndex];

        // Two possible rule types...
        const transforms = [
            // Read/write
            {
                key: initState + ',' + initBit, // Defines key into readWriteRules map
                ruleSet: readWriteRules,
                // Function on how to apply a R/W rule
                fn: doReadWriteTransform
            },
            // Movement
            {
                key: initState, // Defines key into movementRules map
                ruleSet: movementRules,
                // Function on how to apply a movement rule
                fn: doMoveTransform
            }
        ];

        // New depth for next node down
        let newDepth;
        if (forward) {
            newDepth = currentDepth + 1;
        } else {
            newDepth = currentDepth - 1;
        }

        // For all kinds of transformation rules...
        for (let t of transforms) {
            // Grab the transform key and relevant function
            const key = t.key;
            const ruleSet = t.ruleSet;
            const transform = t.fn;

            // Get rules from the set, based on the defined key
            let rules = ruleSet.get(key);
            if (!rules) {
                // If no rules resolve, do nothing more for this iteration
                continue;
            }

            // For all rules that apply...
            for (let rule of rules) {
                // Apply the transition given (on a copy)
                const newConfig = JSON.parse(JSON.stringify(currentConfig));
                newConfig.depth = newDepth;
                transform(newConfig, rule);

                // Try to recurse on this
                workList.push({
                    currentConfig: newConfig,
                    parent
                });
            }
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

    // Levels we should skip by
    const skipBy = parseInt(document.getElementById("slider").value);

    // Now, in a recursive fashion, let us figure out all possible "forward" states from the "current"
    // We will impose a temporary limit on the "depth".
    // We also need to note down a mapping of "edges".
    const forwardResult = resolveStates(initConfig, readWriteMap, movementMap, maxDepth, true, skipBy);
    const forwardNodes = forwardResult.resultNodes;
    const forwardEdges = forwardResult.resultEdges;

    // Now, we will reverse the rules in the maps and recursively get the backward states
    const reverseResult = resolveStates(initConfig, reverseReadWriteMap, reverseMovementMap, minDepth, false, skipBy);
    const reverseNodes = reverseResult.resultNodes;
    const reverseEdges = reverseResult.resultEdges;

    // Combine resulting arrays
    const nodes = forwardNodes.concat(reverseNodes);
    const edges = forwardEdges.concat(reverseEdges);

    // MARK -- Formulate output / display
    const cy = drawGraph(nodes, edges, skipBy);

    // Special styles / coloring can be applied on selected nodes
    const initNodeId = forwardNodes[0].id;
    cy.style()
        .selector('#' + initNodeId)
        .style({
            'background-opacity': '1',
        })
        .update();
}

// Function to create the text on a node
const HEAD = '^';
const MARK = '•';

function renderNodeLabel(config) {
    const tape = config.tape;
    const stateIndex = config.stateIndex;
    const state = config.state;
    const depth = config.depth;

    // Tape
    let result = tape.join('') + "\n";

    // Carat pointing at position
    result += ' '.repeat(stateIndex) + HEAD + "\n";

    // Line indicating all of the spaces
    const toEnd = tape.length - stateIndex - 1;
    result += MARK.repeat(stateIndex) + state + MARK.repeat(toEnd) + "\n";

    // Depth
    result += "Lvl: " + depth;
    return result;
}

// Draws the nodes/edges in a graph using a display layout based on BFS
function drawGraph(nodes, edges, skipBy) {
    // Lets us set edge labels for skipping
    const edgeLabel = skipBy > 1 ? skipBy : '';

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
                    'line-color': arrowColor,
                    label: edgeLabel, // Label on skipping edges
                    'text-margin-y': -12,
                }
            }
        ]
    });

    // Nodes
    for (let n of nodes) {
        cy.add({
            data: {
                id: n.id,
                lbl: renderNodeLabel(n),
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
