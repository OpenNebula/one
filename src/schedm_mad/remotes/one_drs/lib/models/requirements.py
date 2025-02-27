from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Requirements:
    class Meta:
        name = "REQUIREMENTS"

    vm: list["Requirements.Vm"] = field(
        default_factory=list,
        metadata={
            "name": "VM",
            "type": "Element",
        },
    )

    @dataclass
    class Vm:
        id: Optional[int] = field(
            default=None,
            metadata={
                "name": "ID",
                "type": "Element",
                "required": True,
            },
        )
        hosts: Optional["Requirements.Vm.Hosts"] = field(
            default=None,
            metadata={
                "name": "HOSTS",
                "type": "Element",
                "required": True,
            },
        )
        nic: list["Requirements.Vm.Nic"] = field(
            default_factory=list,
            metadata={
                "name": "NIC",
                "type": "Element",
            },
        )
        datastores: Optional["Requirements.Vm.Datastores"] = field(
            default=None,
            metadata={
                "name": "DATASTORES",
                "type": "Element",
                "required": True,
            },
        )

        @dataclass
        class Hosts:
            id: list[int] = field(
                default_factory=list,
                metadata={
                    "name": "ID",
                    "type": "Element",
                    "min_occurs": 1,
                },
            )

        @dataclass
        class Nic:
            id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ID",
                    "type": "Element",
                    "required": True,
                },
            )
            vnets: Optional["Requirements.Vm.Nic.Vnets"] = field(
                default=None,
                metadata={
                    "name": "VNETS",
                    "type": "Element",
                    "required": True,
                },
            )

            @dataclass
            class Vnets:
                id: list[int] = field(
                    default_factory=list,
                    metadata={
                        "name": "ID",
                        "type": "Element",
                        "min_occurs": 1,
                    },
                )

        @dataclass
        class Datastores:
            id: list[int] = field(
                default_factory=list,
                metadata={
                    "name": "ID",
                    "type": "Element",
                    "min_occurs": 1,
                },
            )
