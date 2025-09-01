from dataclasses import dataclass, field
import enum
from collections.abc import Collection
from typing import Optional, Union


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class Allocation:
    vm_id: int
    host_id: int
    host_dstore_ids: dict[int, int]
    shared_dstore_ids: dict[int, int]
    nics: dict[int, int]


# TODO: Check if `.max_*` and `.total_*` are properly understood.
# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class Capacity:
    total: Union[float, int]
    usage: Union[float, int]

    @property
    def free(self) -> Union[float, int]:
        return self.total - self.usage


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class PCIDevice:
    short_address: str
    vendor_id: str
    device_id: str
    class_id: str
    vm_id: int = -1


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class HostCapacity:
    id: int
    memory: Capacity
    cpu: Capacity
    # The IDs (keys) and capacities (values) for each disk of a host.
    disks: dict[int, Capacity] = field(default_factory=dict)
    disk_io: Optional[Capacity] = None
    net: Optional[Capacity] = None
    pci_devices: list[PCIDevice] = field(default_factory=list)
    cluster_id: int = 0


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class DStoreCapacity:
    id: int
    size: Capacity
    cluster_ids: list[int] = field(default_factory=list)


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class VNetCapacity:
    id: int
    n_free_ip_addresses: int
    cluster_ids: list[int] = field(default_factory=list)


class VMState(enum.Enum):
    PENDING = 'pending'
    RESCHED = 'resched'
    RUNNING = 'running'
    POWEROFF = 'poweroff'


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class PCIDeviceRequirement:
    short_address: str = ''
    vendor_id: str = ''
    device_id: str = ''
    class_id: str = ''


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class PCIDeviceMatch:
    vm_id: int
    requirement: int
    host_id: int
    short_address: str


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class DStoreRequirement:
    id: int
    vm_id: int
    size: int
    # Whether a local disk of the assigned host can be used.
    allow_host_dstores: bool = True
    # The IDs of the matching host disks.
    # Dict {host ID: list of IDs of the matching disks}. If `None`, all
    # host disks are considered matching.
    host_dstore_ids: Optional[dict[int, list[int]]] = None
    # The IDs of the matching shared datastores.
    shared_dstore_ids: list[int] = field(default_factory=list)


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class DStoreMatches:
    vm_id: int
    # The ID or index of the datastore requirement.
    requirement: int
    # The IDs of the hosts (keys), each with the list of IDs of suitable
    # disks (values).
    host_dstores: dict[int, list[int]]
    # The IDs of the shared datastores with suitable storage.
    shared_dstores: list[int]


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class HostMatches:
    hosts: list[int]
    pci_devices: list[PCIDeviceMatch]


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class VMRequirements:
    id: int
    state: Optional[VMState]
    memory: int
    cpu_ratio: float
    cpu_usage: float = float('nan')
    storage: dict[int, DStoreRequirement] = field(default_factory=dict)
    # Read and write operations.
    disk_usage: float = float('nan')
    pci_devices: list[PCIDeviceRequirement] = field(default_factory=list)
    host_ids: Optional[set[int]] = None
    # Whether multiple NICs can be associated to the same VNet.
    share_vnets: bool = False
    # Dict {NIC ID: list of IDs of the VNets that match the NIC}.
    nic_matches: dict[int, list[int]] = field(default_factory=dict)
    # Net usage.
    net_usage: float = float('nan')

    def find_host_matches(
        self,
        host_capacities: Collection[HostCapacity],
        vnet_capacities: Collection[VNetCapacity],
        free: bool = True
    ) -> HostMatches:
        return _find_host_matches(self, host_capacities, vnet_capacities, free)

    def find_storage_matches(
        self,
        host_capacities: Collection[HostCapacity],
        dstore_capacities: Collection[DStoreCapacity],
        free: bool = True
    ) -> list[DStoreMatches]:
        vm_id = self.id
        var_name = 'free' if free else 'total'
        matches: list[DStoreMatches] = []
        for req_id, req in self.storage.items():
            host_dstore_ids: dict[int, list[int]] = {}
            shared_dstore_ids: list[int] = []
            if req.allow_host_dstores:
                # Host disks used as system datastores.
                if req.host_dstore_ids is None:
                    # No constraints. All host disks are considered.
                    for host_cap in host_capacities:
                        disk_matches: list[int] = []
                        for disk_id, disk_cap in host_cap.disks.items():
                            if getattr(disk_cap, var_name) >= req.size:
                                disk_matches.append(disk_id)
                        if disk_matches:
                            host_dstore_ids[host_cap.id] = disk_matches
                else:
                    # Only specified hosts and their disks are
                    # considered.
                    host_caps = {cap.id: cap for cap in host_capacities}
                    for host_id, disk_ids in req.host_dstore_ids.items():
                        disk_caps = host_caps[host_id].disks
                        disk_matches: list[int] = []
                        for disk_id in disk_ids:
                            disk_cap = disk_caps[disk_id]
                            if getattr(disk_cap, var_name) >= req.size:
                                disk_matches.append(disk_id)
                        if disk_matches:
                            host_dstore_ids[host_id] = disk_matches
            else:
                # Shared datastores.
                dstore_caps = {cap.id: cap for cap in dstore_capacities}
                for dstore_id in req.shared_dstore_ids:
                    dstore_cap = dstore_caps[dstore_id]
                    # NOTE: This check is probably redundant.
                    if getattr(dstore_cap.size, var_name) >= req.size:
                        shared_dstore_ids.append(dstore_id)
            # Matches.
            match_ = DStoreMatches(
                vm_id=vm_id,
                requirement=req_id,
                host_dstores=host_dstore_ids,
                shared_dstores=shared_dstore_ids
            )
            matches.append(match_)
        return matches


