* These steps are manual at this moment. These needs to done before creating Jenkins pipeline for the environment. To create a Jenkins pipeline, use the attached config.xml file.
* Please note, I have used Parameterize Pipeline plugins, to pass parameters to the pipeline.

### Steps
- Install Node JS in your system. Depending on the type of OS there could be -
- different ways to install Node JS. Please follow the setup guide for your system
- Below steps are only applicable for Debian and Red Hat based linux systems (https://nodejs.org/en/download/)

  - `sudo apt-get install npm` (Debian Based)
  - `sudo yum install npm` (Red Hat based)

  - For certain systems, node JS executable is named as `nodejs` and in some other as `node`
  - anypoint-cli looks for `node` executable, so we need to make a symlink for the `nodejs` to `node`.

      -`sudo ln -s /usr/bin/nodejs /usr/bin/node`

- Install anypoint-cli. Once you have Node JS, rest of the commands will be almost same

  - `sudo npm install -g anypoint-cli`

- Install JS-YAML package

  - `sudo npm install -g js-yaml`