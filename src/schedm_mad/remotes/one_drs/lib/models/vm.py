from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional

from lib.models.shared import (
    Ids,
    Lock,
    Permissions,
    SchedAction,
)


@dataclass
class Vm:
    class Meta:
        name = "VM"

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
    permissions: Optional[Permissions] = field(
        default=None,
        metadata={
            "name": "PERMISSIONS",
            "type": "Element",
            "required": True,
        },
    )
    last_poll: Optional[int] = field(
        default=None,
        metadata={
            "name": "LAST_POLL",
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
    lcm_state: Optional[int] = field(
        default=None,
        metadata={
            "name": "LCM_STATE",
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
    prev_lcm_state: Optional[int] = field(
        default=None,
        metadata={
            "name": "PREV_LCM_STATE",
            "type": "Element",
            "required": True,
        },
    )
    resched: Optional[int] = field(
        default=None,
        metadata={
            "name": "RESCHED",
            "type": "Element",
            "required": True,
        },
    )
    stime: Optional[int] = field(
        default=None,
        metadata={
            "name": "STIME",
            "type": "Element",
            "required": True,
        },
    )
    etime: Optional[int] = field(
        default=None,
        metadata={
            "name": "ETIME",
            "type": "Element",
            "required": True,
        },
    )
    deploy_id: Optional[str] = field(
        default=None,
        metadata={
            "name": "DEPLOY_ID",
            "type": "Element",
            "required": True,
        },
    )
    lock: Optional[Lock] = field(
        default=None,
        metadata={
            "name": "LOCK",
            "type": "Element",
        },
    )
    monitoring: Optional["Vm.Monitoring"] = field(
        default=None,
        metadata={
            "name": "MONITORING",
            "type": "Element",
            "required": True,
        },
    )
    sched_actions: Optional[Ids] = field(
        default=None,
        metadata={
            "name": "SCHED_ACTIONS",
            "type": "Element",
            "required": True,
        },
    )
    template: Optional["Vm.Template"] = field(
        default=None,
        metadata={
            "name": "TEMPLATE",
            "type": "Element",
            "required": True,
        },
    )
    user_template: Optional["Vm.UserTemplate"] = field(
        default=None,
        metadata={
            "name": "USER_TEMPLATE",
            "type": "Element",
            "required": True,
        },
    )
    history_records: Optional["Vm.HistoryRecords"] = field(
        default=None,
        metadata={
            "name": "HISTORY_RECORDS",
            "type": "Element",
            "required": True,
        },
    )
    snapshots: list["Vm.Snapshots"] = field(
        default_factory=list,
        metadata={
            "name": "SNAPSHOTS",
            "type": "Element",
        },
    )
    backups: Optional["Vm.Backups"] = field(
        default=None,
        metadata={
            "name": "BACKUPS",
            "type": "Element",
            "required": True,
        },
    )

    @dataclass
    class Monitoring:
        cpu: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "CPU",
                "type": "Element",
            },
        )
        cpu_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "CPU_FORECAST",
                "type": "Element",
            },
        )
        cpu_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "CPU_FORECAST_FAR",
                "type": "Element",
            },
        )
        diskrdbytes: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDBYTES",
                "type": "Element",
            },
        )
        diskrdbytes_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDBYTES_BW",
                "type": "Element",
            },
        )
        diskrdbytes_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDBYTES_BW_FORECAST",
                "type": "Element",
            },
        )
        diskrdbytes_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDBYTES_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        diskrdiops: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDIOPS",
                "type": "Element",
            },
        )
        diskrdiops_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDIOPS_BW",
                "type": "Element",
            },
        )
        diskrdiops_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDIOPS_BW_FORECAST",
                "type": "Element",
            },
        )
        diskrdiops_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKRDIOPS_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        diskwrbytes: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRBYTES",
                "type": "Element",
            },
        )
        diskwrbytes_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRBYTES_BW",
                "type": "Element",
            },
        )
        diskwrbytes_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRBYTES_BW_FORECAST",
                "type": "Element",
            },
        )
        diskwrbytes_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRBYTES_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        diskwriops: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRIOPS",
                "type": "Element",
            },
        )
        diskwriops_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRIOPS_BW",
                "type": "Element",
            },
        )
        diskwriops_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRIOPS_BW_FORECAST",
                "type": "Element",
            },
        )
        diskwriops_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "DISKWRIOPS_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        disk_size: list["Vm.Monitoring.DiskSize"] = field(
            default_factory=list,
            metadata={
                "name": "DISK_SIZE",
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
        memory: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "MEMORY",
                "type": "Element",
            },
        )
        netrx: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETRX",
                "type": "Element",
            },
        )
        netrx_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETRX_BW",
                "type": "Element",
            },
        )
        netrx_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETRX_BW_FORECAST",
                "type": "Element",
            },
        )
        netrx_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETRX_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        nettx: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETTX",
                "type": "Element",
            },
        )
        nettx_bw: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETTX_BW",
                "type": "Element",
            },
        )
        nettx_bw_forecast: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETTX_BW_FORECAST",
                "type": "Element",
            },
        )
        nettx_bw_forecast_far: Optional[Decimal] = field(
            default=None,
            metadata={
                "name": "NETTX_BW_FORECAST_FAR",
                "type": "Element",
            },
        )
        timestamp: Optional[int] = field(
            default=None,
            metadata={
                "name": "TIMESTAMP",
                "type": "Element",
            },
        )
        any_element: list[object] = field(
            default_factory=list,
            metadata={
                "type": "Wildcard",
                "process_contents": "skip",
            },
        )

        @dataclass
        class DiskSize:
            id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ID",
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
    class Template:
        automatic_ds_requirements: Optional[str] = field(
            default=None,
            metadata={
                "name": "AUTOMATIC_DS_REQUIREMENTS",
                "type": "Element",
            },
        )
        automatic_nic_requirements: Optional[str] = field(
            default=None,
            metadata={
                "name": "AUTOMATIC_NIC_REQUIREMENTS",
                "type": "Element",
            },
        )
        automatic_requirements: Optional[str] = field(
            default=None,
            metadata={
                "name": "AUTOMATIC_REQUIREMENTS",
                "type": "Element",
            },
        )
        cloning_template_id: Optional[str] = field(
            default=None,
            metadata={
                "name": "CLONING_TEMPLATE_ID",
                "type": "Element",
            },
        )
        context: Optional[object] = field(
            default=None,
            metadata={
                "name": "CONTEXT",
                "type": "Element",
            },
        )
        cpu: Optional[str] = field(
            default=None,
            metadata={
                "name": "CPU",
                "type": "Element",
            },
        )
        cpu_cost: Optional[str] = field(
            default=None,
            metadata={
                "name": "CPU_COST",
                "type": "Element",
            },
        )
        disk: list["Vm.Template.Disk"] = field(
            default_factory=list,
            metadata={
                "name": "DISK",
                "type": "Element",
            },
        )
        disk_cost: Optional[str] = field(
            default=None,
            metadata={
                "name": "DISK_COST",
                "type": "Element",
            },
        )
        emulator: Optional[str] = field(
            default=None,
            metadata={
                "name": "EMULATOR",
                "type": "Element",
            },
        )
        features: Optional[object] = field(
            default=None,
            metadata={
                "name": "FEATURES",
                "type": "Element",
            },
        )
        hyperv_options: Optional[object] = field(
            default=None,
            metadata={
                "name": "HYPERV_OPTIONS",
                "type": "Element",
            },
        )
        graphics: Optional[object] = field(
            default=None,
            metadata={
                "name": "GRAPHICS",
                "type": "Element",
            },
        )
        video: Optional["Vm.Template.Video"] = field(
            default=None,
            metadata={
                "name": "VIDEO",
                "type": "Element",
            },
        )
        imported: Optional[str] = field(
            default=None,
            metadata={
                "name": "IMPORTED",
                "type": "Element",
            },
        )
        input: Optional[object] = field(
            default=None,
            metadata={
                "name": "INPUT",
                "type": "Element",
            },
        )
        memory: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY",
                "type": "Element",
            },
        )
        memory_cost: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY_COST",
                "type": "Element",
            },
        )
        memory_max: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY_MAX",
                "type": "Element",
            },
        )
        memory_slots: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY_SLOTS",
                "type": "Element",
            },
        )
        memory_resize_mode: Optional[str] = field(
            default=None,
            metadata={
                "name": "MEMORY_RESIZE_MODE",
                "type": "Element",
            },
        )
        nic: list["Vm.Template.Nic"] = field(
            default_factory=list,
            metadata={
                "name": "NIC",
                "type": "Element",
            },
        )
        nic_alias: list["Vm.Template.NicAlias"] = field(
            default_factory=list,
            metadata={
                "name": "NIC_ALIAS",
                "type": "Element",
            },
        )
        nic_default: Optional[object] = field(
            default=None,
            metadata={
                "name": "NIC_DEFAULT",
                "type": "Element",
            },
        )
        numa_node: Optional[object] = field(
            default=None,
            metadata={
                "name": "NUMA_NODE",
                "type": "Element",
            },
        )
        os: Optional[object] = field(
            default=None,
            metadata={
                "name": "OS",
                "type": "Element",
            },
        )
        pci: list[object] = field(
            default_factory=list,
            metadata={
                "name": "PCI",
                "type": "Element",
            },
        )
        raw: Optional[object] = field(
            default=None,
            metadata={
                "name": "RAW",
                "type": "Element",
            },
        )
        security_group_rule: list[object] = field(
            default_factory=list,
            metadata={
                "name": "SECURITY_GROUP_RULE",
                "type": "Element",
            },
        )
        snapshot: list["Vm.Template.Snapshot"] = field(
            default_factory=list,
            metadata={
                "name": "SNAPSHOT",
                "type": "Element",
            },
        )
        spice_options: Optional[object] = field(
            default=None,
            metadata={
                "name": "SPICE_OPTIONS",
                "type": "Element",
            },
        )
        submit_on_hold: Optional[str] = field(
            default=None,
            metadata={
                "name": "SUBMIT_ON_HOLD",
                "type": "Element",
            },
        )
        template_id: Optional[str] = field(
            default=None,
            metadata={
                "name": "TEMPLATE_ID",
                "type": "Element",
            },
        )
        tm_mad_system: Optional[str] = field(
            default=None,
            metadata={
                "name": "TM_MAD_SYSTEM",
                "type": "Element",
                "required": True,
            },
        )
        topology: Optional[object] = field(
            default=None,
            metadata={
                "name": "TOPOLOGY",
                "type": "Element",
            },
        )
        vcpu: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCPU",
                "type": "Element",
            },
        )
        vcpu_max: Optional[str] = field(
            default=None,
            metadata={
                "name": "VCPU_MAX",
                "type": "Element",
            },
        )
        vmgroup: Optional[object] = field(
            default=None,
            metadata={
                "name": "VMGROUP",
                "type": "Element",
            },
        )
        vmid: Optional[str] = field(
            default=None,
            metadata={
                "name": "VMID",
                "type": "Element",
                "required": True,
            },
        )
        vrouter_id: Optional[str] = field(
            default=None,
            metadata={
                "name": "VROUTER_ID",
                "type": "Element",
            },
        )
        vrouter_keepalived_id: Optional[str] = field(
            default=None,
            metadata={
                "name": "VROUTER_KEEPALIVED_ID",
                "type": "Element",
            },
        )
        vrouter_keepalived_password: Optional[str] = field(
            default=None,
            metadata={
                "name": "VROUTER_KEEPALIVED_PASSWORD",
                "type": "Element",
            },
        )
        sched_action: list[SchedAction] = field(
            default_factory=list,
            metadata={
                "name": "SCHED_ACTION",
                "type": "Element",
            },
        )

        @dataclass
        class Disk:
            any_element: list[object] = field(
                default_factory=list,
                metadata={
                    "type": "Wildcard",
                    "process_contents": "skip",
                },
            )

        @dataclass
        class Video:
            type_value: Optional[str] = field(
                default=None,
                metadata={
                    "name": "TYPE",
                    "type": "Element",
                },
            )
            iommu: Optional[str] = field(
                default=None,
                metadata={
                    "name": "IOMMU",
                    "type": "Element",
                },
            )
            ats: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ATS",
                    "type": "Element",
                },
            )
            vram: Optional[int] = field(
                default=None,
                metadata={
                    "name": "VRAM",
                    "type": "Element",
                },
            )
            resolution: Optional[str] = field(
                default=None,
                metadata={
                    "name": "RESOLUTION",
                    "type": "Element",
                },
            )

        @dataclass
        class Nic:
            any_element: list[object] = field(
                default_factory=list,
                metadata={
                    "type": "Wildcard",
                    "process_contents": "skip",
                },
            )

        @dataclass
        class NicAlias:
            alias_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ALIAS_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            any_element: list[object] = field(
                default_factory=list,
                metadata={
                    "type": "Wildcard",
                    "process_contents": "skip",
                },
            )
            parent: Optional[str] = field(
                default=None,
                metadata={
                    "name": "PARENT",
                    "type": "Element",
                    "required": True,
                },
            )
            parent_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "PARENT_ID",
                    "type": "Element",
                    "required": True,
                },
            )

        @dataclass
        class Snapshot:
            action: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ACTION",
                    "type": "Element",
                },
            )
            active: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ACTIVE",
                    "type": "Element",
                },
            )
            hypervisor_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "HYPERVISOR_ID",
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
            snapshot_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "SNAPSHOT_ID",
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
            time: Optional[str] = field(
                default=None,
                metadata={
                    "name": "TIME",
                    "type": "Element",
                    "required": True,
                },
            )

    @dataclass
    class UserTemplate:
        any_element: list[object] = field(
            default_factory=list,
            metadata={
                "type": "Wildcard",
                "process_contents": "skip",
            },
        )

    @dataclass
    class HistoryRecords:
        history: list["Vm.HistoryRecords.History"] = field(
            default_factory=list,
            metadata={
                "name": "HISTORY",
                "type": "Element",
            },
        )

        @dataclass
        class History:
            oid: Optional[int] = field(
                default=None,
                metadata={
                    "name": "OID",
                    "type": "Element",
                    "required": True,
                },
            )
            seq: Optional[int] = field(
                default=None,
                metadata={
                    "name": "SEQ",
                    "type": "Element",
                    "required": True,
                },
            )
            hostname: Optional[str] = field(
                default=None,
                metadata={
                    "name": "HOSTNAME",
                    "type": "Element",
                    "required": True,
                },
            )
            hid: Optional[int] = field(
                default=None,
                metadata={
                    "name": "HID",
                    "type": "Element",
                    "required": True,
                },
            )
            cid: Optional[int] = field(
                default=None,
                metadata={
                    "name": "CID",
                    "type": "Element",
                    "required": True,
                },
            )
            stime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "STIME",
                    "type": "Element",
                    "required": True,
                },
            )
            etime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ETIME",
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
            tm_mad: Optional[str] = field(
                default=None,
                metadata={
                    "name": "TM_MAD",
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
            plan_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "PLAN_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            action_id: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ACTION_ID",
                    "type": "Element",
                    "required": True,
                },
            )
            pstime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "PSTIME",
                    "type": "Element",
                    "required": True,
                },
            )
            petime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "PETIME",
                    "type": "Element",
                    "required": True,
                },
            )
            rstime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "RSTIME",
                    "type": "Element",
                    "required": True,
                },
            )
            retime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "RETIME",
                    "type": "Element",
                    "required": True,
                },
            )
            estime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ESTIME",
                    "type": "Element",
                    "required": True,
                },
            )
            eetime: Optional[int] = field(
                default=None,
                metadata={
                    "name": "EETIME",
                    "type": "Element",
                    "required": True,
                },
            )
            action: Optional[int] = field(
                default=None,
                metadata={
                    "name": "ACTION",
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
            request_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "REQUEST_ID",
                    "type": "Element",
                    "required": True,
                },
            )

    @dataclass
    class Snapshots:
        allow_orphans: Optional[str] = field(
            default=None,
            metadata={
                "name": "ALLOW_ORPHANS",
                "type": "Element",
                "required": True,
            },
        )
        current_base: Optional[int] = field(
            default=None,
            metadata={
                "name": "CURRENT_BASE",
                "type": "Element",
                "required": True,
            },
        )
        disk_id: Optional[int] = field(
            default=None,
            metadata={
                "name": "DISK_ID",
                "type": "Element",
                "required": True,
            },
        )
        next_snapshot: Optional[int] = field(
            default=None,
            metadata={
                "name": "NEXT_SNAPSHOT",
                "type": "Element",
                "required": True,
            },
        )
        snapshot: list["Vm.Snapshots.Snapshot"] = field(
            default_factory=list,
            metadata={
                "name": "SNAPSHOT",
                "type": "Element",
            },
        )

        @dataclass
        class Snapshot:
            active: Optional[str] = field(
                default=None,
                metadata={
                    "name": "ACTIVE",
                    "type": "Element",
                },
            )
            children: Optional[str] = field(
                default=None,
                metadata={
                    "name": "CHILDREN",
                    "type": "Element",
                },
            )
            date: Optional[int] = field(
                default=None,
                metadata={
                    "name": "DATE",
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
            name: Optional[str] = field(
                default=None,
                metadata={
                    "name": "NAME",
                    "type": "Element",
                },
            )
            parent: Optional[int] = field(
                default=None,
                metadata={
                    "name": "PARENT",
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
    class Backups:
        backup_config: Optional["Vm.Backups.BackupConfig"] = field(
            default=None,
            metadata={
                "name": "BACKUP_CONFIG",
                "type": "Element",
                "required": True,
            },
        )
        backup_ids: Optional[Ids] = field(
            default=None,
            metadata={
                "name": "BACKUP_IDS",
                "type": "Element",
                "required": True,
            },
        )

        @dataclass
        class BackupConfig:
            backup_job_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "BACKUP_JOB_ID",
                    "type": "Element",
                },
            )
            backup_volatile: Optional[str] = field(
                default=None,
                metadata={
                    "name": "BACKUP_VOLATILE",
                    "type": "Element",
                },
            )
            fs_freeze: Optional[str] = field(
                default=None,
                metadata={
                    "name": "FS_FREEZE",
                    "type": "Element",
                },
            )
            incremental_backup_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "INCREMENTAL_BACKUP_ID",
                    "type": "Element",
                },
            )
            increment_mode: Optional[str] = field(
                default=None,
                metadata={
                    "name": "INCREMENT_MODE",
                    "type": "Element",
                },
            )
            keep_last: Optional[str] = field(
                default=None,
                metadata={
                    "name": "KEEP_LAST",
                    "type": "Element",
                },
            )
            last_backup_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "LAST_BACKUP_ID",
                    "type": "Element",
                },
            )
            last_backup_size: Optional[str] = field(
                default=None,
                metadata={
                    "name": "LAST_BACKUP_SIZE",
                    "type": "Element",
                },
            )
            last_bridge: Optional[str] = field(
                default=None,
                metadata={
                    "name": "LAST_BRIDGE",
                    "type": "Element",
                },
            )
            last_datastore_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "LAST_DATASTORE_ID",
                    "type": "Element",
                },
            )
            last_increment_id: Optional[str] = field(
                default=None,
                metadata={
                    "name": "LAST_INCREMENT_ID",
                    "type": "Element",
                },
            )
            mode: Optional[str] = field(
                default=None,
                metadata={
                    "name": "MODE",
                    "type": "Element",
                },
            )
