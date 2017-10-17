const raw = require('./raw/repo-raw');
const maven = require('./maven/repo-maven');

const supportedRepositoryType = {
    MAVEN: {text: "maven", ops: maven.downloadPackage},
    NUGET: {text: "nuget", ops: null},
    NPM: {text: "npm", ops:null},
    BOWER: {text: "bower", ops:null},
    RAW: {text: "raw", ops: raw.downloadPackage}
};

function downloadPackage(app, execSync) {
     var ops = getArtefactRepositoryOps(app.repoType);
     if(ops) {
        ops(app, execSync);
     }
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


module.exports.downloadPackage			  		= downloadPackage;