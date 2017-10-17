const muleCommon = require('./../../common/mule-common');

/*
 * Downloads the package of application from provided repository
 */
function downloadPackage(app, execSync) {
    console.log("Downloading the package for: " + app.packageName);

	var groupId = app.groupId? app.groupId : "";
    var artifactId = app.artifactId? app.artifactId : "";
    var version = app.version? app.version : "";
    var packageType = app.packageType? app.packageType : "";
    var pkg = app.packageName? app.packageName : "";
    var repo = app.repo_endpoint? app.repo_endpoint : "";

	var command = muleCommon.util.format("mvn dependency:get -DrepoUrl=%s -Dartifact=%s:%s:%s:%s -Dtransitive=false -Ddest=%s%s",
	                                repo, groupId, artifactId, version, packageType, muleCommon.PACKAGE_FOLDER, pkg);
	console.log("Command is being executed: " + command);
	try {
		execSync(command);
	} catch (e) {
		muleCommon.handle_error(e, "Package downloading failed.");
	}
}

module.exports.downloadPackage			  		= downloadPackage;