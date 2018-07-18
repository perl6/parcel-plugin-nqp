module.exports = function(bundler) {
  bundler.addAssetType('nqp', require.resolve('./NQPAsset'));
  bundler.addAssetType('nqp-raw-runtime', require.resolve('./NQPRawRuntimeAsset'));
};
