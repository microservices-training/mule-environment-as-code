// ===================================================================================
// === Author: Mohammad Aminul Haque @ MuleSoft                                    ===
// === Email: aminul.haque@mulesoft.com                                            ===
// === version: 0.1					                                               ===
// === Description: 					                                           ===
// ===  This script will manage all the deployment types	 					   ===
// ===================================================================================

//load libraries
const muleCommon = require('../common/mule-common');
const externalProp = require('../external-property-source/external-property-source');
const arm = require('./arm/deployment-arm');
const cloudhub = require('./cloudhub/deployment-cloudhub');


const deploymentMethods = [
    {name:"CloudHub", loadPropOps: externalProp.loadExternalPropertySource, callBackOps:cloudhub.deploy},
    {name:"OnPrem", loadPropOps: externalProp.loadExternalPropertySource, callBackOps: arm.deploy}
];


var filename = muleCommon.extractFilenameFromArguments();
var objConfig = muleCommon.parse_deployment_config_file(filename);

const ENV = objConfig.CloudHub.Env;
const ORGID = muleCommon.escapeWhiteSpaces(objConfig.CloudHub.BusinessGroup);
console.log("Deployment is running for environment: %s, Business Group: %s", ENV, ORGID);

// 'externalProperties' will have all the property from the external source.
var callback = function (externalProperties, application, eachMethod) {
    eachMethod.callBackOps(externalProperties, application, ENV, ORGID);
    console.log("--- Anypoint API: %s deployed/changed successfully", application.name);
};

for(var method in deploymentMethods) {
    var eachMethod = deploymentMethods[method];
    if(objConfig[eachMethod.name]) {
        console.log('--- Anypoint API for ' + eachMethod.name + ' deployment is being invoked');
        eachMethod.loadPropOps(objConfig[eachMethod.name], callback, eachMethod);
    }

}