# @dataclass(frozen=True, slots=True)
@dataclass(frozen=True)
class VMGroup:
    id: int
    affined: bool
    vm_ids: set[int]

    def find_host_matches(
        self,
        vm_requirements: Collection[VMRequirements],
        host_capacities: Collection[HostCapacity],
        vnet_capacities: Collection[VNetCapacity],
        free: bool = True
    ) -> dict[int, HostMatches]:
        if not self.affined:
            return {
                vm_req.id: vm_req.find_host_matches(
                    host_capacities, vnet_capacities, free
                )
                for vm_req in vm_requirements
                if vm_req.id in self.vm_ids
            }

        # TODO: Test filtering according to NIC requirements.
        vm_ids = self.vm_ids
        memory = 0
        cpu_ratio = 0.0
        pci_devices: list[PCIDeviceRequirement] = []
        pci_req_idxs: list[tuple[int, int]] = []
        all_host_ids: list[set[int]] = []
        # NOTE: NIC requirements are used here only for filtering, not
        # for matching, so NIC IDs (the keys) are not relevant.
        all_nic_matches: list[list[int]] = []
        for vm_req in vm_requirements:
            vm_id = vm_req.id
            if vm_id not in vm_ids:
                continue
            memory += vm_req.memory
            cpu_ratio += vm_req.cpu_ratio
            pci_devices += vm_req.pci_devices
            for i in range(len(vm_req.pci_devices)):
                pci_req_idxs.append((vm_id, i))
            if vm_req.host_ids is not None:
                all_host_ids.append(vm_req.host_ids)
            all_nic_matches += vm_req.nic_matches.values()
        group_req = VMRequirements(
            id=-1,
            state=None,
            memory=memory,
            cpu_ratio=cpu_ratio,
            pci_devices=pci_devices,
            host_ids=set.intersection(*all_host_ids) if all_host_ids else None,
            # TODO: Check this logic.
            share_vnets=all(vm_req.share_vnets for vm_req in vm_requirements),
            nic_matches=dict(enumerate(all_nic_matches))
        )
        matches = group_req.find_host_matches(
            host_capacities, vnet_capacities, free
        )
        match_host_ids = matches.hosts
        result = {vm_id: HostMatches(match_host_ids, []) for vm_id in vm_ids}
        for match_ in matches.pci_devices:
            vm_id, req_idx = pci_req_idxs[match_.requirement]
            host_id = match_.host_id
            short_address = match_.short_address
            corr_match = PCIDeviceMatch(vm_id, req_idx, host_id, short_address)
            result[vm_id].pci_devices.append(corr_match)

        return result


def _match_pci_device(
    requirement: PCIDeviceRequirement, pci_device: PCIDevice, free: bool
) -> bool:
    if free and pci_device.vm_id >= 0:
        return False
    return (
        requirement.vendor_id in {pci_device.vendor_id, ''}
        and requirement.device_id in {pci_device.device_id, ''}
        and requirement.class_id in {pci_device.class_id, ''}
    )
    # if requirement.vendor_id and requirement.vendor_id != capacity.vendor_id:
    #     return False
    # if requirement.device_id and requirement.device_id != capacity.device_id:
    #     return False
    # if requirement.class_id and requirement.class_id != capacity.class_id:
    #     return False
    # return True


