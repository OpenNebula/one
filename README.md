# Requirements

  * fpm ruby gem
  * dpkg for debian packages
  * rpm for centos packages

In debian/ubuntu rpm can be installed. The package is called "rpm"


# Bump version

The version should be changed in gen_package.sh and oneapps/share/version.rb


# Generate packages

Execute these commands as root so the files in the package are owned by root.

## RPM

    $ PACKAGE_TYPE=rpm ./gen_package.sh

## DEB

    $ PACKAGE_TYPE=deb ./gen_package.sh

