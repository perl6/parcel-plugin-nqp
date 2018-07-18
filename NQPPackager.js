const Packager = require('parcel-bundler/src/packagers/Packager');
const fs = require('fs');
module.exports = class NQPPackager extends Packager {
    async start() {
      await this.dest.write('/* start of bundle */\n');
    }

    prelude() {
      return fs.readFileSync('prelude.js', 'utf8');
    }

    async addAsset(asset) {

      let contents = asset.generated[this.bundle.type];
      if (!contents || (contents && contents.path)) {
        contents = await fs.readFile(contents ? contents.path : asset.name);
      }

      const {spawnSync} = require('child_process');
      const out = spawnSync('node', ['--harmony-bigint', '/home/pmurias/nqp/nqp-js-on-js/nqp-bootstrapped.js', '--setting=NULL', '--target=js', asset.name]);
      const js = out.stdout.toString('utf8');

      const prelude = fs.readFileSync(require.resolve('parcel-bundler/src/builtins/prelude.js'), 'utf8').trim();

      const files = ['runtime.js'];

      const idMap = {};
      let id = 2;
      for (const file of files) {
        idMap['./' + file] = id++;
      }

      idMap['nqp-runtime'] = idMap['./runtime.js'];
  
      const idMapJSON = JSON.stringify(idMap);


      await this.dest.write(prelude);
      await this.dest.write('({');
      for (const file of files) {
        await this.dest.write(idMap['./' + file] + ': [function(require,module,exports) {');
        await this.dest.write(`console.log('loading ${file}');`);
        await this.dest.write('},' + idMapJSON + '],');
      }

      await this.dest.write('1: [function(require,module,exports) {');
      await this.dest.write(js);
      await this.dest.write('},' + idMapJSON + ']');

      await this.dest.write('}, {}, [1], null);');
    }  

    async end() {
      await this.dest.end('/* end of bundle */\n');
    }
};
