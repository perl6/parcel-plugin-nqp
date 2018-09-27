const Asset = require('parcel-bundler/src/Asset');
module.exports = class NQPRawRuntimeAsset extends Asset {
    constructor(name, pkg, options) {
      super(name, pkg, options);
      this.type = 'js';
    }

    addDepsFromRegex(regex) {
      let matches = this.contents.match(new RegExp(regex, 'g'));
      if (matches !== null) {
        for (const statement of matches) {
          const dep = statement.match(regex)[1];
          this.addDependency('./' + dep);
        }
      }
    }

    async getDependencies() {
      this.addDepsFromRegex(/require\('\.\/(.+?\.json)'\)/);
      this.addDepsFromRegex(/require\('\.\/([0-9_A-Za-z-]+?\.nqp-raw-runtime)'\)/);

      this.addDepsFromRegex(/\/\* dependency \.\/([0-9_A-Za-z-]+?\.nqp-raw-runtime)\*\//);

      this.addDependency('nqp-browser-runtime/perl6-runtime.nqp-raw-runtime');

      let deps = {
        "bigint-is-prime": "^1.0.3",
        "char-props": "0.1.5",
        "escape-string-regexp": "^1.0.5",
        "fold-case": "^1.0.0",
        "node-int64": "^0.4.0",
        "nqp-js-ucd": "0.0.1",
        "nqp-unicode-data": "^2.0.0",
        "sha1": "^1.1.1",
        "shortid": "2.2.8",
        "source-map": "0.5.7",
        "source-map-resolve": "^0.5.1",
        "stack-trace": "0.0.10",
        "unicharadata": "*",
        "unicode-collation-algorithm": "0.0.3",
        "xorshift": "^1.1.0",
        "xregexp": "^3.2.0",
        "string_decoder": "^1.1.1",
        "buffer": "^0.11.10",
        "process": "^0.11.10"
      };

      for (const dep in deps) {
        this.addDependency(dep);
      }
    }
    
    async generate() {
      await this.loadIfNeeded();
      return {
        'js': this.contents
      };
    }
};
