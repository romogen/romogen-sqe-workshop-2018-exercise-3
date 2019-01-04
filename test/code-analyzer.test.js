import assert from 'assert';
import {buildCFG, adaptViz, getValueMap, getParamsNames, coloringCFG} from '../src/js/code-analyzer';
import * as esprima from 'esprima';


describe('Test getParamsNames', () => {

    it('empty paramsValue', () => {
        assert.deepEqual(getParamsNames(esprima.parseScript('function a(){ return 1;}')['body'][0]['params']), []);
    });

    it('1 paramsValue', () => {
        assert.deepEqual(getParamsNames(esprima.parseScript('function a(x){ return 1;}')['body'][0]['params']), ['x']);
    });

    it('2 paramsValue', () => {
        assert.deepEqual(getParamsNames(esprima.parseScript('function a(x, aw){ return 1;}')['body'][0]['params']),
            ['x', 'aw']);
    });
});

describe('Test getValueMap', () => {
    it('empty paramsValue', () => {
        assert.deepEqual(getValueMap('', []), []);
    });

    it('one paramsValue', () => {
        assert.deepEqual(getValueMap('1', ['x']), [{'name': 'x', 'value': 1}]);
    });

    it('one array paramsValue', () => {
        assert.deepEqual(getValueMap('[1,[2,3],4]', ['x']), [{'name': 'x', 'value': [1,[2,3],4]}]);
    });

    it('2 paramsValue', () => {
        assert.deepEqual(getValueMap('1,2', ['x', 'y']), [{'name': 'x', 'value': 1}, {'name': 'y', 'value': 2}]);
    });

    it('2 array paramsValue', () => {
        assert.deepEqual(getValueMap('[1,[2,3],4], [1,\'a\']', ['x', 'y']), [{'name': 'x', 'value': [1,[2,3],4]},
            {'name': 'y', 'value': [1, 'a']}]);
    });
});

