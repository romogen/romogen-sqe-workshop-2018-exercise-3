import $ from 'jquery';
import {parseCode, buildCFG, adaptViz} from './code-analyzer';
import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        //let parsedCode = parseCode(codeToParse);
        //let dottedFormat = esgraph.dot(buildCFG(codeToParse));
        let vizAdaptedDot = adaptViz(buildCFG(codeToParse));
        renderCfg(vizAdaptedDot);

        $('#parsedCode').val(JSON.stringify(parsedCode[0], null, 2));
    });
});

const renderCfg = (cfg_dot) => {
    let viz = new Viz({ Module, render });
    viz.renderSVGElement(cfg_dot)
        .then(function(element) {
            document.getElementById('graphPrint').innerHTML = '';
            document.getElementById('graphPrint').append(element);
        });
};