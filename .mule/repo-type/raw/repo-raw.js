const muleCommon = require('./../../common/mule-common');

/*
 * Downloads the package of application from provided repository
 */
function downloadPackage(app, execSync) {
    var filename = app.packageName;
    var repoEndpoint = app.repo_endpoint;

	console.log("Downloading the package for: " + filename);
	var command = muleCommon.util.format('curl -Lk --create-dirs -o %s%s ' +
		'%s%s', muleCommon.PACKAGE_FOLDER, filename, repoEndpoint, filename);
	console.log("Command is being executed: " + command);
	try {
		execSync(command);
	} catch (e) {
		muleCommon.handle_error(e, "Package downloading failed.");
	}
}

module.exports.downloadPackage			  		= downloadPackage;