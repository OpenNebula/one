from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DatastoreQuota:
    class Meta:
        name = "DATASTORE_QUOTA"

    datastore: list["DatastoreQuota.Datastore"] = field(
        default_factory=list,
        metadata={
            "name": "DATASTORE",
            "type": "Element",
        },
    )

    @dataclass
    class Datastore:
        id: Optional[str] = field(
            default=None,
            metadata={
                "name": "ID",
                "type": "Element",
                "required": True,
            },
        )
        images: Optional[str] = field(
            default=None,
            metadata={
                "name": "IMAGES",
                "type": "Element",
                "required": True,
            },
        )
        images_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "IMAGES_USED",
                "type": "Element",
                "required": True,
            },
        )
        size: Optional[str] = field(
            default=None,
            metadata={
                "name": "SIZE",
                "type": "Element",
                "required": True,
            },
        )
        size_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "SIZE_USED",
                "type": "Element",
                "required": True,
            },
        )


@dataclass
class Ids:
    class Meta:
        name = "IDS"

    id: list[int] = field(
        default_factory=list,
        metadata={
            "name": "ID",
            "type": "Element",
        },
    )


@dataclass
class ImageQuota:
    class Meta:
        name = "IMAGE_QUOTA"

    image: list["ImageQuota.Image"] = field(
        default_factory=list,
        metadata={
            "name": "IMAGE",
            "type": "Element",
        },
    )

    @dataclass
    class Image:
        id: Optional[str] = field(
            default=None,
            metadata={
                "name": "ID",
                "type": "Element",
                "required": True,
            },
        )
        rvms: Optional[str] = field(
            default=None,
            metadata={
                "name": "RVMS",
                "type": "Element",
                "required": True,
            },
        )
        rvms_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "RVMS_USED",
                "type": "Element",
                "required": True,
            },
        )


@dataclass
class Lock:
    class Meta:
        name = "LOCK"

    locked: Optional[int] = field(
        default=None,
        metadata={
            "name": "LOCKED",
            "type": "Element",
            "required": True,
        },
    )
    owner: Optional[int] = field(
        default=None,
        metadata={
            "name": "OWNER",
            "type": "Element",
            "required": True,
        },
    )
    time: Optional[int] = field(
        default=None,
        metadata={
            "name": "TIME",
            "type": "Element",
            "required": True,
        },
    )
    req_id: Optional[int] = field(
        default=None,
        metadata={
            "name": "REQ_ID",
            "type": "Element",
            "required": True,
        },
    )


@dataclass
class NetworkQuota:
    class Meta:
        name = "NETWORK_QUOTA"

    network: list["NetworkQuota.Network"] = field(
        default_factory=list,
        metadata={
            "name": "NETWORK",
            "type": "Element",
        },
    )

    @dataclass
    class Network:
        id: Optional[str] = field(
            default=None,
            metadata={
                "name": "ID",
                "type": "Element",
                "required": True,
            },
        )
        leases: Optional[str] = field(
            default=None,
            metadata={
                "name": "LEASES",
                "type": "Element",
                "required": True,
            },
        )
        leases_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "LEASES_USED",
                "type": "Element",
                "required": True,
            },
        )


@dataclass
class Permissions:
    class Meta:
        name = "PERMISSIONS"

    owner_u: Optional[int] = field(
        default=None,
        metadata={
            "name": "OWNER_U",
            "type": "Element",
            "required": True,
        },
    )
    owner_m: Optional[int] = field(
        default=None,
        metadata={
            "name": "OWNER_M",
            "type": "Element",
            "required": True,
        },
    )
    owner_a: Optional[int] = field(
        default=None,
        metadata={
            "name": "OWNER_A",
            "type": "Element",
            "required": True,
        },
    )
    group_u: Optional[int] = field(
        default=None,
        metadata={
            "name": "GROUP_U",
            "type": "Element",
            "required": True,
        },
    )
    group_m: Optional[int] = field(
        default=None,
        metadata={
            "name": "GROUP_M",
            "type": "Element",
            "required": True,
        },
    )
    group_a: Optional[int] = field(
        default=None,
        metadata={
            "name": "GROUP_A",
            "type": "Element",
            "required": True,
        },
    )
    other_u: Optional[int] = field(
        default=None,
        metadata={
            "name": "OTHER_U",
            "type": "Element",
            "required": True,
        },
    )
    other_m: Optional[int] = field(
        default=None,
        metadata={
            "name": "OTHER_M",
            "type": "Element",
            "required": True,
        },
    )
    other_a: Optional[int] = field(
        default=None,
        metadata={
            "name": "OTHER_A",
            "type": "Element",
            "required": True,
        },
    )


