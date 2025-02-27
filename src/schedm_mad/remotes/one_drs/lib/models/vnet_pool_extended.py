from dataclasses import dataclass, field

from lib.models.vnet import Vnet


@dataclass
class VnetPool:
    class Meta:
        name = "VNET_POOL"

    vnet: list[Vnet] = field(
        default_factory=list,
        metadata={
            "name": "VNET",
            "type": "Element",
        },
    )
