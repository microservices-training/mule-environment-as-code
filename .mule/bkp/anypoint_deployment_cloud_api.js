// ===================================================================================
// === Author: Igor Repka @ MuleSoft                                               ===
// === Email: igor.repka@mulesoft.com                                              ===
// === version: 0.1					                                               ===
// === Description: 					                                           ===
//     Script manages CloudHub deployment of applications configured in deployment ===
//     descriptor configuration file.	 										   ===
// ===================================================================================

console.log('--- Anypoint API is being invoked');

//load libraries
const muleCommon = require('./mule_common');

var filename = muleCommon.extractFilenameFromArguments();
var objConfig = muleCommon.parse_deployment_config_file(filename);

if(!objConfig.CloudHub) {
	console.log('--- Anypoint API: **No** CloudHub config found. Done');
	process.exit();
}

const staticIPsEnabledValueTrans = {
    "Enable": true,
    "Disabled": false
};

const trueFalse = {
    "true": true,
    "false": false
};

const ENV = objConfig.CloudHub.Env;
const ORGID = muleCommon.escapeWhiteSpaces(objConfig.CloudHub.BusinessGroup);
console.log("Deployment is running for environment: %s, Business Group: %s", ENV, ORGID);

// 'entries' will have all the property from the external source.
var callback = function (externalProperties, application) {
    deploy(externalProperties, application);
    console.log("--- Anypoint API: %s deployed/changed successfully", application.name);
};
muleCommon.loadExternalPropertySource(objConfig.CloudHub, callback);

// ====================================
// === function declaration section ===
// ====================================

/*
 * Main function for deployment logic.
 * Deploys or redeploys application on CloudHub
 */
function deploy(externalProperties, application) {
	console.log("\u001b[33m### Running deployment of application\u001b[39m: " + application.name);
	var cloudAppDetails = get_application_details(application.name, muleCommon.exec);
	
	if(cloudAppDetails == null) { //trigger new application deployment
		console.log("Deploying: " + application.name);
		deploy_new_application(application, muleCommon.exec, externalProperties);
	} else if(is_application_update_required(application, cloudAppDetails, externalProperties)) { //redeploy or modify application
		console.log("Updating: " + application.name);
		redeploy_or_modify_application(application, muleCommon.exec, cloudAppDetails, externalProperties);
	} else {
		console.log("Application does NOT require any updates " +
			"- the version on the CloudHub is the same as info available in deployment descriptor file: " +
			filename);
	}
	console.log("\u001b[33m### Application deployment logic has finished successfully\u001b[39m: " + application.name);
}

/*
 * Function returns application details from CloudHub. 
 * If this is the first deployment of application null is returned.
 */