def _match_pci_devices(
    vm_requirements: VMRequirements, host_capacity: HostCapacity, free: bool
) -> Optional[list[PCIDeviceMatch]]:
    vm_id = vm_requirements.id
    host_id = host_capacity.id
    if free:
        pcids = {
            pcid.short_address: pcid
            for pcid in host_capacity.pci_devices
            if pcid.vm_id == -1
        }
    else:
        pcids = {
            pcid.short_address: pcid for pcid in host_capacity.pci_devices
        }

    all_matches: list[PCIDeviceMatch] = []
    for req_idx, pcid_req in enumerate(vm_requirements.pci_devices):
        if address := pcid_req.short_address:
            # Checking for the required short address.
            if address in pcids:
                # The host can satisfy the requirement `req`.
                pcid_match = PCIDeviceMatch(
                    vm_id=vm_id,
                    requirement=req_idx,
                    host_id=host_id,
                    short_address=address
                )
                all_matches.append(pcid_match)
            else:
                # The host cannot satisfy the requirement `req`. Since
                # one of the VM requirements for PCI devices is not met,
                # the method returns `None`.
                return None
        else:
            # Checking for the required vendor, device, or class.
            matches: list[PCIDeviceMatch] = []
            for address, pcid in pcids.items():
                if _match_pci_device(pcid_req, pcid, free):
                    pcid_match = PCIDeviceMatch(
                        vm_id=vm_id,
                        requirement=req_idx,
                        host_id=host_id,
                        short_address=address
                    )
                    matches.append(pcid_match)
            if matches:
                # The host has at least one PCI device that can
                # satisfy the requirement `req`.
                all_matches += matches
            else:
                # The host has no PCI devices that can satisfy the
                # requirement `req`. Since one of the VM
                # requirements for PCI devices is not met, the
                # method returns `None`.
                return None

    return all_matches


def _find_host_matches(
    vm_requirements: VMRequirements,
    host_capacities: Collection[HostCapacity],
    vnet_capacities: Collection[VNetCapacity],
    free: bool
) -> HostMatches:
    # TODO: Consider if filtering by host ID and capacity is necessary.
    host_caps = {host_cap.id: host_cap for host_cap in host_capacities}

    if vm_requirements.state is VMState.PENDING:
        # # TODO: Consider additional filtering when shared VNets are not
        # # allowed.
        # if not vm_requirements.share_vnets:
        #     all_nic_matches: set[int] = set()
        #     for vnet_ids in vm_requirements.nic_matches.values():
        #         all_nic_matches |= set(vnet_ids)
        #     if len(all_nic_matches) > len(vnet_capacities):
        #         return HostMatches(hosts=[], pci_devices=[])

        # Filter according to NICs. A VM can be allocated to a host only
        # if the cluster of that host can support all NIC requirements.
        # TODO: Test filtering according to NIC requirements.
        # TODO: Consider using a similar approach for disks when there
        # is no appropriate shared storage.
        vnet_caps = {vnet_cap.id: vnet_cap for vnet_cap in vnet_capacities}
        cluster_ids: list[set[int]] = []
        for vnet_ids in vm_requirements.nic_matches.values():
            nic_cluster_ids: set[int] = set()
            for vnet_id in vnet_ids:
                nic_cluster_ids |= set(vnet_caps[vnet_id].cluster_ids)
            cluster_ids.append(nic_cluster_ids)

        if cluster_ids and (common_ids := set.intersection(*cluster_ids)):
            for id_, host_cap in tuple(host_caps.items()):
                if host_cap.cluster_id not in common_ids:
                    del host_caps[id_]

    # Filter according to host IDs.
    if (host_id_reqs := vm_requirements.host_ids) is not None:
        for id_ in tuple(host_caps):
            if id_ not in host_id_reqs:
                del host_caps[id_]

    # Filter according to CPU and memory.
    var_name = 'free' if free else 'total'
    cpu_ratio = vm_requirements.cpu_ratio
    memory = vm_requirements.memory
    for id_, host_cap in tuple(host_caps.items()):
        if (
            getattr(host_cap.cpu, var_name) < cpu_ratio
            or getattr(host_cap.memory, var_name) < memory
        ):
            del host_caps[id_]

    # Filter according to PCI devices.
    pcid_matches: list[PCIDeviceMatch] = []
    if vm_requirements.pci_devices:
        for id_, host_cap in tuple(host_caps.items()):
            matches = _match_pci_devices(vm_requirements, host_cap, free)
            if matches is None:
                del host_caps[id_]
            else:
                pcid_matches += matches

    # Result.
    return HostMatches(hosts=list(host_caps), pci_devices=pcid_matches)
