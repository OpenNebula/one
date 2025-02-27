from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Plan:
    class Meta:
        name = "PLAN"

    id: Optional[int] = field(
        default=None,
        metadata={
            "name": "ID",
            "type": "Element",
            "required": True,
        },
    )
    action: list["Plan.Action"] = field(
        default_factory=list,
        metadata={
            "name": "ACTION",
            "type": "Element",
            "min_occurs": 1,
        },
    )

    @dataclass
    class Action:
        vm_id: Optional[int] = field(
            default=None,
            metadata={
                "name": "VM_ID",
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
            },
        )
        ds_id: Optional[int] = field(
            default=None,
            metadata={
                "name": "DS_ID",
                "type": "Element",
            },
        )
        nic: list["Plan.Action.Nic"] = field(
            default_factory=list,
            metadata={
                "name": "NIC",
                "type": "Element",
            },
        )

        @dataclass
        class Nic:
            nic_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "NIC_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            network_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "NETWORK_ID",
                    "type": "Element",
                    "required": True,
                },
            )
