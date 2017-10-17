const exec = require('child_process').execSync; //Child process for calling anypoint-cli
const yaml = require('js-yaml');
const fs = require('fs');
const util = require('util');
const path = require('path');

const PROPERTIES_FOLDER = "app_properties/";
const PACKAGE_FOLDER = "packages/";

/*
    Below function will merge two objects into the 'origin' and will return that
*/
function extend(origin, add) {
    if (!add || (typeof add !== 'object' && add !== null)){
        return origin;
    }

    var keys = Object.keys(add);
    var i = keys.length;
    while(i--){
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
}

/*
 * Returns relative path to application properties for application passed as an input
 */
function get_property_file_path(app) {
	return PROPERTIES_FOLDER + app.name + "/" + app.properties;
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
    	handle_error(e, "Unable to read the config file. Please have a look into the deployment descriptor.");
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


function composePropertyParams(keepassData) {
    var propStr = "";
    for(var eachProp in keepassData) {
        var keyValue = '"' + escape(eachProp) + ":" + escape(keepassData[eachProp]) + '"';
        propStr = propStr + " --property " + keyValue;
    }

    return propStr;
}

function escape(str) {
    if(str) {
        return str.replace(':','\:').replace('=','\=');
    }
    return str;
}

function isEmptyObject(obj) {
  return obj== null || !Object.keys(obj).length;
}

/*
 * Functionality exported by this module
 */
module.exports.get_property_file_path 		= get_property_file_path;
module.exports.handle_error			  		= handle_error;
module.exports.parse_deployment_config_file = parse_deployment_config_file;
module.exports.extractFilenameFromArguments = extractFilenameFromArguments;
module.exports.PACKAGE_FOLDER				= PACKAGE_FOLDER;
module.exports.PROPERTIES_FOLDER				= PROPERTIES_FOLDER;
module.exports.escapeWhiteSpaces			= escapeWhiteSpaces;
module.exports.composePropertyParams			  		= composePropertyParams;
module.exports.extend			  		= extend;
module.exports.isEmptyObject			  		= isEmptyObject;


module.exports.fs = fs;
module.exports.util = util;
module.exports.exec = exec;
module.exports.path = path;