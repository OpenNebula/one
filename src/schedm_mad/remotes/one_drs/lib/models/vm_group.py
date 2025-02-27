from dataclasses import dataclass, field
from typing import Optional


@dataclass
class VmGroup:
    class Meta:
        name = "VM_GROUP"

    id: Optional[int] = field(
        default=None,
        metadata={
            "name": "ID",
            "type": "Element",
            "required": True,
        },
    )
    uid: Optional[int] = field(
        default=None,
        metadata={
            "name": "UID",
            "type": "Element",
            "required": True,
        },
    )
    gid: Optional[int] = field(
        default=None,
        metadata={
            "name": "GID",
            "type": "Element",
            "required": True,
        },
    )
    uname: Optional[str] = field(
        default=None,
        metadata={
            "name": "UNAME",
            "type": "Element",
            "required": True,
        },
    )
    gname: Optional[str] = field(
        default=None,
        metadata={
            "name": "GNAME",
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
    permissions: Optional["VmGroup.Permissions"] = field(
        default=None,
        metadata={
            "name": "PERMISSIONS",
            "type": "Element",
        },
    )
    lock: Optional["VmGroup.Lock"] = field(
        default=None,
        metadata={
            "name": "LOCK",
            "type": "Element",
        },
    )
    roles: Optional["VmGroup.Roles"] = field(
        default=None,
        metadata={
            "name": "ROLES",
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
    class Permissions:
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
    class Lock:
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
    class Roles:
        role: list["VmGroup.Roles.Role"] = field(
            default_factory=list,
            metadata={
                "name": "ROLE",
                "type": "Element",
                "min_occurs": 1,
            },
        )

        @dataclass
        class Role:
            host_affined: Optional[str] = field(
                default=None,
                metadata={
                    "name": "HOST_AFFINED",
                    "type": "Element",
                },
            )
            host_anti_affined: Optional[str] = field(
                default=None,
                metadata={
                    "name": "HOST_ANTI_AFFINED",
                    "type": "Element",
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
            name: Optional[str] = field(
                default=None,
                metadata={
                    "name": "NAME",
                    "type": "Element",
                    "required": True,
                },
            )
            policy: Optional[str] = field(
                default=None,
                metadata={
                    "name": "POLICY",
                    "type": "Element",
                },
            )
            vms: Optional[str] = field(
                default=None,
                metadata={
                    "name": "VMS",
                    "type": "Element",
                },
            )
