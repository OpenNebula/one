# OpenNebula Fabric Manager Host Package

This directory contains the source files for the `opennebula-fabricmanager` service. This service is part of `opennebula-kvm-node` package and it's the host-level component of the `onefabric` tool and is designed to be installed on OpenNebula KVM nodes equipped with NVIDIA NVSwitch hardware.

## Core Functionality

When installed on a KVM host, this package provides the following:

*   A systemd service (`opennebula-fabricmanager.service`) that manages a dedicated, lightweight virtual machine named `one-fabricmanager`.
*   Automatic detection of NVSwitch PCI devices on the host, which are then passed through to the `one-fabricmanager` VM.
*   A secure environment inside the VM for NVIDIA's proprietary tools (`nv-partitioner`, etc.), isolating them from the host OS.
*   A remote execution script that allows the `onefabric` CLI on the frontend to execute commands to the VM.

## Management

This service is not intended to be managed directly on the KVM host. Instead, it is designed to be controlled remotely from the OpenNebula frontend via the `onefabric` command-line tool, which handles all service operations.