describe('Test buildCFG', () => {
    it('empty function', () => {
        let cfgUnderTest = buildCFG('function a(x,t){\n' +
            'return x+t;\n' +
            '}');

        assert.equal(cfgUnderTest.length, 1);
        assert.equal(cfgUnderTest[0]['codeString'], 'return x + t;');
        assert.equal(cfgUnderTest['isGreen'], undefined);
        assert.equal(cfgUnderTest[0]['type'], 'entry');
        assert.equal(cfgUnderTest[0]['astNode']['type'], 'ReturnStatement');
        assert.equal(cfgUnderTest[0]['next'].length, 0);
    });

    it('function with assignment', () => {
        let cfgUnderTest = buildCFG('function a(x, t){\n' +
            'x = t - 2;\n' +
            'return x - 2*t;\n' +
            '}');

        // general for cfg
        assert.equal(cfgUnderTest.length, 2);

        // node 0
        assert.equal(cfgUnderTest[0]['type'], 'entry');
        assert.equal(cfgUnderTest[0]['astNode']['type'], 'AssignmentExpression');
        assert.equal(cfgUnderTest[0]['codeString'], 'x = t - 2');
        assert.notEqual(cfgUnderTest[0]['normal'], undefined);
        assert.equal(cfgUnderTest[0]['false'], undefined);
        assert.equal(cfgUnderTest[0]['true'], undefined);

        // node 1
        assert.equal(cfgUnderTest[1]['type'], 'exit');
        assert.equal(cfgUnderTest[1]['astNode']['type'], 'ReturnStatement');
        assert.equal(cfgUnderTest[1]['codeString'], 'return x - 2 * t;');
        assert.equal(cfgUnderTest[1]['normal'], undefined);
        assert.equal(cfgUnderTest[1]['false'], undefined);
        assert.equal(cfgUnderTest[1]['true'], undefined);
        assert.equal(cfgUnderTest[1]['next'].length, 0);
    });

    it('function with let', () => {
        let cfgUnderTest = buildCFG('function a(){\n' +
            'let a = 2, b = -2;\n' +
            'return a+b;\n' +
            '}');

        // general for cfg
        assert.equal(cfgUnderTest.length, 2);

        // node 0
        assert.equal(cfgUnderTest[0]['type'], 'entry');
        assert.equal(cfgUnderTest[0]['astNode']['type'], 'VariableDeclaration');
        assert.equal(cfgUnderTest[0]['codeString'], 'let a = 2, b = -2;');
        assert.notEqual(cfgUnderTest[0]['normal'], undefined);
        assert.equal(cfgUnderTest[0]['false'], undefined);
        assert.equal(cfgUnderTest[0]['true'], undefined);

        // node 1
        assert.equal(cfgUnderTest[1]['type'], 'exit');
        assert.equal(cfgUnderTest[1]['astNode']['type'], 'ReturnStatement');
        assert.equal(cfgUnderTest[1]['codeString'], 'return a + b;');
        assert.equal(cfgUnderTest[1]['normal'], undefined);
        assert.equal(cfgUnderTest[1]['false'], undefined);
        assert.equal(cfgUnderTest[1]['true'], undefined);
        assert.equal(cfgUnderTest[1]['next'].length, 0);
    });

    it('function with if', () => {
        let cfgUnderTest = buildCFG('function a(x,t){\n' +
            'let a = 2, b = -2;\n' +
            'let c = a+b;\n' +
            'if(x == 2*c){\n' +
            'a = 1;\n' +
            '}\n' +
            'else{\n' +
            'a = 0;\n' +
            '}\n' +
            'return a+t;\n' +
            '}');

        // general for cfg
        assert.equal(cfgUnderTest.length, 6);

        // node 0
        assert.equal(cfgUnderTest[0]['type'], 'entry');
        assert.equal(cfgUnderTest[0]['astNode']['type'], 'VariableDeclaration');
        assert.equal(cfgUnderTest[0]['codeString'], 'let a = 2, b = -2;');
        assert.notEqual(cfgUnderTest[0]['normal'], undefined);
        assert.equal(cfgUnderTest[0]['false'], undefined);
        assert.equal(cfgUnderTest[0]['true'], undefined);

        // node 1
        assert.equal(cfgUnderTest[1]['type'], undefined);
        assert.equal(cfgUnderTest[1]['astNode']['type'], 'VariableDeclaration');
        assert.equal(cfgUnderTest[1]['codeString'], 'let c = a + b;');
        assert.notEqual(cfgUnderTest[1]['normal'], undefined);
        assert.equal(cfgUnderTest[1]['false'], undefined);
        assert.equal(cfgUnderTest[1]['true'], undefined);

        // node 2
        assert.equal(cfgUnderTest[2]['type'], undefined);
        assert.equal(cfgUnderTest[2]['astNode']['type'], 'BinaryExpression');
        assert.equal(cfgUnderTest[2]['codeString'], 'x == 2 * c');
        assert.equal(cfgUnderTest[2]['normal'], undefined);
        assert.notEqual(cfgUnderTest[2]['false'], undefined);
        assert.notEqual(cfgUnderTest[2]['true'], undefined);

        // node 3
        assert.equal(cfgUnderTest[3]['type'], undefined);
        assert.equal(cfgUnderTest[3]['astNode']['type'], 'AssignmentExpression');
        assert.equal(cfgUnderTest[3]['codeString'], 'a = 1');
        assert.notEqual(cfgUnderTest[3]['normal'], undefined);
        assert.equal(cfgUnderTest[3]['false'], undefined);
        assert.equal(cfgUnderTest[3]['true'], undefined);

        // node 5
        assert.equal(cfgUnderTest[5]['type'], undefined);
        assert.equal(cfgUnderTest[5]['astNode']['type'], 'AssignmentExpression');
        assert.equal(cfgUnderTest[5]['codeString'], 'a = 0');
        assert.notEqual(cfgUnderTest[5]['normal'], undefined);
        assert.equal(cfgUnderTest[5]['false'], undefined);
        assert.equal(cfgUnderTest[5]['true'], undefined);

        // node 4
        assert.equal(cfgUnderTest[4]['type'], 'exit');
        assert.equal(cfgUnderTest[4]['astNode']['type'], 'ReturnStatement');
        assert.equal(cfgUnderTest[4]['codeString'], 'return a + t;');
        assert.equal(cfgUnderTest[4]['normal'], undefined);
        assert.equal(cfgUnderTest[4]['false'], undefined);
        assert.equal(cfgUnderTest[4]['true'], undefined);
        assert.equal(cfgUnderTest[4]['next'].length, 0);
    });

    it('function with while', () => {
        let cfgUnderTest = buildCFG('function a(x,t){\n' +
            'while(x > t){\n' +
            'x = x / 2;\n' +
            '}\n' +
            'return x;\n' +
            '}');

        // general for cfg
        assert.equal(cfgUnderTest.length, 3);

        // node 0
        assert.equal(cfgUnderTest[0]['type'], 'entry');
        assert.equal(cfgUnderTest[0]['astNode']['type'], 'BinaryExpression');
        assert.equal(cfgUnderTest[0]['codeString'], 'x > t');
        assert.equal(cfgUnderTest[0]['normal'], undefined);
        assert.notEqual(cfgUnderTest[0]['false'], undefined);
        assert.notEqual(cfgUnderTest[0]['true'], undefined);

        // node 1
        assert.equal(cfgUnderTest[1]['type'], undefined);
        assert.equal(cfgUnderTest[1]['astNode']['type'], 'AssignmentExpression');
        assert.equal(cfgUnderTest[1]['codeString'], 'x = x / 2');
        assert.notEqual(cfgUnderTest[1]['normal'], undefined);
        assert.equal(cfgUnderTest[1]['false'], undefined);
        assert.equal(cfgUnderTest[1]['true'], undefined);

        // node 2
        assert.equal(cfgUnderTest[2]['type'], 'exit');
        assert.equal(cfgUnderTest[2]['astNode']['type'], 'ReturnStatement');
        assert.equal(cfgUnderTest[2]['codeString'], 'return x;');
        assert.equal(cfgUnderTest[2]['normal'], undefined);
        assert.equal(cfgUnderTest[2]['false'], undefined);
        assert.equal(cfgUnderTest[2]['true'], undefined);
        assert.equal(cfgUnderTest[2]['next'].length, 0);
    });
});

