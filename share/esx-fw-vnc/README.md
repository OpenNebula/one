# Building ESX VIB package

Requirements:

1. [Vagrant](https://www.vagrantup.com/)
2. [VirtualBox](https://www.virtualbox.org/)

Other requirements (automatically get by `Makefile`):

3. Vagrant plugin vagrant-sshfs
4. [VIB Author](https://labs.vmware.com/flings/vib-author) tool RPM in current directory

# Build

VIB package build is based on a deprecated, but still working, *VIB Author* tool.
This tool works fine on old EL/CentOS 6, that's why the build process
(unfortunately) requires the Vagrant+VirtualBox to provide the build
environment with the CentOS&nbsp;6.

There are two possible approaches to building the VIB package.

### 1. Makefile

Just start the `make` and required Vagrant plugin and latest known
VIB Author tool will be automatically downloaded and new VIB
packages built.

```
$ make
```

You can find the fresh packages in `fw-vnc.vib` and `fw-vnc.zip`.

### 2. Manual

1. download [VIB Author](https://labs.vmware.com/flings/vib-author) tool RPM into the current directory
2. start Vagrant

```
$ vagrant plugin install vagrant-sshfs
$ vagrant up && vagrant destroy -f
```

You can find the fresh packages in `fw-vnc.vib` and `fw-vnc.zip`.
