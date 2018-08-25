'use strict';
const Asset = require('parcel-bundler/src/Asset');
const fs = require('fs');
const nqpRuntimePath = 'nqp-browser-runtime';

function insertAfter(whole, where, what) {
    return whole.replace(where, where + what);
}

module.exports = class Perl6Asset extends Asset {
    async getDependencies() {
      this.addDependency(nqpRuntimePath + '/runtime.nqp-raw-runtime');
    }

    constructor(name, options) {
      super(name, options);
      this.type = 'js';
    }
    
    async generate() {
      const {spawnSync} = require('child_process');
      const out = spawnSync('node', ['/home/pmurias/rakudo/rakudo.js', '--target=js', this.name]);
      let js = out.stdout.toString('utf8');

      js = js.replace(/require\("nqp-runtime"\)/g, `require('${nqpRuntimePath}/runtime.nqp-raw-runtime')`);

      /* HACKS */

      js = insertAfter(
          js,
          'const HLL=nqp.getHLL("perl6");', 
          'nqp.extraRuntime("perl6", "nqp-browser-runtime/perl6-runtime.nqp-raw-runtime");');

      js = insertAfter(
          js,
          'var ctxWithPath = new nqp.Ctx(null, null, null);',
          '(/*await*/ nqp.op.loadbytecode(ctxWithPath,"Perl6-World"));'
              + 'ctxWithPath["%*COMPILING"] = nqp.hash();'
              + 'ctxWithPath["%*COMPILING"].content.set("%?OPTIONS", nqp.hash());'
              + 'nqp.op.bindhllsym("perl6","@END_PHASERS",nqp.list(nqp.getHLL("nqp"),[]));');

      return {
        'js': js
      };
    }

};
module.exports.type = 'nqp';