describe('Test coloringCFG', () => {
    it('empty function', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'return x+t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
    });

    it('function with assignment', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x, t){\n' +
            'x = t - 2;\n' +
            'return x - 2*t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.equal(cfgUnderTest[1]['isGreen'], true);
    });

    it('function with let', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(){\n' +
            'let a = 2, b = -2;\n' +
            'return a+b;\n' +
            '}'), []);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.equal(cfgUnderTest[1]['isGreen'], true);
    });

    it('function with if (false)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = 2, b = -2;\n' +
            'let c = a+b;\n' +
            'if(x == 2*c){\n' +
            'a = 1;\n' +
            '}\n' +
            'else{\n' +
            'a = 0;\n' +
            '}\n' +
            'return a+t;\n' +
            '}'), [{'name': 'x', 'value': 0}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.equal(cfgUnderTest[1]['isGreen'], true);
        assert.equal(cfgUnderTest[2]['isGreen'], true);
        assert.equal(cfgUnderTest[3]['isGreen'], true);
        assert.equal(cfgUnderTest[4]['isGreen'], true);
        assert.notEqual(cfgUnderTest[5]['isGreen'], true);
    });

    it('function with if (true)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = 2, b = -2;\n' +
            'let c = a+b;\n' +
            'if(x == 2*c){\n' +
            'a = 1;\n' +
            '}\n' +
            'else{\n' +
            'a = 0;\n' +
            '}\n' +
            'return a+t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.equal(cfgUnderTest[1]['isGreen'], true);
        assert.equal(cfgUnderTest[2]['isGreen'], true);
        assert.notEqual(cfgUnderTest[3]['isGreen'], true);
        assert.equal(cfgUnderTest[4]['isGreen'], true);
        assert.equal(cfgUnderTest[5]['isGreen'], true);
    });

    it('function with while (false)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'while(x > t){\n' +
            'x = x / 2;\n' +
            '}\n' +
            'return x;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.notEqual(cfgUnderTest[1]['isGreen'], true);
        assert.equal(cfgUnderTest[2]['isGreen'], true);
    });

    it('function with while (true)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'while(x > t){\n' +
            'x = x / 2;\n' +
            '}\n' +
            'return x;\n' +
            '}'), [{'name': 'x', 'value': 4}, {'name': 't', 'value': 2}]);

        assert.equal(cfgUnderTest[0]['isGreen'], true);
        assert.equal(cfgUnderTest[1]['isGreen'], true);
        assert.equal(cfgUnderTest[2]['isGreen'], true);
    });
});

