
# OpenNebula

## Description

OpenNebula is an open-source project delivering a simple but feature-rich and 
flexible solution to build and manage enterprise clouds and virtualized data centers.

Complete documentation: http://opennebula.org/documentation:documentation

How to contribute: http://opennebula.org/community:contribute

## Installation

### Requirements

This machine will act as the OpenNebula server and therefore needs to have
installed the following software:

* **ruby** >= 1.8.5
* **sqlite3** >= 3.5.2
* **xmlrpc-c** >= 1.06
* **openssl** >= 0.9
* **ssh**
* **sqlite3-ruby** gem

Additionally, to build OpenNebula from source you need:

* Development versions of the **sqlite3**, **xmlrpc-c** and **openssl**
  packages, if your distribution does not install them with the libraries.
* **scons** >= 0.97
* **g++** >= 4
* **flex** >= 2.5 (optional, only needed to rebuild the parsers)
* **bison** >= 2.3 (optional, only needed to rebuild the parsers)
* **libxml2-dev**

### Ruby Libraries Requirements

A set of gem requirements are needed to make several components work. We
include a handy script to install them and the requirements. It is located at
`share/install_gems/install_gems` and you should use it to install the
required gems. You have more information at:

  http://opennebula.org/documentation:documentation:compile

If you want to install them manually here are the list of required rubygems:

* OpenNebula and clients (plus cloud interfaces)
  * sqlite3
  * json
  * sequel
  * mysql
  * net-ldap
  * amazon-ec2
  * rack
  * sinatra
  * thin
  * uuidtools
  * curb
  * nokogiri

* OpenNebula zones (client and server)
  * json
  * sequel
  * sqlite3
  * mysql
  * nokogiri

* Sunstone server
  * json
  * rack
  * sinatra
  * thin
  * sequel
  * nokogiri

### Optional Packages

These packages are not needed to run or build OpenNebula. They improve the
performance of the user-land libraries and tools of OpenNebula, nor the core
system. You will probably experiment a more responsive CLI.

First install rubygems and ruby development libraries

* **ruby-dev**
* **rubygems**
* **rake**
* **make**

Then install the following packages:

* **ruby xmlparser**, some distributions include a binary package for this
  (**libxml-parser-ruby1.8**). If it is not available in your distribution
  install expat libraries with its development files and install xmlparser
  using gem:

    $ sudo gem install xmlparser --no-ri --no-rdoc

  Note the extra parameters to gem install. Some versions of xmlparser have
  problems building the documentation and we can use it without documentation
  installed.

* **ruby nokogiri**, to install this gem you will need **libxml2** and
  **libxslt** libraries and their development versions. The we can install
  nokogiri library:

    $ sudo gem install nokogiri --no-ri --no-rdoc


### Building

Compilation is done using **scons** command:

    $ scons [OPTION=VALUE]

The argument expression *[OPTIONAL]* is used to set non-default values for:

        OPTION      VALUE
        sqlite_db   path-to-sqlite-install
        sqlite      no if you don't want to build sqlite support
        mysql       yes if you want to build mysql support
        xmlrpc      path-to-xmlrpc-install
        parsers     yes if you want to rebuild flex/bison files
        

### Installation

OpenNebula can be installed in two modes: system-wide, or in self-contained
directory. In either case, you do not need to run OpenNebula as root. These
options can be specified when running the install script:

    $ ./install.sh install_options

where **install_options** can be one or more of:

    OPTION  VALUE
    -u      user that will run OpenNebula, defaults to user executing
            install.sh
    -g      group of the user that will run OpenNebula, defaults to user
            executing install.sh
    -k      keep current configuration files, useful when upgrading
    -d      target installation directory. If defined, it will specified
            the path for the self-contained install. If not defined, the
            installation will be performed system wide
    -c      only install client utilities: OpenNebula cli, occi and ec2
            client files
    -r      remove Opennebula, only useful if -d was not specified,
            otherwise rm -rf $ONE_LOCATION would do the job
    -h      prints installer help


## Configuration

Information on how to configure OpenNebula is located at
http://opennebula.org/documentation:documentation:cg


## Contact

OpenNebula web page: http://opennebula.org

Development and issue tracking: http://dev.opennebula.org

Support: http://opennebula.org/support:support


## License

Copyright 2002-2015, OpenNebula Project, OpenNebula Systems (formerly C12G Labs)

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

