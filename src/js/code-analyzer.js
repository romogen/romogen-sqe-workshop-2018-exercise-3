import * as esprima from 'esprima';
import * as esgraph from 'esgraph';

const buildCFG = (codeToParse) => {
    let cfgJSON = esgraph(esprima.parse(codeToParse, { range: true })['body'][0]['body'])[2];
    return cfgJSON;
};

const adaptViz = (dottedFormat) => {
    return 'digraph CFG { ' + adaptVizVertices(dottedFormat) + adaptVizEdges(dottedFormat) + '}';
};

const adaptVizEdges = (dottedFormat) => {
    
};

const handleVertice = (verticeJSON, verticeNum) => {
    let verticeAdapted = 'node' + verticeNum + ' [label=' + verticeJSON['codeString'];
    if(verticeJSON['isGreen'])
        verticeAdapted += ', color=green, style=filled';
    return verticeAdapted + ', shape=' + ((verticeJSON['false'] || verticeJSON['true']) ? 'diamond' : 'box') + ']';
};

const adaptVizVertices = (dottedFormat) => {
    let adaptedString = '';
    for (let i = 0 ; i < dottedFormat.length ; i++){
        adaptedString += handleVertice(dottedFormat[i], i);
    }
    return adaptedString;
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

export {parseCode, buildCFG, adaptViz};
