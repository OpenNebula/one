from dataclasses import dataclass, field

from lib.models.host import Host


@dataclass
class HostPool:
    class Meta:
        name = "HOST_POOL"

    host: list[Host] = field(
        default_factory=list,
        metadata={
            "name": "HOST",
            "type": "Element",
        },
    )
