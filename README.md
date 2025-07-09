# [![OpenNebula Logo](https://opennebula.io/wp-content/uploads/2019/04/img-logo-blue.svg)](https://opennebula.io/)

## Description

[OpenNebula](http://opennebula.io) is an open source platform delivering a simple but feature-rich and flexible solution to build and manage enterprise clouds for virtualized services, containerized applications and serverless computing.

[![OpenNebula Architecture](https://opennebula.io/wp-content/uploads/2024/07/03_new_Key-Features.png)](https://opennebula.io/discover/)

### To start using OpenNebula

- Explore OpenNebula’s **key features** [on our website](https://opennebula.io/discover).
- Have a look at our [introductory datasheet](https://support.opennebula.pro/hc/en-us/articles/360036935791-OpenNebula-Key-Features-Datasheet).
- Browse our catalog of [screencasts and video-tutorials](https://opennebula.io/screencasts/).
- Download our [technical white papers](https://opennebula.io/docs-whitepapers/).
- See our [Documentation](https://docs.opennebula.io).
- Join our [Community Forum](https://forum.opennebula.io).
- Check our [Quick Start Guide](https://docs.opennebula.io/stable/quick_start/index.html).

[![OpenNebula Intro](https://opennebula.io/wp-content/uploads/2020/08/Intro_Screencast_small.png)](https://opennebula.io/screencast-overview/)

### Contributing to OpenNebula

- Contribute to [Development](https://github.com/OpenNebula/one/wiki/How-to-Contribute-to-Development).
- Learn about our [Add-on Catalog](https://github.com/OpenNebula/one/wiki/How-to-participate-in-Add_on-Development).
- Help us [translate OpenNebula](https://www.transifex.com/opennebula/one/) to your language.
- Report a [security vulnerability](https://github.com/OpenNebula/one/wiki/Vulnerability-Management-Process).

## Taking OpenNebula for a Test Drive

You can quickly and easily try out OpenNebula’s functionality by installing [miniONE](https://github.com/OpenNebula/minione). Then, you can follow [tutorials](https://docs.opennebula.io/stable/quick_start/try_opennebula/opennebula_on-prem_with_minione/) to quickly install an OpenNebula cloud.

## Installation

For information on installing OpenNebula, please see this [documentation section](https://docs.opennebula.io/stable/software/installation_process/).

It is very useful to learn where [log files of the main OpenNebula components are placed](https://docs.opennebula.io/stable/product/operation_references/opennebula_services_configuration/troubleshooting/). Also check the [reference about the main OpenNebula daemon configuration file](https://docs.opennebula.io/stable/product/operation_references/opennebula_services_configuration/oned/).

### Front-end Installation

The Front-end is the central part of an OpenNebula installation. This is the machine where the server software is installed and where you connect to manage your cloud. It can be a physical node or a virtual instance.

Please visit the [official documentation for more details and a step-by-step guide](https://docs.opennebula.io/stable/software/installation_process/manual_installation/overview/). Using the packages provided on our site is the recommended method, to ensure the installation of the latest version and to avoid possible package divergences with different distributions. There are two alternatives here: you can add **our package repositories** to your system, or visit the [software menu](http://opennebula.io/use) to **download the latest package** for your Linux distribution.

If there are no packages for your distribution, please check the [build dependencies](https://docs.opennebula.io/stable/software/installation_process/build_from_source_code/build_deps/) for OpenNebula and head to the [Building from Source Code guide](https://docs.opennebula.io/stable/software/installation_process/build_from_source_code/compile/).

### Node Installation

After the OpenNebula Front-end is correctly set up, the next step is preparing the hosts where the VMs are going to run. For details please refer to the installation guides for [KVM Nodes](https://docs.opennebula.io/stable/software/installation_process/manual_installation/kvm_node_installation/) and [LXC Nodes](https://docs.opennebula.io/stable/software/installation_process/manual_installation/lxc_node_installation/).

## Contact

- [OpenNebula web site](https://opennebula.io).
- [Development and issue tracking](https://github.com/OpenNebula/one/issues).
- [Enterprise Services](https://opennebula.io/enterprise).

## License

Copyright 2002-2025, OpenNebula Project, OpenNebula Systems (formerly C12G Labs)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## Acknowledgements

Some of the software features included in this repository have been made possible through the funding of the following innovation projects: [ONEnextgen](http://onenextgen.eu/), [ONEedge5G](https://opennebula.io/innovation/oneedge5g/), and [SovereignEdge.Cognit](https://cognit.sovereignedge.eu/).
