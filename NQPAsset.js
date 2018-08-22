const Asset = require('parcel-bundler/src/Asset');

const nqpRuntimePath = 'nqp-browser-runtime';
const nqpLibrary = require('nqp-js-on-js/nqp-library.js');

module.exports = class NQPAsset extends Asset {
    async getDependencies() {
      this.addDependency(nqpRuntimePath + '/runtime.nqp-raw-runtime');
      this.addDependency(nqpRuntimePath + '/ModuleLoader.nqp-raw-runtime');
    }

    constructor(name, options) {
      console.log("creating asset", name);
      super(name, options);
      this.type = 'js';
    }
    
    async generate() {
      const js = nqpLibrary(this.name);

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
