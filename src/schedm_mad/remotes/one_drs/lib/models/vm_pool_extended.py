from dataclasses import dataclass, field

from lib.models.vm import Vm


@dataclass
class VmPool:
    class Meta:
        name = "VM_POOL"

    vm: list[Vm] = field(
        default_factory=list,
        metadata={
            "name": "VM",
            "type": "Element",
        },
    )
