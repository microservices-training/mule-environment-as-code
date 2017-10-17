// ===================================================================================
// === Author: Mohammad Aminul Haque @ MuleSoft                                    ===
// === Email: aminul.haque@mulesoft.com                                            ===
// === version: 0.1					                                               ===
// === Description: 					                                           ===
//     Implement the KeePass integration functionality                             ===
// ===================================================================================

const muleCommon = require('./../../common/mule-common');

const kdbxweb = require('kdbxweb');
const argon2 = require('./kdbxweb/argon2');



function loadKeePassFile(applications, callBack, eachMethod) {
    // Detect some needed paths
    var keePassFile = muleCommon.path.join(__dirname,'..','..','..','app_properties','keepass',process.env.keePassFileName);
    var keyFileName = muleCommon.path.join(__dirname,'..','..','..','app_properties','keepass',process.env.keyFileName);

    kdbxweb.CryptoEngine.argon2 = argon2;

    var keyFileArrayBuffer = null;
    let credentials = new kdbxweb.Credentials(
        kdbxweb.ProtectedValue.fromString(process.env.masterPassword), keyFileArrayBuffer);

    var keePassFileAsArryBuffer = muleCommon.fs.readFileSync(keePassFile, null).buffer;

    kdbxweb.Kdbx.load(keePassFileAsArryBuffer, credentials).then (db => {
        const entries = db.getDefaultGroup();

        //run deployment logic for every application in config file
        for (var eachApp in applications) {
            var app = applications[eachApp];
            var externalProperties = findProperty(app.propertyKeys, entries);
            callBack(externalProperties, app, eachMethod);
        }
        console.log('--- Anypoint API: all the changes have been applied successfully');
    });

}



function findProperty(propertyFilters, entries) {
  var consolidateProperty = {};
  entries.forEach((entry, group) => {
      if(entry) {
          if(entry["parentGroup"] &&
              entry.parentGroup["groups"] &&
                entry.parentGroup.groups.length > 0) {
              for(var eachProperty in propertyFilters) {
                  var prop = propertyFilters[eachProperty];
                  if(entry["fields"] && entry.fields.Title == prop['keypass_entrytitle']) {
                    //console.log("Each=> "+util.inspect(entry.fields['keypass_entryfield'], false, null));
                    if(entry.fields[prop['keypass_entryfield']] &&
                              entry.fields[prop['keypass_entryfield']] instanceof kdbxweb.ProtectedValue) {
                        consolidateProperty[prop['mulefield']] =
                              entry.fields[prop['keypass_entryfield']].getText();
                    } else {
                        consolidateProperty[prop['mulefield']] =
                              entry.fields[prop['keypass_entryfield']];
                    }
                  }
              }
          }

      }
  });
  return consolidateProperty;
}

//const kpio = require('keepass.io');
/*function loadKeePassFile_keepassio(applications, callBack) {
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
            var externalProperties = findProperty_keepassio(app.propertyKeys, entries);
            callBack(externalProperties, app);

        }
        console.log('--- Anypoint API: all the changes have been applied successfully');

    });
}

function findProperty_keepassio(propertyFilters, entries) {
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
}*/


module.exports.loadKeePassFile = loadKeePassFile;