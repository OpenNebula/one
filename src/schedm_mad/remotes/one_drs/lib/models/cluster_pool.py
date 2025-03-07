from dataclasses import dataclass, field

from lib.models.cluster import Cluster


@dataclass
class ClusterPool:
    class Meta:
        name = "CLUSTER_POOL"

    cluster: list[Cluster] = field(
        default_factory=list,
        metadata={
            "name": "CLUSTER",
            "type": "Element",
        },
    )
