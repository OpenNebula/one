from dataclasses import dataclass, field

from lib.models.datastore import Datastore


@dataclass
class DatastorePool:
    class Meta:
        name = "DATASTORE_POOL"

    datastore: list[Datastore] = field(
        default_factory=list,
        metadata={
            "name": "DATASTORE",
            "type": "Element",
        },
    )
