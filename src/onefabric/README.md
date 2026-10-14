# OpenNebula NVIDIA&reg; Fabric Manager Tool

The `onefabric` tool is a command-line utility for managing NVIDIA&reg; NVSwitch hardware in an OpenNebula cloud. It provides a centralized interface on the OpenNebula frontend to control the entire lifecycle of the NVIDIA&reg; Fabric Manager on all registered KVM hosts, from installation and service management to direct hardware partitioning.

## How it works

The tool uses a NVIDIA&reg;; reference distributed architecture to provide secure and isolated control over the NVSwitch hardware.

### NVIDIA&reg; Shared NVSwitch Virtualization Model

The Shared NVSwitch model is an evolution of simple GPU passthrough.
Its goal is to virtualize the NVSwitch fabric, so multi-GPU VMs get full NVLink bandwidth even when GPUs are split across several VMs.

Key Idea

- A Service VM (always running) controls the NVSwitches.
- The NVSwitches themselves are always passed through to the Service VM.

This allows NVIDIA&reg; Fabric Manager to reconfigure the switches dynamically and fix the bandwidth limitations seen in plain GPU passthrough.

You can find more information about NVIDIA&reg; Shared NVSwitch Virtualization Model [here](https://docs.nvidia.com/datacenter/tesla/fabric-manager-user-guide/index.html#shared-nvswitch-virtualization-model).

### The OpenNebula Approach

OpenNebula integrates this functionality through a two-part system designed for automation and centralized management:

1.  **Host Component (`opennebula-kvm-node` package):** The Enterprise Edition of the package is installed on each KVM host that contains NVSwitch devices. It provides a systemd service that manages a minimal, self-contained virtual machine (the "Fabric Manager VM"). This VM is given direct, secure access to the NVSwitch hardware via PCI passthrough and contains the necessary NVIDIA&reg; tools (`nv-partitioner`, `nvswitch-audit`) to manage the hardware.

The host component also includes a monitoring probe that runs periodically. It queries the Fabric Manager VM to get the current NVSwitch partitions and maps the logical GPU module IDs to the physical PCI addresses on the host. This information (`NVSWITCH_PARTITION`) is reported to OpenNebul, making the partition status and the GPU topology visible in the host's monitoring data for scheduling and management.

2.  **Frontend CLI (`onefabric`):** This is the primary user interface for the tool, run from the OpenNebula frontend. It acts as a central point of control for the entire cluster. When a command is executed (e.g., `onefabric list`), the tool uses SSH to connect to the relevant KVM hosts and remotely execute commands inside the Fabric Manager VM using `virsh` and the QEMU guest agent. This allows an administrator to manage the NVSwitch hardware across all hosts from a single console.

## USAGE

### 1. Initial Setup

First, ensure the `opennebula-kvm-node` package is installed on all target KVM hosts.

The `onefabric` CLI tool is installed on the OpenNebula frontend by the `opennebula` package (or by `install.sh` from a source checkout).

### 2. Managing the Fabric

Once the package is installed, you can manage the Fabric Manager service and the NVSwitch hardware partitions using the following commands. Commands can be targeted at specific hosts (`--host <id/name>`) or entire clusters (`--cluster <id/name>`). If no target is specified, the command runs on all available hosts.

#### Service Management
*   `onefabric status`: Shows the one-fabricmanager VM status of the service on hosts.

#### NVSwitch Partition Management
*   `onefabric list [--csv]`: Lists NVSwitch partitions. Use `--csv` for script-friendly output.
*   `onefabric activate <partition_id>`: Activates a specific hardware partition.
*   `onefabric deactivate <partition_id>`: Deactivates a specific hardware partition.
*   `onefabric audit`: Runs the `nvswitch-audit` tool inside the Fabric Manager VM.
*   `onefabric exec "<shell_command>"`: Executes an arbitrary shell command inside the Fabric Manager VM.

#### Commnands usage example

In this example we will activate partition on a specific host, we can use the following commands:

1. Check available partitions on specific host:

```
oneadmin@opennebula-gpu01:~$ onefabric list --host 0
Executing inside VM: nv-partitioner -o 0
Successfully connected to Fabric Manager at 127.0.0.1
Total supported partitions: 15

Partition ID   Number of GPUs GPU Module ID            Max NVLinks/GPU     STATUS
--------------------------------------------------------------------------------
0              8              1, 2, 3, 4, 5, 6, 7, 8   18                  INACTIVE
1              4              1, 2, 3, 4               18                  INACTIVE
2              4              5, 6, 7, 8               18                  INACTIVE
...
14             1              8                        0                   INACTIVE
```

2. Activate a the available partition:

```
oneadmin@opennebula-gpu01:~$ onefabric activate 0 --host 0
Executing inside VM: nv-partitioner -o 1 -p 0
Successfully connected to Fabric Manager at 127.0.0.1
Successfully sent activation request for partition 0
```

3. Verify that the partition has been successfully activated:

3.1. Using `onefabric list`:

```
oneadmin@opennebula-gpu01:~$ onefabric list --host 0
Executing inside VM: nv-partitioner -o 0
Successfully connected to Fabric Manager at 127.0.0.1
Total supported partitions: 15

Partition ID   Number of GPUs GPU Module ID            Max NVLinks/GPU     STATUS
--------------------------------------------------------------------------------
0              8              1, 2, 3, 4, 5, 6, 7, 8   18                  ACTIVE
1              4              1, 2, 3, 4               18                  INACTIVE
2              4              5, 6, 7, 8               18                  INACTIVE
...
14             1              8                        0                   INACTIVE
```

3.2. Using `onefabric audit`:

```
oneadmin@opennebula-gpu01:~$ onefabric audit --host 0
Executing inside VM: nvswitch-audit

GPU Reachability Matrix
GPU Physical Id      1  2  3  4  5  6  7  8
                   1 18 18 18 18 18 18 18 18
                   2 18 18 18 18 18 18 18 18
                   3 18 18 18 18 18 18 18 18
                   4 18 18 18 18 18 18 18 18
                   5 18 18 18 18 18 18 18 18
                   6 18 18 18 18 18 18 18 18
                   7 18 18 18 18 18 18 18 18
                   8 18 18 18 18 18 18 18 18

Note: Number of NVLinks displayed corresponds to the maximum number of GPU NVLinks
      that NVSwitches are programmed to handle. Number of GPU NVLinks might be different
      than displayed in the above matrix
```

As we can see in the audit, in this case we have activated partition 0 which allows interconnection between all GPUs available on the server using the NVSwitch/NVLinks.

## PREREQUISITES & CONSIDERATIONS

- **Host Drivers:** The KVM hosts must have the `vfio-pci` driver enabled and loaded for the target NVIDIA&reg; NVSwitch PCI devices. The `prepare_vm_xml.sh` script on the host will automatically detect these devices and pass them through to the Fabric Manager VM.
- **SSH Access:** The `oneadmin` user on the frontend must have passwordless SSH access to the `oneadmin` user on all KVM hosts.
