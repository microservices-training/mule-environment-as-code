# Mule Environment As Code (EaC)

## Introduction
Once you have declared your environment target state in a file, the target state can be realised simply by committing the file to a source control system. Mule EaC framework will parse the file (environment descriptor) and compare with the environment and make the necessary changes.  For example, increase the number of workers in CloudHub for an application.

![Deployment Pipeline](images/deployment_pipeline.png "Deployment Pipeline")

## Adopt as part of your **DevOps and CI/CD pipeline**.

![Build and Deployment](images/build_and_deployment.png "Build and Deployment") 

The source code repository for environment management is separate from the application source code.

## Why Adopt?

### The main advantages of the [Infrastructure as Code](https://en.wikipedia.org/wiki/Infrastructure_as_Code) approach allows for:

- rollback to previously known state through [git revert](https://git-scm.com/docs/git-revert).
- deployment of multiple applications update together or if you prefer a single application update.
- decouple build from deployment and the promotion of code (binary) through the environments. 
- comparison of configuration between environments and know the deployment configuration of your environment any given time.

### Why not just deploy from a environment branch from your application source code repository?

- A single binary is promoted through the environments which reduces human error and delay in merging from a feature branch into a environment branch.

- This framework can be used as part of strategy for [Imuntable Server](https://martinfowler.com/bliki/ImmutableServer.html) and [PhoenixServer](https://martinfowler.com/bliki/PhoenixServer.html) which reduces [configuration drift](http://kief.com/configuration-drift.html)

## How does it work?
### Example of deployment descriptor file for CloudHub:
Target state is defined in the deployment descriptor file.
```yaml
CloudHub:
  Env: "dev"
  BusinessGroup: "Mulesoft"
  ExternalPropertySource: "keepass"
  Applications:
    -
      name: "amin-s-playground"
      repoType: "maven"
      groupId: "com.mulesoft"
      artifactId: "amin-s-playground"
      version: "1.0.0-SNAPSHOT"
      packageType: "zip"
      packageName: "amin-s-playground-1.0.0-SNAPSHOT.zip"
      worker-size: "0.2"
      num-of-workers: "1"
      runtime: "3.8.5"
      region: "eu-west-1"
      staticIPsEnabled: "Disabled"
      persistentQueues: "false"
      persistentQueuesEncrypted: "false"
      properties: "amin-s-playground-dev.properties"
      repo_endpoint: 'http://51.15.129.23:8090/repository/maven-snapshots/'
      propertyKeys:
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_secret"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_id"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "Cloudhub"
          mulefield: "cloudhub.username"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "Cloudhub"
          mulefield: "cloudhub.password"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "MuleEsbDB"
          mulefield: "db.host"
          keypass_entryfield: "URL"
        -
          keypass_entrytitle: "MuleEsbDB"
          mulefield: "db.user"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "MuleEsbDB"
          mulefield: "db.password"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "AWS_S3"
          mulefield: "s3.client"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "AWS_S3"
          mulefield: "s3.secret"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "ComExS3Bucket"
          mulefield: "s3.bucket.name"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "CollectSQS"
          mulefield: "sqs.access.key"
          keypass_entryfield: "UserName"
        -
          keypass_entrytitle: "CollectSQS"
          mulefield: "sqs.secret.key"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "SQSQueues"
          mulefield: "sqs.queue.name.source"
          keypass_entryfield: "cde.generator"
        -
          keypass_entrytitle :  "AWS_AccountNo"
          mulefield: "aws.account.no"
          keypass_entryfield: "UserName"
    -
      name: "really-cool-api-v1"
      repoType: "maven"
      groupId: "com.mulesoft"
      artifactId: "really-cool-api"
      version: "1.0.0-SNAPSHOT"
      packageType: "zip"
      packageName: "really-cool-api-1.0.0-SNAPSHOT.zip"
      worker-size: "0.1"
      num-of-workers: "2"
      runtime: "3.8.5"
      region: "eu-west-1"
      staticIPsEnabled: "Disabled"
      persistentQueues: "false"
      persistentQueuesEncrypted: "false"
      properties: "really-cool-api-v1-dev.properties"
      repo_endpoint: 'https://link-to-your-maven-repository.com/snapshots/'
      propertyKeys:
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_secret"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_id"
          keypass_entryfield: "UserName"
    -
      name: "another-really-cool-api-v1"
      repoType: "raw"
      groupId: "com.mulesoft"
      artifactId: "another-really-cool-api"
      version: "1.0.0-SNAPSHOT"
      packageType: "zip"
      packageName: "another-really-cool-api-1.0.0-SNAPSHOT.zip"
      worker-size: "1"
      num-of-workers: "1"
      runtime: "3.8.5"
      region: "eu-west-1"
      staticIPsEnabled: "Disabled"
      persistentQueues: "false"
      persistentQueuesEncrypted: "false"
      properties: "another-really-cool-api-v1-dev.properties"
      repo_endpoint: 'https://link-to-your-maven-repository.com/snapshots/com/mulesoft/another-really-cool-api'
      propertyKeys:
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_secret"
          keypass_entryfield: "Password"
        -
          keypass_entrytitle: "BusinessGroupDetails"
          mulefield: "anypoint.platform.client_id"
          keypass_entryfield: "UserName"
```
- At present, the framework can only source injected properties from property file stored in app_properties directory and/or from KeePass database. It is perfectly alright to source the properties from both or from only one of the sources. I do not forsee any need for more than 2 property sources at any given time. Based on project requirement, more external property source (like database ) could be easily implemented
- Please note, at this moment repoType can take either `maven` or `raw` value. We might support more type of repository in future

### Framework Logic

* If the **application is not already deployed** then deploy the application. 
    * Field `name` is used as the unique identifier for the application. 
* If the **application is already deployed**, then update deployment if there are any changes in:
    * Application version
        * Field `packageName` is used to compare application version. The application version will be parsed using the maven convention.
    * Worker Configuration
        * Worker size
        * Number of Workers
        * Runtime
        * Region
        * Static IP
        * Persistent Queue
        * Persistent Queue Encryption
    * Application Properties
    * CloudHub Properties

## How do I get started?

1. Create source code repository to host your configuration or fork this repository.
1. Create a branch for the environment. Each environment will require a branch. 
1. Copy of the contents of this repository into your branch if you did not fork this repository.
1. Configure your CI-Server and trigger execution on commit
```sh
$ .mule/environment-init.sh environment_descriptor.yml
```
Use the same command to trigger deployment from your local development workstation.
1. Configure the Anypoint platform credentials as environment variables in your CI server:
    * anypoint_username
    * anypoint_password
1. Update `environment_descriptor.yml` with:
    * Env
    * Business Group
    * Applications
    * Applications properties
1. Commit and push
   
### How do I update application properties?
Application Properties are maintained based on a folder structure convention. If the property file is empty, no properties will be updated during deployment.

```
app_properties/[app.name]/[app.name]-[branch].properties
```
* `app.name` is the `name` field in `deployment_descriptor.yml`

Example:
```
app_properties/really-cool-api-v1/really-cool-api-dev.properties
```

## Roadmap
More info on [Git Project page](https://github.com/mulesoft-labs/mule-environment-as-code)

| Feature | Deployment Target | Status  | Additional details |
| --- | --- | --- | --- |
| Deploy Application  | CloudHub  | Completed | |
| Application properties | CloudHub | Completed | |
| Worker Configuration | CloudHub | Completed | runtime version, worker size, num of workers  |
| CloudHub properties | CloudHub |  | persistence queue, static ips |
| [Default configuration for CircelCI](https://github.com/mulesoft-labs/mule-environment-as-code/tree/master/.circleci) | CircleCI | Completed | |
| [Default configuration for Jenkins](https://github.com/mulesoft-labs/mule-environment-as-code/tree/master/.jenkins) | Jenkins | Completed | |
| Create a full example with sample apps | CloudHub |  |  |
| Deploy Applications | Anypoint Runtime Manager  |  | |
| Application properties | Anypoint Runtime Manager |  | |

## Pre-requisites:

#### [Anypoint-cli](https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli#installation)
Command Line Interface for Anypoint Platform([Anypoint-CLI](https://docs.mulesoft.com/runtime-manager/anypoint-platform-cli)) is used to:
* Get information about deployed applications.
* Update application runtime, e.g. number of Workers.
* Update or deploy application.

#### [Nodes.js](https://nodejs.org/)
Anypoint-CLI is written in Nodes.js hence the framework has been written in Node.js to reduce dependencies.

#### CI or automation server
   - Such as Jenkins, Bamboo, CirecleCi, Ansible, Chef, Puppet etc.

#### Build pipeline
Build pipeline that published build artefacts into a store

#### Artefacts store/repository
- Store for application binaries
    -  Preferably maven artefact repository, such as Nexus, JFrog, etc.
    -  At present, we support maven and raw 

## Recommendations:
- Create a branch per environment 
- No merging between branches

## Contributors
- Jeyaram Deivachandran
- Igor Repka
- Mohammad Aminul Haque