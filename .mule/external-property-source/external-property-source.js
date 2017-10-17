const keepass = require('./keepass/property-source-keepass');

const supportedExternalPropertySources = {
    KEEPASS: {text: "keepass", ops: keepass.loadKeePassFile}
};

function loadExternalPropertySource(deploymentType, callBack, eachMethod) {
        console.log("loadExternalPropertySource");
        var found  = Object.keys(supportedExternalPropertySources).filter(function(item) {
          return deploymentType.ExternalPropertySource && supportedExternalPropertySources[item].text == deploymentType.ExternalPropertySource;
        });

        if(found && found.length > 0) {
            if(supportedExternalPropertySources[found[0]].ops) {
                console.log("INFO: Artefact Repository type is "+supportedExternalPropertySources[found[0]].text);
                supportedExternalPropertySources[found[0]].ops(deploymentType.Applications, callBack, eachMethod);
                return true;
            }
        }
        console.log("ERROR: External Property Source is NOT supported.");
        return false;
}


module.exports.loadExternalPropertySource			  		= loadExternalPropertySource;