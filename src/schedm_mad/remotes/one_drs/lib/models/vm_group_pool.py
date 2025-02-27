from dataclasses import dataclass, field

from lib.models.vm_group import VmGroup


@dataclass
class VmGroupPool:
    class Meta:
        name = "VM_GROUP_POOL"

    vm_group: list[VmGroup] = field(
        default_factory=list,
        metadata={
            "name": "VM_GROUP",
            "type": "Element",
        },
    )
