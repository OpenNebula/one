from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class Host:
    class Meta:
        name = "HOST"

    id: Optional[int] = field(
        default=None,
        metadata={
            "name": "ID",
            "type": "Element",
            "required": True,
        },
    )
    name: Optional[str] = field(
        default=None,
        metadata={
            "name": "NAME",
            "type": "Element",
            "required": True,
        },
    )
    state: Optional[int] = field(
        default=None,
        metadata={
            "name": "STATE",
            "type": "Element",
            "required": True,
        },
    )
    prev_state: Optional[int] = field(
        default=None,
        metadata={
            "name": "PREV_STATE",
            "type": "Element",
            "required": True,
        },
    )
    im_mad: Optional[str] = field(
        default=None,
        metadata={
            "name": "IM_MAD",
            "type": "Element",
            "required": True,
        },
    )
    vm_mad: Optional[str] = field(
        default=None,
        metadata={
            "name": "VM_MAD",
            "type": "Element",
            "required": True,
        },
    )
    cluster_id: Optional[int] = field(
        default=None,
        metadata={
            "name": "CLUSTER_ID",
            "type": "Element",
            "required": True,
        },
    )
    cluster: Optional[str] = field(
        default=None,
        metadata={
            "name": "CLUSTER",
            "type": "Element",
            "required": True,
        },
    )
    host_share: Optional["Host.HostShare"] = field(
        default=None,
        metadata={
            "name": "HOST_SHARE",
            "type": "Element",
            "required": True,
        },
    )
    vms: Optional["Host.Vms"] = field(
        default=None,
        metadata={
            "name": "VMS",
            "type": "Element",
            "required": True,
        },
    )
    template: Optional[object] = field(
        default=None,
        metadata={
            "name": "TEMPLATE",
            "type": "Element",
        },
    )
    monitoring: Optional["Host.Monitoring"] = field(
        default=None,
        metadata={
            "name": "MONITORING",
            "type": "Element",
            "required": True,
        },
    )

    @dataclass
    class HostShare:
        mem_usage: Optional[int] = field(
            default=None,
            metadata={
                "name": "MEM_USAGE",
                "type": "Element",
                "required": True,
            },
        )
        cpu_usage: Optional[int] = field(
            default=None,
            metadata={
                "name": "CPU_USAGE",
                "type": "Element",
                "required": True,
            },
        )
        total_mem: Optional[int] = field(
            default=None,
            metadata={
                "name": "TOTAL_MEM",
                "type": "Element",
                "required": True,
            },
        )
        total_cpu: Optional[int] = field(
            default=None,
            metadata={
                "name": "TOTAL_CPU",
                "type": "Element",
                "required": True,
            },
        )
        max_mem: Optional[int] = field(
            default=None,
            metadata={
                "name": "MAX_MEM",
                "type": "Element",
                "required": True,
            },
        )
        max_cpu: Optional[int] = field(
            default=None,
            metadata={
                "name": "MAX_CPU",
                "type": "Element",
                "required": True,
            },
        )
        running_vms: Optional[int] = field(
            default=None,
            metadata={
                "name": "RUNNING_VMS",
                "type": "Element",
                "required": True,
            },
        )
        vms_thread: Optional[int] = field(
            default=None,
            metadata={
                "name": "VMS_THREAD",
                "type": "Element",
                "required": True,
            },
        )
        datastores: Optional["Host.HostShare.Datastores"] = field(
            default=None,
            metadata={
                "name": "DATASTORES",
                "type": "Element",
                "required": True,
            },
        )
        pci_devices: Optional["Host.HostShare.PciDevices"] = field(
            default=None,
            metadata={
                "name": "PCI_DEVICES",
                "type": "Element",
                "required": True,
            },
        )
        numa_nodes: Optional["Host.HostShare.NumaNodes"] = field(
            default=None,
            metadata={
                "name": "NUMA_NODES",
                "type": "Element",
                "required": True,
            },
        )

        @dataclass
        class Datastores:
            disk_usage: Optional[int] = field(
                default=None,
                metadata={
                    "name": "DISK_USAGE",
                    "type": "Element",
                    "required": True,
                },
            )
            ds: list["Host.HostShare.Datastores.Ds"] = field(
                default_factory=list,
                metadata={
                    "name": "DS",
                    "type": "Element",
                },
            )
            free_disk: Optional[int] = field(
                default=None,
                metadata={
                    "name": "FREE_DISK",
                    "type": "Element",
                    "required": True,
                },
            )
            max_disk: Optional[int] = field(
                default=None,
                metadata={
                    "name": "MAX_DISK",
                    "type": "Element",
                    "required": True,
                },
            )
            used_disk: Optional[int] = field(
                default=None,
                metadata={
                    "name": "USED_DISK",
                    "type": "Element",
                    "required": True,
                },
            )

            @dataclass
            class Ds:
                free_mb: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "FREE_MB",
                        "type": "Element",
                        "required": True,
                    },
                )
                id: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "ID",
                        "type": "Element",
                        "required": True,
                    },
                )
                total_mb: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "TOTAL_MB",
                        "type": "Element",
                        "required": True,
                    },
                )
                used_mb: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "USED_MB",
                        "type": "Element",
                        "required": True,
                    },
                )
                replica_cache: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "REPLICA_CACHE",
                        "type": "Element",
                    },
                )
                replica_cache_size: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "REPLICA_CACHE_SIZE",
                        "type": "Element",
                    },
                )
                replica_images: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "REPLICA_IMAGES",
                        "type": "Element",
                    },
                )

        @dataclass
        class PciDevices:
            pci: list["Host.HostShare.PciDevices.Pci"] = field(
                default_factory=list,
                metadata={
                    "name": "PCI",
                    "type": "Element",
                },
            )

            @dataclass
            class Pci:
                address: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "ADDRESS",
                        "type": "Element",
                        "required": True,
                    },
                )
                bus: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "BUS",
                        "type": "Element",
                        "required": True,
                    },
                )
                class_value: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "CLASS",
                        "type": "Element",
                        "required": True,
                    },
                )
                class_name: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "CLASS_NAME",
                        "type": "Element",
                        "required": True,
                    },
                )
                device: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "DEVICE",
                        "type": "Element",
                        "required": True,
                    },
                )
                device_name: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "DEVICE_NAME",
                        "type": "Element",
                        "required": True,
                    },
                )
                domain: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "DOMAIN",
                        "type": "Element",
                        "required": True,
                    },
                )
                function: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "FUNCTION",
                        "type": "Element",
                        "required": True,
                    },
                )
                numa_node: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "NUMA_NODE",
                        "type": "Element",
                        "required": True,
                    },
                )
                profiles: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "PROFILES",
                        "type": "Element",
                    },
                )
                short_address: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "SHORT_ADDRESS",
                        "type": "Element",
                        "required": True,
                    },
                )
                slot: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "SLOT",
                        "type": "Element",
                        "required": True,
                    },
                )
                type_value: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "TYPE",
                        "type": "Element",
                        "required": True,
                    },
                )
                uuid: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "UUID",
                        "type": "Element",
                    },
                )
                vendor: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "VENDOR",
                        "type": "Element",
                        "required": True,
                    },
                )
                vendor_name: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "VENDOR_NAME",
                        "type": "Element",
                        "required": True,
                    },
                )
                vmid: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "VMID",
                        "type": "Element",
                        "required": True,
                    },
                )

        @dataclass
        class NumaNodes:
            node: list["Host.HostShare.NumaNodes.Node"] = field(
                default_factory=list,
                metadata={
                    "name": "NODE",
                    "type": "Element",
                },
            )

            @dataclass
            class Node:
                core: list["Host.HostShare.NumaNodes.Node.Core"] = field(
                    default_factory=list,
                    metadata={
                        "name": "CORE",
                        "type": "Element",
                    },
                )
                hugepage: list["Host.HostShare.NumaNodes.Node.Hugepage"] = (
                    field(
                        default_factory=list,
                        metadata={
                            "name": "HUGEPAGE",
                            "type": "Element",
                        },
                    )
                )
                memory: Optional["Host.HostShare.NumaNodes.Node.Memory"] = (
                    field(
                        default=None,
                        metadata={
                            "name": "MEMORY",
                            "type": "Element",
                            "required": True,
                        },
                    )
                )
                node_id: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "NODE_ID",
                        "type": "Element",
                        "required": True,
                    },
                )

                @dataclass
                class Core:
                    cpus: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "CPUS",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    dedicated: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "DEDICATED",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    free: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "FREE",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    id: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "ID",
                            "type": "Element",
                            "required": True,
                        },
                    )

                @dataclass
                class Hugepage:
                    pages: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "PAGES",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    size: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "SIZE",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    usage: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "USAGE",
                            "type": "Element",
                            "required": True,
                        },
                    )

                @dataclass
                class Memory:
                    distance: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "DISTANCE",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    total: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "TOTAL",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    usage: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "USAGE",
                            "type": "Element",
                            "required": True,
                        },
                    )

    @dataclass
    class Vms:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Monitoring:
        timestamp: Optional[int] = field(
            default=None,
            metadata={
                "name": "TIMESTAMP",
                "type": "Element",
            },
        )
        id: Optional[int] = field(
            default=None,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )
        capacity: Optional["Host.Monitoring.Capacity"] = field(
            default=None,
            metadata={
                "name": "CAPACITY",
                "type": "Element",
            },
        )
        system: Optional["Host.Monitoring.System"] = field(
            default=None,
            metadata={
                "name": "SYSTEM",
                "type": "Element",
            },
        )
        numa_node: list["Host.Monitoring.NumaNode"] = field(
            default_factory=list,
            metadata={
                "name": "NUMA_NODE",
                "type": "Element",
            },
        )

        @dataclass
        class Capacity:
            free_cpu: Optional[int] = field(
                default=None,
                metadata={
                    "name": "FREE_CPU",
                    "type": "Element",
                },
            )
            free_cpu_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "FREE_CPU_FORECAST",
                    "type": "Element",
                },
            )
            free_cpu_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "FREE_CPU_FORECAST_FAR",
                    "type": "Element",
                },
            )
            free_memory: Optional[int] = field(
                default=None,
                metadata={
                    "name": "FREE_MEMORY",
                    "type": "Element",
                },
            )
            free_memory_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "FREE_MEMORY_FORECAST",
                    "type": "Element",
                },
            )
            free_memory_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "FREE_MEMORY_FORECAST_FAR",
                    "type": "Element",
                },
            )
            used_cpu: Optional[int] = field(
                default=None,
                metadata={
                    "name": "USED_CPU",
                    "type": "Element",
                },
            )
            used_cpu_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "USED_CPU_FORECAST",
                    "type": "Element",
                },
            )
            used_cpu_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "USED_CPU_FORECAST_FAR",
                    "type": "Element",
                },
            )
            used_memory: Optional[int] = field(
                default=None,
                metadata={
                    "name": "USED_MEMORY",
                    "type": "Element",
                },
            )
            used_memory_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "USED_MEMORY_FORECAST",
                    "type": "Element",
                },
            )
            used_memory_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "USED_MEMORY_FORECAST_FAR",
                    "type": "Element",
                },
            )

        @dataclass
        class System:
            netrx: Optional[int] = field(
                default=None,
                metadata={
                    "name": "NETRX",
                    "type": "Element",
                },
            )
            netrx_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "NETRX_FORECAST",
                    "type": "Element",
                },
            )
            netrx_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "NETRX_FORECAST_FAR",
                    "type": "Element",
                },
            )
            nettx: Optional[int] = field(
                default=None,
                metadata={
                    "name": "NETTX",
                    "type": "Element",
                },
            )
            nettx_forecast: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "NETTX_FORECAST",
                    "type": "Element",
                },
            )
            nettx_forecast_far: Optional[Decimal] = field(
                default=None,
                metadata={
                    "name": "NETTX_FORECAST_FAR",
                    "type": "Element",
                },
            )

        @dataclass
        class NumaNode:
            hugepage: list["Host.Monitoring.NumaNode.Hugepage"] = field(
                default_factory=list,
                metadata={
                    "name": "HUGEPAGE",
                    "type": "Element",
                },
            )
            memory: Optional["Host.Monitoring.NumaNode.Memory"] = field(
                default=None,
                metadata={
                    "name": "MEMORY",
                    "type": "Element",
                    "required": True,
                },
            )
            node_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "NODE_ID",
                    "type": "Element",
                    "required": True,
                },
            )

            @dataclass
            class Hugepage:
                free: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "FREE",
                        "type": "Element",
                        "required": True,
                    },
                )
                size: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "SIZE",
                        "type": "Element",
                        "required": True,
                    },
                )

            @dataclass
            class Memory:
                free: Optional[str] = field(
                    default=None,
                    metadata={
                        "name": "FREE",
                        "type": "Element",
                        "required": True,
                    },
                )
                used: Optional[int] = field(
                    default=None,
                    metadata={
                        "name": "USED",
                        "type": "Element",
                        "required": True,
                    },
                )
