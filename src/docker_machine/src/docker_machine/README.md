# Docker Machine OpenNebula Driver

This is a plugin for [Docker Machine](https://docs.docker.com/machine/) allowing to create docker hosts on [OpenNebula](http://www.opennebula.org). This will allow the deployment of Docker Engines using Docker Machine using OpenNebula as the backend, from a client machine.

## Authors

* Marco Mancini ([@km4rcus](https://github.com/km4rcus))
* Jaime Melis ([@jmelis](https://github.com/jmelis))

## Requirements

* Docker CLI (the daemon is not required) must be installed in the client machine. Tested with version 1.12.1.
* [Docker Machine](https://docs.docker.com/machine/). Tested with version 0.8.1.
* Access to an [OpenNebula](http://www.opennebula.org) Cloud. Tested with version 5.2.

## Installation

Make sure [Go](http://www.golang.org) and [Godep](https://github.com/tools/godep) are properly installed, including setting up a [GOPATH](http://golang.org/doc/code.html#GOPATH).

To build the plugin binary:

```bash
$ go get github.com/OpenNebula/docker-machine-opennebula
$ cd $GOPATH/src/github.com/OpenNebula/docker-machine-opennebula
$ make build
```

After the build is complete, `bin/docker-machine-driver-opennebula` binary will be created and it must included in `$PATH` variable. If you want to copy it to the `${GOPATH}/bin/`, run `make install`.

## Usage

Official documentation for Docker Machine [is available here](https://docs.docker.com/machine/).

Set up a user to use for docker-machine with OpenNebula, give it permissions to create / manage instances.
Set up env variables `ONE_AUTH` to contain `user:password` and `ONE_XMLRPC` to point to the OpenNebula cloud.

```
export ONE_AUTH=~/.one/one_auth
export ONE_XMLRPC=https://<ONE FRONTEND>:2633/RPC2
```

There are two ways to define the Docker Engines with this plugin: either by specifying a template registered in OpenNebula, or by specifying all the required attributes to create it dynamically. At the end of this guide there is a comprehensive guide on the specific options you can use, and in what combination, for both cases.

To use this plugin you will need to have registered an Image in OpenNebula where Docker will be executed. This image can be a vanilla OS [supported by docker-machine](https://github.com/docker/machine/blob/master/docs/drivers/os-base.md) or a specially built [Boot2Docker for OpenNebula](http://marketplace.opennebula.systems/appliance/56d073858fb81d0315000002). Using boo2docker for OpenNebula is recommended, as it will boot faster since it has all the required packages.

### Boot2Docker in KVM / Xen

Import [Boot2Docker for OpenNebula](http://marketplace.opennebula.systems/appliance/56d073858fb81d0315000002) into OpenNebula and then use the following arguments in docker-machine:

```bash
$ docker-machine create --driver opennebula --opennebula-network-name $NETWORK_NAME --opennebula-image-id $BOOT2DOCKER_IMG_ID --opennebula-b2d-size $DATA_SIZE_MB b2d
```

Remember to use `--opennebula-b2d-size` in this case (only for Boot2Docker without a template).

Or create a template that references the b2d image, an __additional volatile disk__ and a __network__, and use it:

```bash
$ docker-machine create --driver opennebula --opennebula-template-name boot2docker b2dFromTemplate
```

Note that we cannot use `--opennebula-b2d-size` if we are using a template.

Remember to substitute:

* `$NETWORK_NAME` with a real network already existent in your OpenNebula installation
* `$BOOT2DOCKER_IMG_ID` the ID of the boot2docker image imported from the MarketPlace.
* `$DATA_SIZE_MB` is the size of the volatile disk that will be used to store the docker data.
* `$TEMPLATE_ID` is the template of the Virtual Machine to deploy.

### Vanilla OS in KVM / Xen

As long as you have a vanilla OS image in your OpenNebula installation, and this image is contextualized with the [latest packages](http://docs.opennebula.org/stable/user/virtual_machine_setup/bcont.html#preparing-the-virtual-machine-image), you can used it as such:

```bash
$ docker-machine create --driver opennebula --opennebula-network-name $NETWORK_NAME --opennebula-image-id $IMG_ID mydockerengine
```

You can resize the OS disk like this:

```bash
$ docker-machine create --driver opennebula --opennebula-network-name $NETWORK_NAME --opennebula-disk-resize --opennebula-image-id $IMG_ID --opennebula-disk-resize 10240 mydockerengine
```

Or create a template that references that image and network, and use it:

```bash
$ docker-machine create --driver opennebula --opennebula-template-id $TEMPLATE_ID b2dFromTemplate
```

Note that we _cannot_ use `--opennebula-disk-resize` if we are using a template.

### vCenter

For the vCenter hypervisor, we recommend using Boot2Docker. You will need to follow these steps first:

* Upload the [Boot2Docker](http://marketplace.opennebula.systems/appliance/56d073858fb81d0315000002) ISO into a Datastore in vCenter.
* Make sure you have a network defined in vCenter to connect Docker to.
* Create a Template in vCenter, with the following hardware:
  * Desired capacity: CPU, Memory.
  * New CD/DVD Drive (Datastore ISO File): select the Boot2Docker ISO. Make sure you check *Connect At Power On*.
  * New Hard disk: select the desired capacity for the Docker scratch data.
  * Do **not** specify a network, remove it if one was added automatically.

In OpenNebula, you will need to import the template and the desired networks, using the create Host dialog. Make sure you make the network type `ipv4`.

Once you have fulfilled these pre-requisites you can now launch your docker-engine:

```bash
$ docker-machine create --driver opennebula --opennebula-template-id $TEMPLATE_ID --opennebula-network-id $NETWORK_ID b2d

```

As you can see, we **must** specify `--opennebula-template-*` and `--opennebula-network-*`. Other parameters can be specified optionally to override the values in the template, like `--opennebula-cpu`, etc...

## Available Driver Options

It is required to specify the network the machine will be connected to with `--opennebula-network-name` or `--opennebula-network-id`; in case `--opennebula-network-name` is used then the owner of the network can be passed with `--opennebula-network-owner` if it is different from the user in the file `ONE_AUTH`.

It is also necessary to specify the image to use by specifying `--opennebula-image-id` or `--opennebula-image-name` (and optionally `opennebula-image-owner`).

List of Options:

* `--opennebula-user`: User identifier to authenticate with
* `--opennebula-password`: User password or token
* `--opennebula-xmlrpcurl`: XMLRPC endpoint
* `--opennebula-cpu`: CPU value for the VM
* `--opennebula-vcpu`: VCPUs for the VM
* `--opennebula-memory`: Size of memory for VM in MB
* `--opennebula-template-id`: Template ID to use
* `--opennebula-template-name`: Template to use
* `--opennebula-network-id`: Network ID to connect the machine to
* `--opennebula-network-name`: Network to connect the machine to
* `--opennebula-network-owner`: User ID of the Network to connect the machine to
* `--opennebula-image-id`: Image ID to use as the OS
* `--opennebula-image-name`: Image to use as the OS
* `--opennebula-image-owner`: Owner of the image to use as the OS
* `--opennebula-dev-prefix`: Dev prefix to use for the images: 'vd', 'sd', 'hd', etc...
* `--opennebula-disk-resize`: Size of disk for VM in MB
* `--opennebula-b2d-size`: Size of the Volatile disk in MB (only for b2d)
* `--opennebula-ssh-user`: Set the name of the SSH user
* `--opennebula-disable-vnc`: VNC is enabled by default. Disable it with this flag

|          CLI Option          | Default Value |  Environment Variable  |
| ---------------------------- | ------------- | ---------------------- |
| `--opennebula-user`          |               | `ONE_USER`             |
| `--opennebula-password`      |               | `ONE_PASSWORD`         |
| `--opennebula-xmlrpcurl`     | `http://localhost:2633/RPC2`           | `ONE_XMLRPC`        |
| `--opennebula-cpu`           | `1`           | `ONE_CPU`              |
| `--opennebula-vcpu`          | `1`           | `ONE_VCPU`             |
| `--opennebula-memory`        | `1024`        | `ONE_MEMORY`           |
| `--opennebula-template-id`   |               | `ONE_TEMPLATE_ID`      |
| `--opennebula-template-name` |               | `ONE_TEMPLATE_NAME`    |
| `--opennebula-network-id`    |               | `ONE_NETWORK_ID`       |
| `--opennebula-network-name`  |               | `ONE_NETWORK_NAME`     |
| `--opennebula-network-owner` |               | `ONE_NETWORK_OWNER`    |
| `--opennebula-image-id`      |               | `ONE_IMAGE_ID`         |
| `--opennebula-image-name`    |               | `ONE_IMAGE_NAME`       |
| `--opennebula-image-owner`   |               | `ONE_IMAGE_OWNER`      |
| `--opennebula-dev-prefix`    |               | `ONE_IMAGE_DEV_PREFIX` |
| `--opennebula-disk-resize`   |               | `ONE_DISK_SIZE`        |
| `--opennebula-b2d-size`      |               | `ONE_B2D_DATA_SIZE`    |
| `--opennebula-ssh-user`      | `docker`      | `ONE_SSH_USER`         |
| `--opennebula-disable-vnc`   | Enabled       | `ONE_DISABLE_VNC`      |

Remember that:

* If you are using a regular vanilla OS image in OpenNebula you can use `--opennebula-disk-resize` to resize the size of the OS, but you should never use `--opennebula-b2d-size` in this case. If you don't specify `--opennebula-disk-resize`, the size of the disk will be the default one, the one of the image.
* If you are using boot2docker, you have to use `--opennebula-b2d-size`, in order to provision an extra data disk, but you should never use `--opennebula-disk-resize` in this case.

## Using a Template

Using a template means specifying either `--opennebula-template-id` or `--opennebula-template-name`. If you specify either of these two options, the following table applies, indicating what incompatible and what overrideable parameters are available:

|        Incompatible        |           Override           |
| -------------------------- | ---------------------------- |
| `--opennebula-image-id`    | `--opennebula-cpu`           |
| `--opennebula-image-name`  | `--opennebula-vcpu`          |
| `--opennebula-image-owner` | `--opennebula-memory`        |
| `--opennebula-dev-prefix`  | `--opennebula-network-id`    |
| `--opennebula-disk-resize` | `--opennebula-network-name`  |
| `--opennebula-b2d-size`    | `--opennebula-network-owner` |
| `--opennebula-disable-vnc` |                              |

If you try to specify an attribute in the *incompatible* list, along with either `--opennebula-template-id` or `--opennebula-template-name`, then `docker-machine` will raise an error. If you specify an attribute in the *override* list, it will use that value instead of what is specified in the template.

The template must have a reference to an image, however, referencing a network is entirely option. It the template has a network, the `--opennebula-network-*` options will override it, using the one in the template by default; if the template doesn't reference any networks, the `docker-machine` user **must** specify one.

```bash
# A template that references a network doesn't require any --opennebula-network-* attribute:
$ docker-machine create --driver opennebula --opennebula-template-id 10 mydockerengine

# However it can be overridden:
$ docker-machine create --driver opennebula --opennebula-template-id 10 --opennebula-network-id 2 mydockerengine
```

This is what the registered template in OpenNebula may look like:

```
NAME=b2d

CPU="1"
MEMORY="512"

# The OS Disl
DISK=[
  IMAGE="b2d" ]

# The volatile disk (only for Boot2Docker)
DISK=[
  FORMAT="raw",
  SIZE="1024",
  TYPE="fs" ]

# The network can be specified in the template or as a parameter
NIC=[
  NETWORK="private" ]

# VNC
GRAPHICS=[
  LISTEN="0.0.0.0",
  TYPE="vnc" ]
```

Note that:

* If there is a `CONTEXT` section in the template, it will be discarded and replaced with one by `docker-machine`.

## Not Using a Template

If you don't specify neither `--opennebula-template-id` nor `--opennebula-template-name`, then you **must** specify the image: `--opennebula-image-*`, and the network: `--opennebula-network-*`, and optionally the other parameters.


## Using with schedulers

### Swarm (old)
(Tested, working)
(external) docker swarm is covered on the OpenNebula blog:
https://opennebula.org/docker-swarm-with-opennebula/

This has been tested

### Swarmkit / Swarm mode

(Tested, working)
Please work from: https://docs.docker.com/get-started/part4/#create-a-cluster
If you have discovery issues, please check your *multicast support* is OK.

As long as your VM template includes only *one* network, you should not even need to give --advertise-addr or --listen-addr

### rancher

(Tested, working)
https://opennebula.org/managing-docker-hosts-deployments-with-rancher-and-opennebula/


### k8s

Unfortunately there is no documentation for this, yet.
It is not known if it has been tested.


### Autoscaling via OneFlow

(Tested, working)
A documentation link is missing.
