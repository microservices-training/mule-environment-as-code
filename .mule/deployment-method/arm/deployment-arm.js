// ===================================================================================
// === Author: Igor Repka @ MuleSoft                                               ===
// === Email: igor.repka@mulesoft.com                                              ===
// === version: 0.1					                                               ===
// === Description: 					                                           ===
//     Script manages On-Prem deployment via Runtime Manager of applications       ===
//     configured in deployment descriptor configuration file.	 				   ===
// ===================================================================================

//load libraries
const muleCommon = require('./../../common/mule-common');


// ====================================
// === function declaration section ===
// ====================================

/*
 * Main function for deployment logic.
 * Deploys or redeploys application on On-Prem server
 */
function deploy(keepasses, application, ENV, ORGID) {

	console.log("\u001b[33m### Running deployment of application\u001b[39m: " + application.name);
	var cloudAppDetails = get_application_details(application.name, muleCommon.exec);

	if(cloudAppDetails == null) { //trigger new application deployment
		console.log("Deploying: " + application.name);
		deploy_new_application(application, muleCommon.exec, ENV, ORGID);
	} else {
		console.log("Updating: " + application.name);
		redeploy_or_modify_application(application, muleCommon.exec, ENV, ORGID);
	}
	console.log("\u001b[33m### Application deployment logic has finished successfully\u001b[39m: " + application.name);
}

/*
 * Function returns application details from On-Prem.
 * If this is the first deployment of application null is returned.
 */
function get_application_details(appName, execSync, ENV, ORGID) {
	var command = muleCommon.util.format('anypoint-cli ' +
			'--username=$anypoint_username --password=$anypoint_password ' +
			'--environment=%s ' +
			'--organization=%s ' +
			'--output json ' +
			'runtime-mgr standalone-application describe-json %s', ENV, ORGID, appName);

	try {
		var result = execSync(command);
		console.log("Application details returned from CloudHub: " + result);

		return result;
	} catch (e) {
		const appNotFoundPattern = 'Error: Application identified by "' + appName + '" not found\n';
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
 * Function deploys new application on On-Prem
 */
function deploy_new_application(app, execSync, ENV, ORGID) {
	muleCommon.downloadPackage(app, muleCommon.exec);

	var command = muleCommon.util.format(
		'anypoint-cli ' +
			'--username=$anypoint_username --password=$anypoint_password ' +
			'--environment=%s ' +
			'--organization=%s ' +
			//'--output json ' +
			'runtime-mgr standalone-application deploy %s %s %s%s',
			ENV, ORGID, app.target, app.name, muleCommon.PACKAGE_FOLDER, app.packageName);

	try {
		var result = execSync(command);
	} catch (e) {
		muleCommon.handle_error(e, "Cannot deploy new application: " + app.name);
		process.exit(-1);
	}
}

/*
 * Modifies / redeploys the application on On-Prem
 */
function redeploy_or_modify_application(app, execSync, ENV, ORGID) {
	muleCommon.downloadPackage(app, muleCommon.exec);

	var command = muleCommon.util.format(
		'anypoint-cli ' +
			'--username=$anypoint_username --password=$anypoint_password ' +
			'--environment=%s ' +
			'--organization=%s ' +
			//'--output json ' +
			'runtime-mgr standalone-application modify %s %s%s',
			ENV, ORGID, app.name, muleCommon.PACKAGE_FOLDER, app.packageName);

	try {
		var result = execSync(command);
	} catch (e) {
		muleCommon.handle_error(e, "Cannot update the application: " + app.name);
		process.exit(-1);
	}
}

module.exports.deploy			  		= deploy;