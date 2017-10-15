These needs to done before creating Bamboo pipeline for the environment.

### Steps
- Install Node JS in your system. Depending on the type of OS there could be different ways to install Node JS. Please follow the setup guide for your system.
- Below steps are only applicable for Debian and Red Hat based linux systems (https://nodejs.org/en/download/)
  - `sudo apt-get install npm` (Debian Based)
  - `sudo yum install npm` (Red Hat based)
  - For certain systems, node JS executable is named as `nodejs` and in some other as `node`
  - anypoint-cli looks for `node` executable, so we need to make a symlink for the `nodejs` to `node` if there is only nodes (ignore otherwise)
      -`sudo ln -s /usr/bin/nodejs /usr/bin/node`
- Install anypoint-cli. Once you have Node JS, rest of the commands will be almost same
  - `sudo npm install -g anypoint-cli`
- Install JS-YAML package
  - `sudo npm install js-yaml` 
- Install keepass.io
  - `npm install keepass.io`
  	- Ignore any errors with message 'DO NOT WORRY ABOUT THESE MESSAGES. KEEPASS.IO WILL FALLBACK TO SLOWER NODE.JS METHODS, SO THERE ARE NO LIMITATIONS EXCEPT SLOWER PERFORMANCE.'