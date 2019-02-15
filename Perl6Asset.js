'use strict';
const Asset = require('parcel-bundler/src/Asset');
const SourceMap = require('parcel-bundler/src/SourceMap');
const lineCounter = require('parcel-bundler/src/utils/lineCounter');

const fs = require('fs');
const path = require('path');
const nqpRuntimePath = 'nqp-browser-runtime';
const rakudoLibrary = require('rakudo/rakudo-library.js');

function insertAfter(whole, where, what) {
    return whole.replace(where, (match, offset, string) => where + what);
}

function stripSourceMappingUrl(js) {
  return js.substring(0, js.lastIndexOf('//# sourceMappingURL'));
}

module.exports = class Perl6Asset extends Asset {
    async getDependencies() {
      this.addDependency(nqpRuntimePath + '/runtime.nqp-raw-runtime');
    }

    constructor(name, options) {
      super(name, options);
      this.type = 'js';
    }

    requireNqp() {
      return `require('${nqpRuntimePath}/runtime.nqp-raw-runtime')`;
    }

    fixRuntime(js) {
      js = js.replace(/require\("nqp-runtime"\)/g, this.requireNqp());
      return js;
    }
    
    async generate() {

      const config = await this.getConfig(['.rakudorc']);

      const options = {};

      options.sourceMap = this.options.sourceMaps;

      if (config && config.lib) {
        const dirs = config.lib.map(dir => path.isAbsolute(dir)
          ? dir
          : path.resolve(this.options.rootDir, dir));

        options.rakudoPrecompWith = dirs.map(dir => 'filerecording#' + dir).join(',');
      }

      let sourceMap;

      let compiled;
      try {
        compiled = rakudoLibrary.compile(this.name, options);
        sourceMap = compiled.sourceMap;
      } catch (e) {
        console.log('error', e);
        throw e;
      }

      let js = compiled.js;

      if (sourceMap) {
        sourceMap.sources = [this.relativeName];
        sourceMap.sourcesContent = [this.contents];

        js = stripSourceMappingUrl(js);
      }

      js = this.fixRuntime(js);

      /* HACKS */

      js = insertAfter(
          js,
          'var ctxWithPath = new nqp.Ctx(null, null, null);',
          '(/*await*/ nqp.op.loadbytecode(ctxWithPath,"Perl6-World"));'
              + 'nqp.op.bindhllsym("perl6","progname", new nqp.NQPStr(' + JSON.stringify(this.name) + '));'
              + '(/*await*/ nqp.op.loadbytecode(ctxWithPath,"load-compiler"));'
              + 'nqp.afterRun = {hll: "perl6", sym: "&THE_END"};'
              + 'nqp.op.bindhllsym("perl6","@END_PHASERS",nqp.list(nqp.getHLL("nqp"),[]));'
              + '/*await*/ loadedDuringCompile(nqp, ctxWithPath);'
      );

      const loadedJS = [];

      const paths = [];


      const loaded = {};

      for (const dep of compiled.loaded) {
        loaded[dep.id] = dep;
      }

      const seen = {};

      function dfs(id) {
        if (seen[id]) return;
        seen[id] = true;
        for (const dep of loaded[id].deps) {
          if (!loaded[dep]) {
            console.log('missing dep', dep);
          } else {
            dfs(dep);
          }
        }
        paths.push(loaded[id].path);
      }

      for (const id in loaded) {
        dfs(id);
      }

      for (const path of paths) {
          const compUnitWithJS = stripSourceMappingUrl(fs.readFileSync(path, 'utf8')).split(/\n/);
          let skip = 0;
          while (compUnitWithJS[skip] != '' && skip < compUnitWithJS.length) {
            skip++;
          }
          compUnitWithJS.splice(0, skip+1);

          const sourceMap = JSON.parse(fs.readFileSync(path + '.bc.map', 'utf8'));

          if (!sourceMap.sourcesContent) sourceMap.sourcesContent = [];

          for (let i = 0; i < sourceMap.sources.length; i++) {
            sourceMap.sourcesContent[i] = fs.readFileSync(sourceMap.sources[i].replace(/ \([^()]*\)$/, ''), 'utf8');
          }

          loadedJS.push({
            sourceMap: sourceMap,
            js: '/*await*/ nqp.loadCompileTimeDependency(function(module) {' + this.fixRuntime(compUnitWithJS.join('\n')) + '});'
          });
      }

      const prelude =
        '{' +
        'const nqp = ' + this.requireNqp() + ';' +
        'nqp.extraRuntime("perl6", "nqp-browser-runtime/perl6-runtime.nqp-raw-runtime");' +
        '};';

      js = 'require.main = module;' + js;

      const combinedSourceMap = new SourceMap();

      let loadAllDeps = prelude + '/*async*/ function loadedDuringCompile(nqp, $$outer) {\n';

      for (const dependency of loadedJS) {
          combinedSourceMap.addMap(
            dependency.sourceMap,
            lineCounter(loadAllDeps) - 1
          );
          loadAllDeps = loadAllDeps + dependency.js;
      }

      loadAllDeps = loadAllDeps + '}\n';

      combinedSourceMap.addMap(
        sourceMap,
        lineCounter(loadAllDeps) - 1
      );

      js = loadAllDeps + js;

      return {js: js, map: combinedSourceMap};
    }
};
module.exports.type = 'nqp';
