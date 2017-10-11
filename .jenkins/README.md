# These steps are manual at this moment
# 1. Install Node JS in your system. Depeding on the type of OS there could be -
# different ways to install Node JS. Please follow the setup guide for your system
# Below steps are only applicable for Debian and Red Hat based linux systems (https://nodejs.org/en/download/)

  sudo apt-get install npm #(Debian Based)
  sudo yum install npm #(Red Hat based)

    # For certain system, node JS executable is named as `nodejs` and in some other as `node`
    # anypoint-cli looks for `node` executable, so we need to make a symlink for the `nodejs` to `node`.
      `sudo ln -s /usr/bin/nodejs /usr/bin/node`


# 2. Install anypoint-cli. Once you have Node JS, rest of the commands will be almost same

  sudo npm install -g anypoint-cli

# 3. Install JS-YAML package

  sudo npm install -g js-yaml
