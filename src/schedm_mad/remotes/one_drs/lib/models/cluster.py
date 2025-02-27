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
