from dataclasses import dataclass, field
from typing import Optional

from lib.models.cluster import Cluster
from lib.models.datastore_pool import DatastorePool
from lib.models.host_pool import HostPool
from lib.models.requirements import Requirements
from lib.models.vm_group_pool import VmGroupPool
from lib.models.vm_pool_extended import VmPool
from lib.models.vnet_pool_extended import VnetPool


@dataclass
class SchedulerDriverAction:
    class Meta:
        name = "SCHEDULER_DRIVER_ACTION"

    vm_pool: Optional[VmPool] = field(
        default=None,
        metadata={
            "name": "VM_POOL",
            "type": "Element",
            "required": True,
        },
    )
    host_pool: Optional[HostPool] = field(
        default=None,
        metadata={
            "name": "HOST_POOL",
            "type": "Element",
            "required": True,
        },
    )
    datastore_pool: Optional[DatastorePool] = field(
        default=None,
        metadata={
            "name": "DATASTORE_POOL",
            "type": "Element",
            "required": True,
        },
    )
    vnet_pool: Optional[VnetPool] = field(
        default=None,
        metadata={
            "name": "VNET_POOL",
            "type": "Element",
            "required": True,
        },
    )
    vm_group_pool: Optional[VmGroupPool] = field(
        default=None,
        metadata={
            "name": "VM_GROUP_POOL",
            "type": "Element",
            "required": True,
        },
    )
    cluster: Optional[Cluster] = field(
        default=None,
        metadata={
            "name": "CLUSTER",
            "type": "Element",
            "required": True,
        },
    )
    requirements: Optional[Requirements] = field(
        default=None,
        metadata={
            "name": "REQUIREMENTS",
            "type": "Element",
            "required": True,
        },
    )
