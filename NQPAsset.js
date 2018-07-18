const Asset = require('parcel-bundler/src/Asset');

const nqpRuntimePath = 'nqp-browser-runtime';

module.exports = class NQPAsset extends Asset {
    async getDependencies() {
      this.addDependency(nqpRuntimePath + '/runtime.nqp-raw-runtime');
      this.addDependency(nqpRuntimePath + '/ModuleLoader.nqp-raw-runtime');
    }

    constructor(name, pkg, options) {
      console.log("creating asset", name);
      super(name, pkg, options);
      this.type = 'js';
    }
    
    async generate() {
      const {spawnSync} = require('child_process');
      const out = spawnSync('node', ['/home/pmurias/nqp/nqp-js-on-js/nqp-bootstrapped.js', '--target=js', this.name]);
      let js = out.stdout.toString('utf8');

      // TODO - avoid mangling strings
      js = js.replace(/require\("nqp-runtime"\)/g, `require('${nqpRuntimePath}/runtime.nqp-raw-runtime')`);

      if (out.error) console.log('error:', error);
      console.log(out.stderr.toString('utf8'));

      js = '__filename = "Mock filename.js";\n' + js;
      return {
        'js': js
      };
    }

};
module.exports.type = 'nqp';