describe('Test adaptViz', () => {
    it('empty function', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'return x+t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="return x + t;", color=green, style=filled, shape=box]\n' +
            '\n' +
            '\n' +
            '}');
    });

    it('function with assignment', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x, t){\n' +
            'x = t - 2;\n' +
            'return x - 2*t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="x = t - 2", color=green, style=filled, shape=box]\n' +
            'node1 [label="return x - 2 * t;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            '\n' +
            '}');
    });

    it('function with let', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(){\n' +
            'let a = 2, b = -2;\n' +
            'return a+b;\n' +
            '}'), []);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="let a = 2, b = -2;", color=green, style=filled, shape=box]\n' +
            'node1 [label="return a + b;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            '\n' +
            '}');
    });

    it('function with if (false)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = 2, b = -2;\n' +
            'let c = a+b;\n' +
            'if(x == 2*c){\n' +
            'a = 1;\n' +
            '}\n' +
            'else{\n' +
            'a = 0;\n' +
            '}\n' +
            'return a+t;\n' +
            '}'), [{'name': 'x', 'value': 0}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="let a = 2, b = -2;", color=green, style=filled, shape=box]\n' +
            'node1 [label="let c = a + b;", color=green, style=filled, shape=box]\n' +
            'node2 [label="x == 2 * c", color=green, style=filled, shape=diamond]\n' +
            'node3 [label="a = 1", color=green, style=filled, shape=box]\n' +
            'node4 [label="return a + t;", color=green, style=filled, shape=box]\n' +
            'node5 [label="a = 0", shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            'node1 -> node2\n' +
            'node2 -> node3[label=T]\n' +
            'node2 -> node5[label=F]\n' +
            'node3 -> node4\n' +
            'node5 -> node4\n' +
            '\n' +
            '}');
    });

    it('function with if (true)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = 2, b = -2;\n' +
            'let c = a+b;\n' +
            'if(x == 2*c){\n' +
            'a = 1;\n' +
            '}\n' +
            'else{\n' +
            'a = 0;\n' +
            '}\n' +
            'return a+t;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="let a = 2, b = -2;", color=green, style=filled, shape=box]\n' +
            'node1 [label="let c = a + b;", color=green, style=filled, shape=box]\n' +
            'node2 [label="x == 2 * c", color=green, style=filled, shape=diamond]\n' +
            'node3 [label="a = 1", shape=box]\n' +
            'node4 [label="return a + t;", color=green, style=filled, shape=box]\n' +
            'node5 [label="a = 0", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            'node1 -> node2\n' +
            'node2 -> node3[label=T]\n' +
            'node2 -> node5[label=F]\n' +
            'node3 -> node4\n' +
            'node5 -> node4\n' +
            '\n' +
            '}');
    });

    it('function with while (false)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'while(x > t){\n' +
            'x = x / 2;\n' +
            '}\n' +
            'return x;\n' +
            '}'), [{'name': 'x', 'value': 1}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="x > t", color=green, style=filled, shape=diamond]\n' +
            'node1 [label="x = x / 2", shape=box]\n' +
            'node2 [label="return x;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1[label=T]\n' +
            'node0 -> node2[label=F]\n' +
            'node1 -> node0\n' +
            '\n' +
            '}');
    });

    it('function with while (true)', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'while(x > t){\n' +
            'x = x / 2;\n' +
            '}\n' +
            'return x;\n' +
            '}'), [{'name': 'x', 'value': 4}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="x > t", color=green, style=filled, shape=diamond]\n' +
            'node1 [label="x = x / 2", color=green, style=filled, shape=box]\n' +
            'node2 [label="return x;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1[label=T]\n' +
            'node0 -> node2[label=F]\n' +
            'node1 -> node0\n' +
            '\n' +
            '}');
    });

    it('function with array', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = [x,t];\n' +
            'return a;\n' +
            '}'), [{'name': 'x', 'value': 4}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="let a = [\n' +
            '    x,\n' +
            '    t\n' +
            '];", color=green, style=filled, shape=box]\n' +
            'node1 [label="return a;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            '\n' +
            '}');
    });

    it('function with array in if', () => {
        let cfgUnderTest = coloringCFG(buildCFG('function a(x,t){\n' +
            'let a = [x,t];\n' +
            'if(a[0] == 1){\n' +
            'a = 2;\n' +
            '}\n' +
            'return a;\n' +
            '}'), [{'name': 'x', 'value': 4}, {'name': 't', 'value': 2}]);

        assert.equal(adaptViz(cfgUnderTest), 'digraph CFG { \n' +
            'node0 [label="let a = [\n' +
            '    x,\n' +
            '    t\n' +
            '];", color=green, style=filled, shape=box]\n' +
            'node1 [label="a[0] == 1", color=green, style=filled, shape=diamond]\n' +
            'node2 [label="a = 2", shape=box]\n' +
            'node3 [label="return a;", color=green, style=filled, shape=box]\n' +
            '\n' +
            'node0 -> node1\n' +
            'node1 -> node2[label=T]\n' +
            'node1 -> node3[label=F]\n' +
            'node2 -> node3\n' +
            '\n' +
            '}');
    });
});
