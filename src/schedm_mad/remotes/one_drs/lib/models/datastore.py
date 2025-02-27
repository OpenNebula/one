from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Datastore:
    class Meta:
        name = "DATASTORE"

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
    permissions: Optional["Datastore.Permissions"] = field(
        default=None,
        metadata={
            "name": "PERMISSIONS",
            "type": "Element",
        },
    )
    ds_mad: Optional[str] = field(
        default=None,
        metadata={
            "name": "DS_MAD",
            "type": "Element",
            "required": True,
        },
    )
    tm_mad: Optional[str] = field(
        default=None,
        metadata={
            "name": "TM_MAD",
            "type": "Element",
            "required": True,
        },
    )
    base_path: Optional[str] = field(
        default=None,
        metadata={
            "name": "BASE_PATH",
            "type": "Element",
            "required": True,
        },
    )
    type_value: Optional[int] = field(
        default=None,
        metadata={
            "name": "TYPE",
            "type": "Element",
            "required": True,
        },
    )
    disk_type: Optional[int] = field(
        default=None,
        metadata={
            "name": "DISK_TYPE",
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
    clusters: Optional["Datastore.Clusters"] = field(
        default=None,
        metadata={
            "name": "CLUSTERS",
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
    free_mb: Optional[int] = field(
        default=None,
        metadata={
            "name": "FREE_MB",
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
    images: Optional["Datastore.Images"] = field(
        default=None,
        metadata={
            "name": "IMAGES",
            "type": "Element",
            "required": True,
        },
    )
    template: Optional["Datastore.Template"] = field(
        default=None,
        metadata={
            "name": "TEMPLATE",
            "type": "Element",
            "required": True,
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
    class Clusters:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Images:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Template:
        vcenter_dc_name: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_DC_NAME",
                "type": "Element",
            },
        )
        vcenter_dc_ref: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_DC_REF",
                "type": "Element",
            },
        )
        vcenter_ds_name: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_DS_NAME",
                "type": "Element",
            },
        )
        vcenter_ds_ref: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_DS_REF",
                "type": "Element",
            },
        )
        vcenter_host: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_HOST",
                "type": "Element",
            },
        )
        vcenter_instance_id: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_INSTANCE_ID",
                "type": "Element",
            },
        )
        any_element: list[object] = field(
            default_factory=list,
            metadata={
                "type": "Wildcard",
            },
        )
