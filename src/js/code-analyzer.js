import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import * as escodegen from 'escodegen';

/*************************
 * coloring the cfg part *
 *************************/

const generateVariablesDecelerations_Paint = (varMap) => {
    let generatedString = '';
    for (let i = 0 ; i < varMap.length ; i++){
        if(Array.isArray(varMap[i]['value'])){
            generatedString += 'let ' + varMap[i]['name'] + ' = ' + JSON.stringify(varMap[i]['value']) + ';';
        }
        else{
            generatedString += 'let ' + varMap[i]['name'] + ' = ' + varMap[i]['value'] + ';';
        }
    }
    return generatedString;
};

const myEval_Paint = (expressionString , varMap) => {
    let varsDecelerationsString = generateVariablesDecelerations_Paint(varMap);
    return eval(varsDecelerationsString + expressionString);
};

/*const getEntryNode = (cfgJSON) => {
    for (let i = 0 ; i < cfgJSON.length ; i++){
        if(cfgJSON[i]['type'] === 'entry')
            return i;
        else
            continue;
    }
};*/

// Statement must be Expression
const evalExpression = (parsedJSON, valuesMap) => {
    let epressionString = escodegen.generate(parsedJSON);
    return myEval_Paint(epressionString, valuesMap);
};

const changeValue = (valuesMap, name, newValue) => {
    for (let i = 0 ; i < valuesMap.length ; i++){
        if(valuesMap[i]['name'] === name){
            valuesMap[i]['value'] = newValue;
            return true;
        }
    }
};

function handleVarDeclaration(astNode, valuesMap) {
    for (let i = 0; i < astNode['declarations'].length; i++) {
        /*if (!changeValue(valuesMap, astNode['declarations'][i]['id']['name'],
            evalExpression(astNode['declarations'][i]['init'], valuesMap))) */
        valuesMap.push({'name': astNode['declarations'][i]['id']['name'],
            'value': evalExpression(astNode['declarations'][i]['init'], valuesMap)});
    }
    return valuesMap;
}

function handleAssignment(valuesMap, astNode) {
    /*if (!changeValue(valuesMap, astNode['left']['name'],
        evalExpression(astNode['right'], valuesMap)))*/
    /*valuesMap.push({
        'name': astNode['left']['name'],
        'value': evalExpression(astNode['right'], valuesMap)});*/
    changeValue(valuesMap, astNode['left']['name'],
        evalExpression(astNode['right'], valuesMap));
    return valuesMap;

}

const coloringCFG = (cfgJSON, valuesMap) => {
    let currNode = cfgJSON[0]/*, exitNodeIndex = getExitNode(cfgJSON);*/;
    if(cfgJSON.length === 1){
        cfgJSON[0]['isGreen'] = true;
        return cfgJSON; }
    while(currNode['type'] !== 'exit'){
        currNode['isGreen'] = true;
        if(currNode['normal'] !== undefined){
            valuesMap = updateValuesMap(currNode['astNode'], valuesMap);
            currNode = currNode['normal'];
        } else /*if(currNode['false'] !== undefined || currNode['true'] !== undefined)*/{
            if(evalExpression(currNode['astNode'], valuesMap))
                currNode = currNode['true'];
            else
                currNode = currNode['false'];
        }
    }
    currNode['isGreen'] = true;
    return cfgJSON;
};

const updateValuesMap = (astNode, valuesMap) => {
    if(astNode['type'] === 'VariableDeclaration'){
        return handleVarDeclaration(astNode, valuesMap);
    } else /*if (astNode['type'] === 'AssignmentExpression')*/{
        return handleAssignment(valuesMap, astNode);
    } /*else {
        return valuesMap;
    }*/

};




/*************************
 * building the cfg part *
 *************************/

const buildCFG = (codeToParse) => {
    let cfgJSON = esgraph(esprima.parse(codeToParse, { range: true })['body'][0]['body'])[2];
    cfgJSON = removeEntry(cfgJSON);
    cfgJSON = removeExit(cfgJSON);
    setReturnAsExit(cfgJSON);
    addNodesCodeString(cfgJSON);
    return cfgJSON;
};

const removeExitFromNodeNext = (flowNode)=> {
    let exitIndex = getExitNode(flowNode['next']);
    if(exitIndex === -1)
        return;
    flowNode['next'] = flowNode['next'].slice(0, exitIndex).concat(flowNode['next'].slice(exitIndex+1,
        flowNode['next'].length));
};

const setReturnAsExit = (cfgJSON) => {
    if (cfgJSON.length === 1)
        return;
    for (let i = 0 ; i < cfgJSON.length ; i++){
        if(cfgJSON[i]['astNode']['type'] === 'ReturnStatement'){
            let returnNode = cfgJSON[i];
            returnNode['type'] = 'exit';
        }
    }
};

const addNodesCodeString = (cfgJSON) => {
    for (let i = 0 ; i < cfgJSON.length ; i++)
        cfgJSON[i]['codeString'] = escodegen.generate(cfgJSON[i]['astNode']);
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
    }
    removeExitFromNodeNext(flowNode);
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
    let verticeAdapted = 'node' + verticeNum + ' [label="' + verticeJSON['codeString'] + '"';
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

const changeCountParenthesis = (valuesString, i, countParenthesis) => {
    if (valuesString.charAt(i) === ']')
        countParenthesis--;
    else if ((valuesString.charAt(i) === '['))
        countParenthesis++;
    return countParenthesis;
};

const getValueMap = (valuesString, paramsNames) => {
    let startIndex = 0, countParenthesis = 0, valuesArray = [], currValue=0;

    if (valuesString.length === 0)
        return [];

    for (let i = 0 ; i < valuesString.length ; i++){
        if(countParenthesis === 0 && valuesString.charAt(i) === ','){
            valuesArray.push({'name': paramsNames[currValue++], 'value': eval(valuesString.substring(startIndex, i))});
            startIndex = i+1;
        }
        countParenthesis = changeCountParenthesis(valuesString, i, countParenthesis);
    }
    valuesArray.push({'name': paramsNames[currValue],
        'value': eval(valuesString.substring(startIndex, valuesString.length))});
    return valuesArray;
};

const getParamsNames = (paramsJSON) => {
    let ans = [];
    for (let i = 0 ; i < paramsJSON.length ; i++){
        ans.push(paramsJSON[i]['name']);
    }
    return ans;
};

export {buildCFG, adaptViz, getValueMap, getParamsNames, coloringCFG};
