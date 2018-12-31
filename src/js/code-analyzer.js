import * as esprima from 'esprima';
import * as esgraph from 'esgraph';

const buildCFG = (codeToParse) => {
    let cfgJSON = esgraph(esprima.parse(codeToParse, { range: true })['body'][0]['body'])[2];
    cfgJSON = removeEntry(cfgJSON);
    cfgJSON = removeExit(cfgJSON);

    return cfgJSON;
};

const getExitNode = (flowNodeArray) => {
    for (let i = 0 ; i < flowNodeArray.length ; i++){
        if(flowNodeArray[i]['type'] === 'exit')
            return i;
    }
    return -1;
};

const removeExitFromNode = (flowNode) => {
    if(flowNode['normal'] !== undefined && flowNode['normal']['type'] === 'exit'){
        delete  flowNode['normal'];
        flowNode['next'] = [];
        //let exitNextIndex = getExitNode(flowNode['next']);
        //delete flowNode['next'][exitNextIndex];
    }
};

const removeExit = (cfgJSON) => {
    let exitNodeIndex = getExitNode(cfgJSON);
    cfgJSON = cfgJSON.slice(0, exitNodeIndex).concat(cfgJSON.slice(exitNodeIndex+1, cfgJSON.length));
    for (let i = 0 ; i < cfgJSON.length ; i++){
        removeExitFromNode(cfgJSON[i]);
    }
    return cfgJSON;
};

const removeEntry = (cfgJSON) => {
    cfgJSON[0].normal.type = 'entry';
    cfgJSON[0].normal.prev = [];
    return cfgJSON.slice(1, cfgJSON.length);
};


/******************
 * dot part start *
 *****************/


const adaptViz = (dottedFormat) => {
    return 'digraph CFG { '  + '\n' + adaptVizVertices(dottedFormat) + '\n' + adaptVizEdges(dottedFormat)  + '\n}';
};

const addCurrVerticeEdges = (verticeJSON, verticeNum) => {
    let edgesString = '';
    if(verticeJSON['true'] !== undefined || verticeJSON['false'] !== undefined){ //'if' node
        edgesString += 'node' + verticeNum + ' -> node' + verticeJSON['true']['vizNum'] + '[label=T]' + '\n';
        edgesString += 'node' + verticeNum + ' -> node' + verticeJSON['false']['vizNum'] + '[label=F]' + '\n';
    }
    else if(verticeJSON['next'].length !== 0){ // normal
        edgesString += 'node' + verticeNum + ' -> node' + verticeJSON['normal']['vizNum'] + '\n';
    }
    return edgesString;
};

const adaptVizEdges = (dottedFormat) => {
    let adaptedEdges = '';
    for (let i = 0 ; i < dottedFormat.length ; i++){
        adaptedEdges += addCurrVerticeEdges(dottedFormat[i], i);
    }
    return adaptedEdges;
};

const handleVertice = (verticeJSON, verticeNum) => {
    let verticeAdapted = 'node' + verticeNum + ' [label=' + verticeJSON['codeString'];
    if(verticeJSON['isGreen'])
        verticeAdapted += ', color=green, style=filled';
    return verticeAdapted + ', shape=' + ((verticeJSON['false'] || verticeJSON['true']) ? 'diamond' : 'box') + ']\n';
};

const adaptVizVertices = (dottedFormat) => {
    let adaptedString = '';
    for (let i = 0 ; i < dottedFormat.length ; i++){
        adaptedString += handleVertice(dottedFormat[i], i);
        dottedFormat[i]['vizNum'] = i;
    }
    return adaptedString;
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

export {parseCode, buildCFG, adaptViz};