function get_application_details(appName, execSync) {
	var command = muleCommon.util.format('anypoint-cli ' + 
			'--username=$anypoint_username --password=$anypoint_password ' + 
			'--environment=%s ' +
			'--organization=%s ' +
			'--output json ' +
			'runtime-mgr cloudhub-application describe-json %s', ENV, ORGID, appName);

	try {
		var result = execSync(command);
		//console.log("Application details returned from CloudHub: " + result);

        //hack has to be implemented because response from anypoint-cli 'runtime-mgr cloudhub-application describe-json' is not a valid JSON.
		result = result+"";
		result = result.replace(/\s/g, ""); 			//remove all white spaces
		result = result.replace(/'/g, "\""); 			//replace all ' by "
		result = result.replace(/:/g, "\":");			//replace all : by ":
		result = result.replace(/{(?:(?!}))/g, "{\"");  //replace {(?:(?!})) by {"
		result = result.replace(/,(?:(?!{))/g, ",\"");  //replace all ,(?:(?!{)) by ,"  -- all , that does not continue with {
		result = result.replace(/\u001b\[32m/g, "");	//remove ansi escape sequence \u001b[32m
		result = result.replace(/\u001b\[33m/g, "");	//remove ansi escape sequence \u001b[39m
		result = result.replace(/\u001b\[39m/g, "");	//remove ansi escape sequence \u001b[33m
		result = result.replace(/\"\"/g, "\"");			//replace "" by "

		console.log("JSON prepared: " + result);

		return JSON.parse(result);
	} catch (e) {
		const appNotFoundPattern = 'Error: No application with domain ' + appName + ' found.\n';
		var tmpStdOut = e.stdout+"";

		if(appNotFoundPattern == tmpStdOut) { //Application Not Found Error triggers a fresh deployment of new application
			console.log("The deployment is running for the application that has not been deployed.");
			return null;
		} else { //unknown error
			muleCommon.handle_error(e);
		}
	}
}



/*
 * Function checks if there are any changes that would require application update.
 * Function compares details in deployment descriptor with details obtained from CloudHub.
 */
function is_application_update_required(app, cloudAppDetails, externalProperties) {
	const workerSize = cloudAppDetails.workers.type.weight;
	const numberOfWorkers = cloudAppDetails.workers.amount;
	const runtime = cloudAppDetails.muleVersion.version;
	const region = cloudAppDetails.region;
	const properties = cloudAppDetails.properties;
	const filename = cloudAppDetails.fileName;
	const staticIPsEnabled = cloudAppDetails.staticIPsEnabled;
	const persistentQueues = cloudAppDetails.persistentQueues;
	const persistentQueuesEncrypted = cloudAppDetails.persistentQueuesEncrypted;


	//compare properties
    const propertiesFile = muleCommon.get_property_file_path(app);
    try {
        //check if properties file exists in repo and if properties exit on CloudHub
        if (!muleCommon.fs.existsSync(propertiesFile) && properties != null && typeof properties != 'undefined') {
            console.log("Properties file has not been found! Properties will NOT be updated despite there are properties " +
                "detected on CloudHub.");
            return false;
        }

        var propertiesData = muleCommon.fs.readFileSync(propertiesFile, 'utf8');
        if(propertiesData != null && propertiesData != "") {
            var propertiesArray = propertiesData.split("\n");
            // Append the external properties with the file properties
            for(var eachProperty in propertiesArray) {
                var keyValue = propertiesArray[eachProperty];
                 if(keyValue) {
                    var items = keyValue.split(":");
                    externalProperties[items[0]] = items[1];
                 }
            }

            //compare data in property file in repo with properties currently set up on CloudHub
            for(var eachProperty in externalProperties) {
                if(properties[eachProperty] != externalProperties[eachProperty]) {
                    console.log("Difference in properties detected!");
                    return true;
                }
            }

        } else {
            console.log("Property file: %s is empty.", propertiesFile);
        }
    } catch(e) {
        muleCommon.handle_error(e, "Enable to ready property file for application: " + app.name);
    }

	//instead of comparing version the file name is compared with package name configured in deployment descriptor
	//this can be done because the version is part of the package / file name.
	if(app["packageName"] &&
	                app["packageName"] != filename) {
		console.log("Difference in application version detected!");
		return true;
	}
	if(app["worker-size"] &&
	                app["worker-size"] != workerSize) {
		console.log("Difference in Worker size detected!");
		return true;
	}
	if(app["num-of-workers"] &&
	                app["num-of-workers"] != numberOfWorkers) {
		console.log("Difference in number of Workers detected!");
		return true;	
	}
	if(app["runtime"] &&
	                app["runtime"] != runtime) {
		console.log("Difference in runtime detected!");
		return true;
	}
	if(app["region"] &&
	                app["region"] != region) {
		console.log("Difference in region detected!");
		return true;
	}

    if( staticIPsEnabledValueTrans[app["staticIPsEnabled"]] &&
                    staticIPsEnabledValueTrans[app["staticIPsEnabled"]] != staticIPsEnabled) {
        console.log("Difference in staticIPsEnabled detected!");
        return true;
    }

    console.log("staticIPsEnabledValueTrans[app[staticIPsEnabled]]=>"+staticIPsEnabledValueTrans[app["staticIPsEnabled"]]);
    console.log("staticIPsEnabled=>"+staticIPsEnabled);

    if(app["persistentQueues"] &&
                    trueFalse[app["persistentQueues"]] != persistentQueues) {
        console.log("Difference in persistentQueues detected!");
        return true;
    }

    if(app["persistentQueuesEncrypted"] &&
                    trueFalse[app["persistentQueuesEncrypted"]] != trueFalse[persistentQueuesEncrypted]) {
        console.log("Difference in persistentQueuesEncrypted detected!");
        return true;
    }

	return false;
}

/*
 * Function deploys new application on CloudHub
 */
function deploy_new_application(app, execSync, externalProperties) {
	muleCommon.downloadPackage(app, muleCommon.exec);

    const staticIPsEnabled = app["staticIPsEnabled"]? app["staticIPsEnabled"] : "Disabled";
    const persistentQueues = app["persistentQueues"]? app["persistentQueues"] : "false";
    const persistentQueuesEncrypted = app["persistentQueuesEncrypted"]? app["persistentQueuesEncrypted"] : "false";

	var command = muleCommon.util.format(
		'anypoint-cli ' + 
			'--username=$anypoint_username --password=$anypoint_password ' + 
			'--environment=%s ' +
			'--organization=%s ' +
			//'--output json ' +
			'runtime-mgr cloudhub-application deploy %s %s%s ' + 
			'--workers %s --workerSize %s --region %s --runtime %s --staticIPsEnabled %s --persistentQueues %s --persistentQueuesEncrypted %s',
			ENV, ORGID, app["name"], muleCommon.PACKAGE_FOLDER, app["packageName"], app["num-of-workers"], app["worker-size"],
			app["region"], app["runtime"], staticIPsEnabled, persistentQueues, persistentQueuesEncrypted);

    if(app.propertyKeys.length > 0  && !muleCommon.isEmptyObject(externalProperties)) {
        command = command + " " + muleCommon.composePropertyParams(externalProperties) + " ";
    }

	//if properties file exists attach it to the command to update CloudHub
	if(muleCommon.fs.existsSync(muleCommon.get_property_file_path(app))) {
		command = muleCommon.util.format(command + " --propertiesFile %s", muleCommon.get_property_file_path(app));
	}

	try {
		console.log("Running anypint-cli command=>"+command);
		var result = execSync(command);
	} catch (e) {
		muleCommon.handle_error(e, "Cannot deploy new application: " + app.name);
	}
}

/*
 * Modifies / redeploys the application on CloudHub
 */
function redeploy_or_modify_application(app, execSync, cloudAppDetails, externalProperties) {
	muleCommon.downloadPackage(app, muleCommon.exec);

	const staticIPsEnabled = app["staticIPsEnabled"]? app["staticIPsEnabled"] : cloudAppDetails.staticIPsEnabled;
	const persistentQueues = app["persistentQueues"]? app["persistentQueues"] : cloudAppDetails.persistentQueues;
	const persistentQueuesEncrypted = app["persistentQueuesEncrypted"]? app["persistentQueuesEncrypted"] : cloudAppDetails.persistentQueuesEncrypted;

	var command = muleCommon.util.format(
		'anypoint-cli ' + 
			'--username=$anypoint_username --password=$anypoint_password ' + 
			'--environment=%s ' +
			'--organization=%s ' +
			//'--output json ' +
			'runtime-mgr cloudhub-application modify %s %s%s ' +
			'--workers %s --workerSize %s --region %s --runtime %s --staticIPsEnabled %s --persistentQueues %s --persistentQueuesEncrypted %s',
			ENV, ORGID, app["name"], muleCommon.PACKAGE_FOLDER, app["packageName"], app["num-of-workers"], app["worker-size"],
			app["region"], app["runtime"], staticIPsEnabled, persistentQueues, persistentQueuesEncrypted);

    if(app.propertyKeys.length > 0  && !muleCommon.isEmptyObject(externalProperties)) {
        command = command + " " + muleCommon.composePropertyParams(externalProperties) + " ";
    }
	    //if properties file exists attach it to the command to update CloudHub
	else if(muleCommon.fs.existsSync(muleCommon.get_property_file_path(app))) {
		command = muleCommon.util.format(command + " --propertiesFile %s", muleCommon.get_property_file_path(app));
	}

	try {
		console.log("Running anypint-cli command=>"+command);
		var result = execSync(command);

	} catch (e) {
		muleCommon.handle_error(e, "Cannot update the application: " + app.name);
	}
}