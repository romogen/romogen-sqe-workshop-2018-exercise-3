import $ from 'jquery';
import {parseCode, buildCFG, adaptViz} from './code-analyzer';
import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import Viz from 'viz.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        //let parsedCode = parseCode(codeToParse);
        let dottedFormat = esgraph.dot(buildCFG(codeToParse));
        let vizAdaptedDot = adaptViz(dottedFormat);


        $('#parsedCode').val(JSON.stringify(parsedCode[0], null, 2));
    });
});
