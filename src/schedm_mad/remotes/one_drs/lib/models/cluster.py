from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Cluster:
    class Meta:
        name = "CLUSTER"

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
    hosts: Optional["Cluster.Hosts"] = field(
        default=None,
        metadata={
            "name": "HOSTS",
            "type": "Element",
            "required": True,
        },
    )
    datastores: Optional["Cluster.Datastores"] = field(
        default=None,
        metadata={
            "name": "DATASTORES",
            "type": "Element",
            "required": True,
        },
    )
    vnets: Optional["Cluster.Vnets"] = field(
        default=None,
        metadata={
            "name": "VNETS",
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
    plan: Optional["Cluster.Plan"] = field(
        default=None,
        metadata={
            "name": "PLAN",
            "type": "Element",
        },
    )

    @dataclass
    class Hosts:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Datastores:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Vnets:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Plan:
        id: Optional[int] = field(
            default=None,
            metadata={
                "name": "ID",
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
        action: Optional["Cluster.Plan.Action"] = field(
            default=None,
            metadata={
                "name": "ACTION",
                "type": "Element",
                "required": True,
            },
        )

        @dataclass
        class Action:
            id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ID",
                    "type": "Element",
                    "required": True,
                },
            )
            vm_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "VM_ID",
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
            operation: Optional[str] = field(
                default=None,
                metadata={
                    "name": "OPERATION",
                    "type": "Element",
                    "required": True,
                },
            )
            host_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "HOST_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            ds_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "DS_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            timestamp: Optional[int] = field(
                default=None,
                metadata={
                    "name": "TIMESTAMP",
                    "type": "Element",
                    "required": True,
                },
            )
