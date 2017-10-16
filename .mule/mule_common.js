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

const path = require('path');
const kpio = require('keepass.io');

const PROPERTIES_FOLDER = "app_properties/";
const PACKAGE_FOLDER = "packages/";

const supportedRepositoryType = {
    MAVEN: {text: "maven", ops: downloadPackage_maven},
    NUGET: {text: "nuget", ops: null},
    NPM: {text: "npm", ops:null},
    BOWER: {text: "bower", ops:null},
    RAW: {text: "raw", ops:downloadPackage_raw}
};

const supportedExternalPropertySources = {
    KEEPASS: {text: "keepass", ops: loadKeePassFile}
};

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

	var groupId = app.groupId? app.groupId : "";
    var artifactId = app.artifactId? app.artifactId : "";
    var version = app.version? app.version : "";
    var packageType = app.packageType? app.packageType : "";
    var pkg = app.packageName? app.packageName : "";
    var repo = app.repo_endpoint? app.repo_endpoint : "";

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

function loadExternalPropertySource(deploymentType, callBack) {
        var found  = Object.keys(supportedExternalPropertySources).filter(function(item) {
          return deploymentType.ExternalPropertySource && supportedExternalPropertySources[item].text == deploymentType.ExternalPropertySource;
        });

        if(found && found.length > 0) {
            if(supportedExternalPropertySources[found[0]].ops) {
                console.log("INFO: Artefact Repository type is "+supportedExternalPropertySources[found[0]].text);
                supportedExternalPropertySources[found[0]].ops(deploymentType.Applications, callBack);
                return true;
            }
        }
        console.log("ERROR: External Property Source is NOT supported.");
        return false;
}

function loadKeePassFile(applications, callBack) {
    // Detect some needed paths
    var databasePath = path.join(__dirname,'..','app_properties','keepass',process.env.keePassFileName);
    var keyFileName = path.join(__dirname,'..','app_properties','keepass',process.env.keyFileName);

    var db = new kpio.Database();
    db.addCredential(new kpio.Credentials.Password(process.env.masterPassword));
    //db.addCredential(new kpio.Credentials.Keyfile(keyFileName));
    db.loadFile(databasePath, function(err) {
        if(err) throw err;
        var entries = db.getRawApi().get().KeePassFile.Root.Group.Entry;
        //run deployment logic for every application in config file
        for (var eachApp in applications) {
            var app = applications[eachApp];
            var externalProperties = findProperty(app.propertyKeys, entries);
            callBack(externalProperties, app);

        }
        console.log('--- Anypoint API: all the changes have been applied successfully');

    });
}

function findProperty(propertyFilters, entries) {
    var consolidateProperty = {};
    for(var eachEntry in entries) {
        for(var eachFilterKey in propertyFilters) {
            var eachPropertyFilter = propertyFilters[eachFilterKey];
            var found = false;
            var value = null;
            var Strings = entries[eachEntry].String;

            for(var eachString in Strings) {
                entry = Strings[eachString];
                if(entry.Key == "Title") {
                  if(entry.Value == eachPropertyFilter['keypass_entrytitle']) {
                      found = true;
                  }
                }
                else if(entry.Key == eachPropertyFilter['keypass_entryfield']) {
                    value = entry.Value;
                    if(entry.Key == "Password") {
                        value = entry.Value["_"]? entry.Value["_"] : null;
                    }
                    else if(entry.Key == "URL") {
                        value = entry.Value? entry.Value.replace('http:', '').replace('https:', '') : null;
                    }
                }
            }
            if(found) {
              if(value) consolidateProperty[eachPropertyFilter['mulefield']] = value;
            }
        }
    }
    return consolidateProperty;
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
module.exports.downloadPackage 				= downloadPackage;
module.exports.extractFilenameFromArguments = extractFilenameFromArguments;
module.exports.PACKAGE_FOLDER				= PACKAGE_FOLDER;
module.exports.escapeWhiteSpaces			= escapeWhiteSpaces;
module.exports.loadKeePassFile 		= loadKeePassFile;
module.exports.findProperty			  		= findProperty;
module.exports.composePropertyParams			  		= composePropertyParams;
module.exports.extend			  		= extend;
module.exports.loadExternalPropertySource			  		= loadExternalPropertySource;
module.exports.isEmptyObject			  		= isEmptyObject;


module.exports.fs = fs;
module.exports.util = util;
module.exports.exec = exec;