// ===================================================================================
// === Author: Igor Repka @ MuleSoft                                               ===
// === Email: igor.repka@mulesoft.com                                              ===
// === version: 0.1					                                               ===
// === Description: 					                                           ===
//     Common functionality for environment management and application deployment. ===
// ===================================================================================

const exec = require('child_process').execSync; //Child process for calling anypoint-cli
const yaml = require('js-yaml');
const fs = require('fs');
const util = require('util');
const PROPERTIES_FOLDER = "app_properties/";
const PACKAGE_FOLDER = "packages/";

var supportedRepositoryType = {
    MAVEN: {text: "maven", ops: downloadPackage_maven},
    NUGET: {text: "nuget", ops: null},
    NPM: {text: "npm", ops:null},
    BOWER: {text: "bower", ops:null},
    RAW: {text: "raw", ops:downloadPackage_raw}
};

/*
 * Returns relative path to application properties for application passed as an input
 */
function get_property_file_path(app) {
	return PROPERTIES_FOLDER+app.name+"/"+app.properties;
}

/*
 * Exception handling
 */
function handle_error(e, message) {
	var msg = typeof message != 'undefined' ? message : "";
	console.error("Unknown error: " + msg + "\n" + e);
	console.log("Unknown error - stderr: " + e.stderr);
	console.log("Unknown error - stdout: " + e.stdout);
	process.exit(-1);
}

/*
 * Function parses deployment descriptor config file.
 * Object with config details is returned.
 */
function parse_deployment_config_file(filename) {
	try {
    	const config = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
    	const indentedJson = JSON.stringify(config, null, 4);
    	console.log(indentedJson);
    	return JSON.parse(indentedJson);
	} catch (e) {
    	muleCommon.handle_error(e, "Unable to read the config file. Please have a look into the deployment descriptor.");
	}
}



function downloadPackage(app, execSync) {
     var ops = getArtefactRepositoryOps(app.repoType);
     if(ops) {
        ops(app, execSync);
     }
}

/*
 * Downloads the package of application from provided repository
 */
function downloadPackage_raw(app, execSync) {
    var filename = app.packageName;
    var repoEndpoint = app.repo_endpoint;

	console.log("Downloading the package for: " + filename);
	var command = util.format('curl -Lk --create-dirs -o %s%s ' +
		'%s%s', PACKAGE_FOLDER, filename, repoEndpoint, filename);
	console.log("Command is being executed: " + command);
	try {
		execSync(command);
	} catch (e) {
		handle_error(e, "Package downloading failed.");
	}
}

/*
 * Downloads the package of application from provided repository
 */
function downloadPackage_maven(app, execSync) {
    console.log("Downloading the package for: " + app.packageName);

	var groupId = app.groupId;
    var artifactId = app.artifactId;
    var version = app.version;
    var packageType = app.packageType;
    var pkg = app.packageName;
    var repo = app.repo_endpoint;

	var command = util.format("mvn dependency:get -DrepoUrl=%s -Dartifact=%s:%s:%s:%s -Dtransitive=false -Ddest=%s%s",
	                                repo, groupId, artifactId, version, packageType, PACKAGE_FOLDER, pkg);
	console.log("Command is being executed: " + command);
	try {
		execSync(command);
	} catch (e) {
		handle_error(e, "Package downloading failed.");
	}
}

/*
 * Extract the file name of deployment configuration passed as argument
 */
function extractFilenameFromArguments() {
	var filename = process.argv[2];
	if(filename) {
		console.log('File contains all deployment config properties: ' + filename);
		return filename;
	} else {
	    handle_error(e, "ERROR: File argument is misssing!");
	}
}

/*
 * Returns the string with escaped white space
 */
function escapeWhiteSpaces(txt) {
	return txt.replace(/ /g, '\\ ');
}

/*
    This function will return the right artefact download operation based on artefact type
*/

function getArtefactRepositoryOps(repoType) {

    var found  = Object.keys(supportedRepositoryType).filter(function(item) {
      return repoType && supportedRepositoryType[item].text == repoType;
    });

    if(found && found.length > 0) {
        if(supportedRepositoryType[found[0]].ops) {
            console.log("INFO: Artefact Repository type is "+supportedRepositoryType[found[0]].text);
            return supportedRepositoryType[found[0]].ops;
        }

    }
    console.log("ERROR: Artefact Repository type NOT supported.");
    return null;
}

/*
 * Functionality exported by this module
 */
module.exports.get_property_file_path 		= get_property_file_path;
module.exports.handle_error			  		= handle_error;
module.exports.parse_deployment_config_file = parse_deployment_config_file;
module.exports.downloadPackage 				= downloadPackage;
module.exports.extractFilenameFromArguments = extractFilenameFromArguments;
module.exports.PACKAGE_FOLDER				= PACKAGE_FOLDER;
module.exports.escapeWhiteSpaces			= escapeWhiteSpaces;

module.exports.fs = fs;
module.exports.util = util;
module.exports.exec = exec;