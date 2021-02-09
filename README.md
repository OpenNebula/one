# [![OpenNebula Logo](https://opennebula.io/wp-content/uploads/2019/04/img-logo-blue.svg)](https://opennebula.io/)

[![Build Status](https://travis-ci.org/OpenNebula/one.svg?branch=master)](https://travis-ci.org/OpenNebula/one)

## Description

[OpenNebula](http://opennebula.io) is an open source platform delivering a simple but feature-rich and flexible solution to build and manage enterprise clouds for virtualized services, containerized applications and serverless computing.

[![OpenNebula Architecture](https://opennebula.io/wp-content/uploads/2020/08/KeyFeatures_small.png)](https://opennebula.io/discover/)

### To start using OpenNebula

- Explore OpenNebula’s **key features** [on our website](https://opennebula.io/discover).
- Have a look at our [introductory datasheet](https://support.opennebula.pro/hc/en-us/articles/360036935791-OpenNebula-Key-Features-Datasheet).
- Browse our catalog of [screencasts and video-tutorials](https://opennebula.io/screencasts/).
- Download our [technical white papers](https://opennebula.io/docs-whitepapers/).
- See our [Documentation](https://docs.opennebula.io).
- Join our [Community Forum](https://forum.opennebula.io).

[![OpenNebula Intro](https://opennebula.io/wp-content/uploads/2020/08/Intro_Screencast_small.png)](https://opennebula.io/screencast-overview/)

### Contributing to OpenNebula

- Contribute to [Development](https://github.com/OpenNebula/one/wiki/How-to-Contribute-to-Development).
- Learn about our [Add-on Catalog](https://github.com/OpenNebula/one/wiki/How-to-participate-in-Add_on-Development).
- Help us [translate OpenNebula](https://www.transifex.com/opennebula/one/) to your language.
- Report a [security vulnerability](https://github.com/OpenNebula/one/wiki/Vulnerability-Management-Process).

## Taking OpenNebula for a Test Drive

There are a couple of very easy ways to try out the OpenNebula functionality

- [miniONE](https://github.com/OpenNebula/minione) for infrastructures based on open source hypervisors.
- [vOneCloud](http://docs.opennebula.org/vonecloud) for VMware based infrastructures.

## Installation

You can find more information about OpenNebula’s architecture, installation, configuration and references to configuration files in this [documentation section](https://docs.opennebula.io/stable/deployment/index.html).

It is very useful to learn where [log files of the main OpenNebula components are placed](http://docs.opennebula.io/5.12/deployment/references/log_debug.html). Also check the [reference about the main OpenNebula daemon configuration file](https://docs.opennebula.io/stable/deployment/references/oned_conf.html).

### Front-end Installation

The Front-end is the central part of an OpenNebula installation. This is the machine where the server software is installed and where you connect to manage your cloud. It can be a physical node or a virtual instance.

Please, visit the [official documentation for more details and a step-by-step guide](http://docs.opennebula.io/5.12/deployment/opennebula_installation/overview.html). Using the packages provided on our site is the recommended method, to ensure the installation of the latest version, and to avoid possible package divergences with different distributions. There are two alternatives here: you can add **our package repositories** to your system, or visit the [software menu](http://opennebula.io/use) to **download the latest package** for your Linux distribution.

If there are no packages for your distribution, please check the [build dependencies](http://docs.opennebula.io/5.12/integration/references/build_deps.html#build-deps) for OpenNebula and head to the [Building from Source Code guide](http://docs.opennebula.io/5.12/integration/references/compile.html#compile).

### Node Installation

After the OpenNebula Front-end is correctly set up, the next step is preparing the hosts where the VMs are going to run. Please, refer to the [documentation](http://docs.opennebula.io/5.12/deployment/node_installation/overview.html) site for more details.

## Contact

- [OpenNebula web site](https://opennebula.io).
- [Development and issue tracking](https://github.com/OpenNebula/one/issues).
- [Enterprise Services](https://opennebula.io/enterprise).

## License

Copyright 2002-2021, OpenNebula Project, OpenNebula Systems (formerly C12G Labs)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