@dataclass
class SchedAction:
    class Meta:
        name = "SCHED_ACTION"

    id: Optional[int] = field(
        default=None,
        metadata={
            "name": "ID",
            "type": "Element",
            "required": True,
        },
    )
    parent_id: Optional[int] = field(
        default=None,
        metadata={
            "name": "PARENT_ID",
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
    action: Optional[str] = field(
        default=None,
        metadata={
            "name": "ACTION",
            "type": "Element",
            "required": True,
        },
    )
    args: Optional[str] = field(
        default=None,
        metadata={
            "name": "ARGS",
            "type": "Element",
            "required": True,
        },
    )
    time: Optional[str] = field(
        default=None,
        metadata={
            "name": "TIME",
            "type": "Element",
            "required": True,
        },
    )
    repeat: Optional[int] = field(
        default=None,
        metadata={
            "name": "REPEAT",
            "type": "Element",
            "required": True,
        },
    )
    days: Optional[str] = field(
        default=None,
        metadata={
            "name": "DAYS",
            "type": "Element",
            "required": True,
        },
    )
    end_type: Optional[int] = field(
        default=None,
        metadata={
            "name": "END_TYPE",
            "type": "Element",
            "required": True,
        },
    )
    end_value: Optional[int] = field(
        default=None,
        metadata={
            "name": "END_VALUE",
            "type": "Element",
            "required": True,
        },
    )
    done: Optional[int] = field(
        default=None,
        metadata={
            "name": "DONE",
            "type": "Element",
            "required": True,
        },
    )
    message: Optional[str] = field(
        default=None,
        metadata={
            "name": "MESSAGE",
            "type": "Element",
            "required": True,
        },
    )
    warning: Optional[int] = field(
        default=None,
        metadata={
            "name": "WARNING",
            "type": "Element",
            "required": True,
        },
    )


@dataclass
class VmQuota:
    class Meta:
        name = "VM_QUOTA"

    vm: list["VmQuota.Vm"] = field(
        default_factory=list,
        metadata={
            "name": "VM",
            "type": "Element",
        },
    )

    @dataclass
    class Vm:
        cluster_ids: Optional[str] = field(
            default=None,
            metadata={
                "name": "CLUSTER_IDS",
                "type": "Element",
            },
        )
        cpu: Optional[str] = field(
            default=None,
            metadata={
                "name": "CPU",
                "type": "Element",
                "required": True,
            },
        )
        cpu_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "CPU_USED",
                "type": "Element",
                "required": True,
            },
        )
        memory: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY",
                "type": "Element",
                "required": True,
            },
        )
        memory_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY_USED",
                "type": "Element",
                "required": True,
            },
        )
        running_cpu: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_CPU",
                "type": "Element",
                "required": True,
            },
        )
        running_cpu_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_CPU_USED",
                "type": "Element",
                "required": True,
            },
        )
        running_memory: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_MEMORY",
                "type": "Element",
                "required": True,
            },
        )
        running_memory_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_MEMORY_USED",
                "type": "Element",
                "required": True,
            },
        )
        running_vms: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_VMS",
                "type": "Element",
                "required": True,
            },
        )
        running_vms_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "RUNNING_VMS_USED",
                "type": "Element",
                "required": True,
            },
        )
        system_disk_size: Optional[str] = field(
            default=None,
            metadata={
                "name": "SYSTEM_DISK_SIZE",
                "type": "Element",
                "required": True,
            },
        )
        system_disk_size_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "SYSTEM_DISK_SIZE_USED",
                "type": "Element",
                "required": True,
            },
        )
        vms: Optional[str] = field(
            default=None,
            metadata={
                "name": "VMS",
                "type": "Element",
                "required": True,
            },
        )
        vms_used: Optional[str] = field(
            default=None,
            metadata={
                "name": "VMS_USED",
                "type": "Element",
                "required": True,
            },
        )
