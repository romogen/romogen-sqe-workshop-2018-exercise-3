import $ from 'jquery';
import {parseCode, buildCFG, adaptViz, getValueMap, getParamsNames, coloringCFG} from './code-analyzer';
import * as esprima from 'esprima';
import * as esgraph from 'esgraph';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let paramsNamesArray = getParamsNames(esprima.parseScript(codeToParse)['body'][0]['params']);
        let valueMapArray = getValueMap($('#valuesArray').val(), paramsNamesArray);

        let vizAdaptedDot = adaptViz(coloringCFG(buildCFG(codeToParse), valueMapArray));
        renderCfg(vizAdaptedDot);

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