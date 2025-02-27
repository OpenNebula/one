from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Vnet:
    class Meta:
        name = "VNET"

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
    lock: Optional["Vnet.Lock"] = field(
        default=None,
        metadata={
            "name": "LOCK",
            "type": "Element",
        },
    )
    permissions: Optional["Vnet.Permissions"] = field(
        default=None,
        metadata={
            "name": "PERMISSIONS",
            "type": "Element",
        },
    )
    clusters: Optional["Vnet.Clusters"] = field(
        default=None,
        metadata={
            "name": "CLUSTERS",
            "type": "Element",
            "required": True,
        },
    )
    bridge: Optional[str] = field(
        default=None,
        metadata={
            "name": "BRIDGE",
            "type": "Element",
            "required": True,
        },
    )
    bridge_type: Optional[str] = field(
        default=None,
        metadata={
            "name": "BRIDGE_TYPE",
            "type": "Element",
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
    parent_network_id: Optional[str] = field(
        default=None,
        metadata={
            "name": "PARENT_NETWORK_ID",
            "type": "Element",
            "required": True,
        },
    )
    vn_mad: Optional[str] = field(
        default=None,
        metadata={
            "name": "VN_MAD",
            "type": "Element",
            "required": True,
        },
    )
    phydev: Optional[str] = field(
        default=None,
        metadata={
            "name": "PHYDEV",
            "type": "Element",
            "required": True,
        },
    )
    vlan_id: Optional[str] = field(
        default=None,
        metadata={
            "name": "VLAN_ID",
            "type": "Element",
        },
    )
    outer_vlan_id: Optional[str] = field(
        default=None,
        metadata={
            "name": "OUTER_VLAN_ID",
            "type": "Element",
        },
    )
    vlan_id_automatic: Optional[str] = field(
        default=None,
        metadata={
            "name": "VLAN_ID_AUTOMATIC",
            "type": "Element",
            "required": True,
        },
    )
    outer_vlan_id_automatic: Optional[str] = field(
        default=None,
        metadata={
            "name": "OUTER_VLAN_ID_AUTOMATIC",
            "type": "Element",
            "required": True,
        },
    )
    used_leases: Optional[int] = field(
        default=None,
        metadata={
            "name": "USED_LEASES",
            "type": "Element",
            "required": True,
        },
    )
    vrouters: Optional["Vnet.Vrouters"] = field(
        default=None,
        metadata={
            "name": "VROUTERS",
            "type": "Element",
            "required": True,
        },
    )
    updated_vms: Optional["Vnet.UpdatedVms"] = field(
        default=None,
        metadata={
            "name": "UPDATED_VMS",
            "type": "Element",
            "required": True,
        },
    )
    outdated_vms: Optional["Vnet.OutdatedVms"] = field(
        default=None,
        metadata={
            "name": "OUTDATED_VMS",
            "type": "Element",
            "required": True,
        },
    )
    updating_vms: Optional["Vnet.UpdatingVms"] = field(
        default=None,
        metadata={
            "name": "UPDATING_VMS",
            "type": "Element",
            "required": True,
        },
    )
    error_vms: Optional["Vnet.ErrorVms"] = field(
        default=None,
        metadata={
            "name": "ERROR_VMS",
            "type": "Element",
            "required": True,
        },
    )
    template: Optional["Vnet.Template"] = field(
        default=None,
        metadata={
            "name": "TEMPLATE",
            "type": "Element",
            "required": True,
        },
    )
    ar_pool: Optional["Vnet.ArPool"] = field(
        default=None,
        metadata={
            "name": "AR_POOL",
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
    class Vrouters:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class UpdatedVms:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class OutdatedVms:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class UpdatingVms:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class ErrorVms:
        id: list[int] = field(
            default_factory=list,
            metadata={
                "name": "ID",
                "type": "Element",
            },
        )

    @dataclass
    class Template:
        any_element: list[object] = field(
            default_factory=list,
            metadata={
                "type": "Wildcard",
                "process_contents": "skip",
            },
        )
        dns: Optional[str] = field(
            default=None,
            metadata={
                "name": "DNS",
                "type": "Element",
            },
        )
        gateway: Optional[str] = field(
            default=None,
            metadata={
                "name": "GATEWAY",
                "type": "Element",
            },
        )
        gateway6: Optional[str] = field(
            default=None,
            metadata={
                "name": "GATEWAY6",
                "type": "Element",
            },
        )
        guest_mtu: Optional[int] = field(
            default=None,
            metadata={
                "name": "GUEST_MTU",
                "type": "Element",
            },
        )
        ip6_method: Optional[str] = field(
            default=None,
            metadata={
                "name": "IP6_METHOD",
                "type": "Element",
            },
        )
        ip6_metric: Optional[str] = field(
            default=None,
            metadata={
                "name": "IP6_METRIC",
                "type": "Element",
            },
        )
        method: Optional[str] = field(
            default=None,
            metadata={
                "name": "METHOD",
                "type": "Element",
            },
        )
        metric: Optional[str] = field(
            default=None,
            metadata={
                "name": "METRIC",
                "type": "Element",
            },
        )
        network_address: Optional[str] = field(
            default=None,
            metadata={
                "name": "NETWORK_ADDRESS",
                "type": "Element",
            },
        )
        network_mask: Optional[str] = field(
            default=None,
            metadata={
                "name": "NETWORK_MASK",
                "type": "Element",
            },
        )
        search_domain: Optional[str] = field(
            default=None,
            metadata={
                "name": "SEARCH_DOMAIN",
                "type": "Element",
            },
        )
        vcenter_from_wild: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_FROM_WILD",
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
        vcenter_net_ref: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_NET_REF",
                "type": "Element",
            },
        )
        vcenter_portgroup_type: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_PORTGROUP_TYPE",
                "type": "Element",
            },
        )
        vcenter_template_ref: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCENTER_TEMPLATE_REF",
                "type": "Element",
            },
        )

    @dataclass
    class ArPool:
        ar: list["Vnet.ArPool.Ar"] = field(
            default_factory=list,
            metadata={
                "name": "AR",
                "type": "Element",
            },
        )

        @dataclass
        class Ar:
            ar_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "AR_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            global_prefix: Optional[str] = field(
                default=None,
                metadata={
                    "name": "GLOBAL_PREFIX",
                    "type": "Element",
                },
            )
            ip: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP",
                    "type": "Element",
                },
            )
            mac: Optional[str] = field(
                default=None,
                metadata={
                    "name": "MAC",
                    "type": "Element",
                    "required": True,
                },
            )
            parent_network_ar_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "PARENT_NETWORK_AR_ID",
                    "type": "Element",
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
            type_value: Optional[str] = field(
                default=None,
                metadata={
                    "name": "TYPE",
                    "type": "Element",
                    "required": True,
                },
            )
            ula_prefix: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ULA_PREFIX",
                    "type": "Element",
                },
            )
            vn_mad: Optional[str] = field(
                default=None,
                metadata={
                    "name": "VN_MAD",
                    "type": "Element",
                },
            )
            mac_end: Optional[str] = field(
                default=None,
                metadata={
                    "name": "MAC_END",
                    "type": "Element",
                },
            )
            ip_end: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP_END",
                    "type": "Element",
                },
            )
            ip6_ula: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6_ULA",
                    "type": "Element",
                },
            )
            ip6_ula_end: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6_ULA_END",
                    "type": "Element",
                },
            )
            ip6_global: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6_GLOBAL",
                    "type": "Element",
                },
            )
            ip6_global_end: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6_GLOBAL_END",
                    "type": "Element",
                },
            )
            ip6: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6",
                    "type": "Element",
                },
            )
            ip6_end: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IP6_END",
                    "type": "Element",
                },
            )
            port_start: Optional[str] = field(
                default=None,
                metadata={
                    "name": "PORT_START",
                    "type": "Element",
                },
            )
            port_size: Optional[str] = field(
                default=None,
                metadata={
                    "name": "PORT_SIZE",
                    "type": "Element",
                },
            )
            used_leases: Optional[str] = field(
                default=None,
                metadata={
                    "name": "USED_LEASES",
                    "type": "Element",
                    "required": True,
                },
            )
            leases: Optional["Vnet.ArPool.Ar.Leases"] = field(
                default=None,
                metadata={
                    "name": "LEASES",
                    "type": "Element",
                },
            )

            @dataclass
            class Leases:
                lease: list["Vnet.ArPool.Ar.Leases.Lease"] = field(
                    default_factory=list,
                    metadata={
                        "name": "LEASE",
                        "type": "Element",
                    },
                )

                @dataclass
                class Lease:
                    ip: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "IP",
                            "type": "Element",
                        },
                    )
                    ip6: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "IP6",
                            "type": "Element",
                        },
                    )
                    ip6_global: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "IP6_GLOBAL",
                            "type": "Element",
                        },
                    )
                    ip6_link: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "IP6_LINK",
                            "type": "Element",
                        },
                    )
                    ip6_ula: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "IP6_ULA",
                            "type": "Element",
                        },
                    )
                    mac: Optional[str] = field(
                        default=None,
                        metadata={
                            "name": "MAC",
                            "type": "Element",
                            "required": True,
                        },
                    )
                    vm: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "VM",
                            "type": "Element",
                        },
                    )
                    vnet: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "VNET",
                            "type": "Element",
                        },
                    )
                    vrouter: Optional[int] = field(
                        default=None,
                        metadata={
                            "name": "VROUTER",
                            "type": "Element",
                        },
                    )
