module.exports = function(grunt) {
	var pkg = require('../package.json');
	grunt.config.merge({
		clean: ['build/', 'dist/', pkg.config.distDir]
	});
};
