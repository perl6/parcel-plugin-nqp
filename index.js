module.exports = function(bundler) {
  bundler.addAssetType('nqp', require.resolve('./NQPAsset'));
  bundler.addAssetType('t', require.resolve('./Perl6Asset'));
  bundler.addAssetType('p6', require.resolve('./Perl6Asset'));
  bundler.addAssetType('nqp-raw-runtime', require.resolve('./NQPRawRuntimeAsset'));
};
