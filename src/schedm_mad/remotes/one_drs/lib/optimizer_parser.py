#!/usr/bin/env python3
# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #

import io
import sys
from dataclasses import replace

import yaml
from pulp import COIN_CMD, COINMP_DLL, GLPK_CMD
from xsdata.formats.dataclass.parsers import XmlParser

from lib.mapper.ilp_optimizer import ILPOptimizer
from lib.mapper.model import (
    Capacity,
    DStoreCapacity,
    DStoreRequirement,
    HostCapacity,
    PCIDevice,
    PCIDeviceRequirement,
    VMGroup,
    VMRequirements,
    VMState,
    VNetCapacity,
)
from lib.models.scheduler_driver_action import SchedulerDriverAction


class OptimizerParser:
    CONFIG_FILE_PATH = "/etc/one/schedulers/one_drs.conf"
    SOLVERS = {"GLPK": GLPK_CMD, "CBC": COIN_CMD, "COINMP": COINMP_DLL}
    DEFAULT_CONFIG = {
        "DEFAULT_SCHED": {
            "SOLVER": "CBC",
            "SOLVER_PATH": "/usr/lib/one/python/pulp/solverdir/cbc/linux/64/cbc",
        },
        "PLACE": {
            "POLICY": "BALANCE",
            "WEIGHTS": {
                "CPU": 1
            },
        },
        "OPTIMIZE": {
            "POLICY": "BALANCE",
            "MIGRATION_THRESHOLD": -1,
            "WEIGHTS": {
                "CPU_USAGE": 1,
            },
        },
        "PREDICTIVE": 0,
        "MEMORY_SYSTEM_DS_SCALE": 0,
        "DIFFERENT_VNETS": True,
    }

    __slots__ = (
        "parser",
        "scheduler_driver_action",
        "config",
        "mode",
        "_plan_id",
        "used_host_dstores",
        "used_shared_dstores",
    )

    def __init__(self, stdin_data: bytes, mode: str):
        self.parser = XmlParser()
        self.parser.config.fail_on_unknown_properties = False
        self.scheduler_driver_action: SchedulerDriverAction = self.parser.parse(
            io.BytesIO(stdin_data), SchedulerDriverAction
        )
        self.config = self._load_config(mode)
        self.mode = mode
        self._plan_id = -1
        self.used_host_dstores, self.used_shared_dstores = {}, {}

    @property
    def plan_id(self) -> int:
        return self._plan_id

    @staticmethod
    def log_general(level: str, message: str):
        # Format: "LEVEL: <message>"
        sys.stderr.write(f"{level}: {message}\n")

    @staticmethod
    def log_vm(level: str, vm_id: int, message: str):
        # Format: "LEVEL: [vm_id] <message>"
        sys.stderr.write(f"{level}: {vm_id} {message}\n")

    @classmethod
    def _load_config(cls, mode: str) -> dict:
        try:
            with open(cls.CONFIG_FILE_PATH, "r") as file:
                config_data = yaml.safe_load(file)
        except Exception as e:
            cls.log_general("ERROR", f"Error loading config: {e}")
            sys.exit(1)

        # Select Policy based on mode
        mode_config = config_data.get(mode.upper(), {})
        default_mode_config = cls.DEFAULT_CONFIG.get(mode.upper(), {})

        if not mode_config:
            cls.log_general(
                "WARNING",
                f"Missing {mode} configuration. Using default options.",
            )
            mode_config = default_mode_config.copy()
        else:
            for key, value in default_mode_config.items():
                if key == "WEIGHTS":
                    continue
                mode_config.setdefault(key, value)

        # Optimizer solver
        default_solver = cls.DEFAULT_CONFIG["DEFAULT_SCHED"]
        default_sched = config_data.get("DEFAULT_SCHED", {})
        solver_name = default_sched.get("SOLVER", "").upper()
        solver_path = default_sched.get("SOLVER_PATH", None)
        if solver_name not in cls.SOLVERS or not solver_path:
            cls.log_general(
                "WARNING",
                f"Invalid or missing solver '{solver_name}' at '{solver_path}'. Using default.",
            )
            solver_name, solver_path = (
                default_solver["SOLVER"],
                default_solver["SOLVER_PATH"],
            )
        solver = cls.SOLVERS[solver_name](msg=False, timeLimit=60, path=solver_path)
        if not solver.available():
            cls.log_general("ERROR", f"Solver {solver_name} is not available.")
            sys.exit(1)

        # Schedule configuration
        sched_config = {}
        sched_config["MEMORY_SYSTEM_DS_SCALE"] = config_data.get(
            "MEMORY_SYSTEM_DS_SCALE", cls.DEFAULT_CONFIG["MEMORY_SYSTEM_DS_SCALE"]
        )
        sched_config["DIFFERENT_VNETS"] = config_data.get(
            "DIFFERENT_VNETS", cls.DEFAULT_CONFIG["DIFFERENT_VNETS"]
        )
        sched_config["PREDICTIVE"] = config_data.get(
            "PREDICTIVE", cls.DEFAULT_CONFIG["PREDICTIVE"]
        )

        return {
            "MODE": mode_config,
            "SOLVER": solver,
            **sched_config,
        }

    def build_optimizer(self) -> ILPOptimizer:
        if self.mode.upper() == "PLACE":
            criteria = self.config["MODE"]["POLICY"].lower()
            if criteria.upper() == "BALANCE":
                weights = self.config["MODE"].get(
                    "WEIGHTS", self.DEFAULT_CONFIG[self.mode.upper()]["WEIGHTS"]
                )
                criteria = self._normalize_weights(weights)
            allowed_migrations = -1
        else:
            cluster_config = self._parse_cluster()
            policy = cluster_config.get("POLICY", self.config["MODE"]["POLICY"])
            allowed_migrations = cluster_config.get(
                "MIGRATION_THRESHOLD", self.config["MODE"]["MIGRATION_THRESHOLD"]
            )
            self.config["PREDICTIVE"] = cluster_config.get(
                "PREDICTIVE", self.config["PREDICTIVE"]
            )
            criteria = (
                self._normalize_weights(cluster_config["WEIGHTS"])
                if policy.upper() == "BALANCE"
                else policy.lower()
            )
            self._plan_id = self.scheduler_driver_action.cluster_pool.cluster[0].id
        vmg, affined_hosts, anti_affined_hosts = self._parse_vm_groups()
        vm_reqs_dict = self._parse_vm_requirements()
        for vm_req in self.scheduler_driver_action.requirements.vm:
            if vm_req.id in affined_hosts:
                # Available hosts are only the affined hosts
                new_host_ids = affined_hosts[vm_req.id]
            elif vm_req.id in anti_affined_hosts:
                # Remove anti-affined hosts from the available host_ids
                current_ids = vm_reqs_dict[vm_req.id].host_ids
                new_host_ids = current_ids - anti_affined_hosts[vm_req.id]
            else:
                continue
            vm_reqs_dict[vm_req.id] = replace(
                vm_reqs_dict[vm_req.id], host_ids=new_host_ids
            )
        return ILPOptimizer(
            current_placement=self._parse_current_placement(),
            used_host_dstores=self.used_host_dstores,
            used_shared_dstores=self.used_shared_dstores,
            vm_requirements=list(vm_reqs_dict.values()),
            vm_groups=vmg,
            host_capacities=self._parse_host_capacities(),
            dstore_capacities=self._parse_datastore_capacities(),
            vnet_capacities=self._parse_vnet_capacities(),
            criteria=criteria,
            preemptive=False,
            allowed_migrations=allowed_migrations if allowed_migrations != -1 else None,
            solver=self.config["SOLVER"],
        )

    def _parse_vm_requirements(self) -> dict[int, VMRequirements]:
        vm_requirements = {}
        for vm_req in self.scheduler_driver_action.requirements.vm:
            for vm in self.scheduler_driver_action.vm_pool.vm:
                if vm.id == vm_req.id:
                    storage = self._build_vm_storage(vm, vm_req)
                    cpu_current = float(vm.monitoring.cpu or 0)
                    cpu_forecast = float(vm.monitoring.cpu_forecast or 0)
                    net_current = float(vm.monitoring.nettx_bw or 0) + float(
                        vm.monitoring.netrx_bw or 0
                    )
                    net_forecast = float(vm.monitoring.nettx_bw_forecast or 0) + float(
                        vm.monitoring.netrx_bw_forecast or 0
                    )
                    disk_current = float(vm.monitoring.diskrdbytes_bw or 0) + float(
                        vm.monitoring.diskwrbytes_bw or 0
                    )
                    disk_forecast = float(
                        vm.monitoring.diskrdbytes_bw_forecast or 0
                    ) + float(vm.monitoring.diskwrbytes_bw_forecast or 0)
                    # Predictive factor only for 'optimize'
                    cpu_usage = (
                        self._apply_predictive_adjustment(cpu_current, cpu_forecast)
                        if self.mode.upper() == "OPTIMIZE"
                        else cpu_current
                    )
                    net_usage = (
                        self._apply_predictive_adjustment(net_current, net_forecast)
                        if self.mode.upper() == "OPTIMIZE"
                        else net_current
                    )
                    disk_usage = (
                        self._apply_predictive_adjustment(disk_current, disk_forecast)
                        if self.mode.upper() == "OPTIMIZE"
                        else disk_current
                    )
                    vm_requirements[int(vm_req.id)] = VMRequirements(
                        id=int(vm_req.id),
                        state=self._map_vm_state(vm.state, vm.lcm_state),
                        memory=int(vm.template.memory),
                        cpu_ratio=float(vm.template.cpu),
                        cpu_usage=cpu_usage,
                        storage=storage,
                        disk_usage=disk_usage,
                        pci_devices=self._build_pci_devices_requirements(
                            vm.template.pci
                        ),
                        host_ids=set(vm_req.hosts.id),
                        share_vnets=not self.config["DIFFERENT_VNETS"],
                        nic_matches={nic.id: nic.vnets.id for nic in vm_req.nic},
                        net_usage=net_usage,
                    )
                else:
                    self._build_used_dstores(vm)
        return vm_requirements

    def _parse_vm_groups(self) -> list[VMGroup]:
        # IDs of the required VMs
        allowed_vm_ids = {vm.id for vm in self.scheduler_driver_action.requirements.vm}
        # OpenNebla VM Groups
        # groups = {group_id: {role_name: set(vm_ids)}}
        groups = {}
        for vm in self.scheduler_driver_action.vm_pool.vm:
            if not vm.template.vmgroup:
                continue
            attrs = {
                child.qname.upper(): child.text
                for child in vm.template.vmgroup.children
            }
            gid, role = int(attrs.get("VMGROUP_ID")), attrs.get("ROLE")
            groups.setdefault(gid, {}).setdefault(role, set()).add(vm.id)
        # Auxiliar dict for creating role to role affinity
        aux_vmg = {}
        # vmg = list[VMGroup]
        vmg, idx = [], 0
        # Dicts for Host-VM Affinity
        # affined_hosts = {vm_id: set(host_ids)}
        # anti_affined_hosts = {vm_id: set(host_ids)}
        affined_hosts, anti_affined_hosts = {}, {}
        # Create VM Groups for VM-VM and Host-VM Affinity
        for group in self.scheduler_driver_action.vm_group_pool.vm_group:
            gid = int(group.id)
            if gid not in groups:
                continue
            for role_obj in group.roles.role:
                if role_obj.name not in groups[gid]:
                    continue
                if (
                    role_obj.host_affined is not None
                    or role_obj.host_anti_affined is not None
                ):
                    target_hosts = (
                        affined_hosts
                        if role_obj.host_affined is not None
                        else anti_affined_hosts
                    )
                    host_list = (
                        role_obj.host_affined or role_obj.host_anti_affined
                    ).split(",")
                    for vm_id in groups[gid][role_obj.name]:
                        # Affined or anti-affined host policies
                        target_hosts.setdefault(vm_id, set()).update(
                            map(int, host_list)
                        )
                if role_obj.policy:
                    vm_group = VMGroup(
                        id=idx,
                        affined=role_obj.policy.upper() == "AFFINED",
                        vm_ids=groups[gid][role_obj.name],
                    )
                    vmg.append(vm_group)
                    aux_vmg[(gid, role_obj.name)] = vm_group
                    idx += 1
                else:
                    # Only for Role-Role affinity or VM-Host affinity
                    vm_group = VMGroup(
                        id=idx, affined=False, vm_ids=groups[gid][role_obj.name]
                    )
                    aux_vmg[(gid, role_obj.name)] = vm_group
                    idx += 1
        # Create VM Groups for Role-Role affinity
        for group in self.scheduler_driver_action.vm_group_pool.vm_group:
            gid = int(group.id)
            if gid not in groups:
                continue
            if not group.template:
                continue
            template_attr = [
                {child.qname.upper(): child.text} for child in group.template.children
            ]
            for attr in template_attr:
                # Affined role to role
                if "AFFINED" in attr:
                    affined_role = VMGroup(id=idx, affined=True, vm_ids=set())
                    for role in attr["AFFINED"].split(", "):
                        if (gid, role) in aux_vmg:
                            affined_role.vm_ids.update(aux_vmg[(gid, role)].vm_ids)
                    # Add affined_role only if there are req vm with affined roles
                    if affined_role.vm_ids:
                        vmg.append(affined_role)
                        idx += 1
                # Anti affined role to role
                elif "ANTI_AFFINED" in attr:
                    anti_affined_role = VMGroup(id=idx, affined=False, vm_ids=set())
                    for role in attr["ANTI_AFFINED"].split(", "):
                        if (gid, role) in aux_vmg:
                            # Join anti-affined VMGroups
                            if not aux_vmg[(gid, role)].affined:
                                anti_affined_role.vm_ids.update(
                                    aux_vmg[(gid, role)].vm_ids
                                )
                            # Create special anti-affined rules for affined roles
                            else:
                                for _role in attr["ANTI_AFFINED"].split(", "):
                                    if _role == role:
                                        continue
                                    for vm_id in aux_vmg[(gid, _role)].vm_ids:
                                        idx += 1
                                        extra_vmg = VMGroup(
                                            idx,
                                            False,
                                            {
                                                sorted(aux_vmg[(gid, role)].vm_ids)[0],
                                                vm_id,
                                            },
                                        )
                                        vmg.append(extra_vmg)
                    # Add anti_affined_role only if there are req vm with anti_affined roles
                    if anti_affined_role.vm_ids:
                        vmg.append(anti_affined_role)
                        idx += 1
        # List of VMGroups that conatin only required VMs
        result, idx = [], 0
        current_placement = self._parse_current_placement()
        for vm_group in vmg:
            target_hosts = affined_hosts if vm_group.affined else anti_affined_hosts
            new_group = VMGroup(idx, vm_group.affined, set())
            for vm_id in vm_group.vm_ids:
                if vm_id in allowed_vm_ids:
                    for aux_vm_id in vm_group.vm_ids:
                        if aux_vm_id in current_placement:
                            # Affined or anti-affined host by the placed VMs
                            target_hosts.setdefault(vm_id, set()).add(
                                current_placement[aux_vm_id]
                            )
                    # Return only required VMs
                    # NOTE: If the role has at least 1 running VM, we won't
                    # create a VMGroup for the requested VMs
                    if not (vm_group.vm_ids & current_placement.keys()):
                        new_group.vm_ids.add(vm_id)
            if new_group.vm_ids:
                result.append(new_group)
                idx += 1
        # Merge affined VMGroups
        for i in range(len(result)):
            for j in range(i + 1, len(result)):
                if (
                    result[i].vm_ids.intersection(result[j].vm_ids)
                    and result[i].affined
                    and result[j].affined
                ):
                    result[i].vm_ids.update(result[j].vm_ids)
                    result.pop(j)
        # Return a unique list that contain the affined and antiaffined roles
        # and the dicts with the affined and anti_affined hosts
        return result, affined_hosts, anti_affined_hosts

    def _parse_host_capacities(self) -> list[HostCapacity]:
        return [
            HostCapacity(
                id=int(host.id),
                memory=Capacity(
                    total=host.host_share.max_mem / 1000,
                    usage=self._apply_predictive_adjustment(
                        float(host.monitoring.capacity.used_memory or 0),
                        float(host.monitoring.capacity.used_memory_forecast or 0),
                    )
                    / 1000,
                ),
                cpu=Capacity(
                    total=host.host_share.max_cpu / 100,
                    usage=self._apply_predictive_adjustment(
                        float(host.host_share.cpu_usage or 0),
                        float(host.monitoring.capacity.used_cpu_forecast or 0),
                    )
                    / 100,
                ),
                disks=self._build_disk_capacity(host),
                disk_io=Capacity(total=self._build_disk_io_capacity(host), usage=0.0),
                net=Capacity(total=self._build_net_capacity(host), usage=0.0),
                pci_devices=self._build_pci_devices(host.host_share.pci_devices.pci),
                cluster_id=int(host.cluster_id),
            )
            for host in self.scheduler_driver_action.host_pool.host
        ]

    def _parse_datastore_capacities(self) -> list[DStoreCapacity]:
        return [
            DStoreCapacity(
                id=int(store.id),
                size=Capacity(
                    total=next(
                        (
                            int(c.text)
                            for c in store.template.children
                            if c.qname.upper() == "LIMIT_MB"
                        ),
                        store.total_mb,
                    ),
                    usage=store.used_mb,
                ),
                cluster_ids=store.clusters.id,
            )
            for store in self.scheduler_driver_action.datastore_pool.datastore
        ]

    def _parse_vnet_capacities(self) -> list[VNetCapacity]:
        return [
            VNetCapacity(
                id=int(vnet.id),
                n_free_ip_addresses=int(vnet.ar_pool.ar[0].size)
                - int(vnet.used_leases),
                cluster_ids=vnet.clusters.id,
            )
            for vnet in self.scheduler_driver_action.vnet_pool.vnet
        ]

    def _parse_current_placement(self) -> dict[int, int]:
        return {
            int(vm_id): int(host.id)
            for host in self.scheduler_driver_action.host_pool.host
            for vm_id in host.vms.id
        }

    def _parse_cluster(self) -> dict:
        one_drs = next(
            (
                child
                for child in self.scheduler_driver_action.cluster_pool.cluster[
                    0
                ].template.children
                if child.qname.upper() == "ONE_DRS"
            ),
            None,
        )
        if one_drs is None:
            return {
                **self.config["MODE"].copy(),
                "PREDICTIVE": self.config["PREDICTIVE"],
            }

        migration_threshold = next(
            (
                max(-1, int(child.text))
                for child in one_drs.children
                if child.qname.upper() == "MIGRATION_THRESHOLD"
            ),
            -1,
        )
        policy = next(
            (
                child.text
                for child in one_drs.children
                if child.qname.upper() == "POLICY"
            ),
            None,
        )
        predictive = next(
            (
                OptimizerParser._sanity_check(float(child.text))
                for child in one_drs.children
                if child.qname.upper() == "PREDICTIVE"
            ),
            None,
        )
        weights = self._get_weights(one_drs)

        return {
            "POLICY": policy,
            "MIGRATION_THRESHOLD": migration_threshold,
            "WEIGHTS": weights,
            "PREDICTIVE": predictive,
        }

    @staticmethod
    def _build_pci_devices_requirements(pci_list) -> list[PCIDeviceRequirement]:
        requirements = []
        for pci in pci_list or []:
            attrs = {child.qname.upper(): child.text for child in pci.children}
            requirements.append(
                PCIDeviceRequirement(
                    short_address=attrs.get("SHORT_ADDRESS", ""),
                    vendor_id=attrs.get("VENDOR", ""),
                    device_id=attrs.get("DEVICE", ""),
                    class_id=attrs.get("CLASS", ""),
                )
            )
        return requirements

    @staticmethod
    def _build_pci_devices(pci_list) -> list[PCIDevice]:
        return [
            PCIDevice(
                short_address=pci.short_address,
                vendor_id=pci.vendor,
                device_id=pci.device,
                class_id=pci.class_value,
                vm_id=pci.vmid,
            )
            for pci in pci_list
        ]

    @staticmethod
    def _map_vm_state(state: int, lcm_state: int) -> VMState:
        if state == 3 and lcm_state == 3:
            return VMState.RUNNING
        elif state == 8:
            return VMState.POWEROFF
        elif state == 1:
            return VMState.PENDING
        else:
            return VMState.RUNNING  # TODO: default value

    @staticmethod
    def _get_weights(one_drs):
        weight_map = {
            "CPU_USAGE_WEIGHT": "CPU_USAGE",
            "CPU_WEIGHT": "CPU",
            "MEMORY_WEIGHT": "MEMORY",
            "DISK_WEIGHT": "DISK",
            "NET_WEIGHT": "NET",
        }

        return {
            weight_map[child.qname.upper()]: OptimizerParser._sanity_check(
                float(child.text)
            )
            for child in one_drs.children
            if child.qname.upper() in weight_map
        }

    @staticmethod
    def _sanity_check(value):
        return max(0, min(1, value))

    def _build_vm_storage(self, vm, vm_req):
        _, _, host_ds = self.get_ds_map()
        ds_req = {}
        for req_id, disk in enumerate(vm.template.disk):
            disk_attrs = {e.qname.upper(): e.text for e in disk.any_element}
            snapshot_size = int(disk_attrs.get("DISK_SNAPSHOT_TOTAL_SIZE", 0))
            disk_size = int(disk_attrs.get("SIZE", 0))
            size = snapshot_size + disk_size
            system_ds_usage = 0
            image_ds_usage = 0
            # Volatile
            if disk_attrs.get("TYPE") in ("SWAP", "FS"):
                system_ds_usage += size
            else:
                clone_attr = disk_attrs.get("CLONE")
                if clone_attr is None:
                    host_ds, share_ds, allow = self._build_dstores(vm_req, host_ds)
                    ds_req[req_id] = DStoreRequirement(
                        id=req_id,
                        vm_id=int(vm.id),
                        size=0,
                        allow_host_dstores=allow,
                        host_dstore_ids=host_ds,
                        shared_dstore_ids=share_ds,
                    )
                    continue
                st = (
                    disk_attrs.get("CLONE_TARGET")
                    if clone_attr.upper() == "YES"
                    else disk_attrs.get("LN_TARGET")
                )
                if st == "SELF":
                    image_ds_usage += size
                elif st == "SYSTEM":
                    system_ds_usage += size
            if (
                int(vm.template.memory) > 0
                and self.config["MEMORY_SYSTEM_DS_SCALE"] >= 0
            ):
                system_ds_usage += (
                    int(vm.template.memory) * self.config["MEMORY_SYSTEM_DS_SCALE"]
                )
            ds_id = (
                int(disk_attrs["DATASTORE_ID"])
                if disk_attrs.get("DATASTORE_ID")
                else None
            )
            # image DS req
            if image_ds_usage > 0:
                ds_req[req_id] = DStoreRequirement(
                    id=req_id,
                    vm_id=int(vm.id),
                    size=int(image_ds_usage),
                    allow_host_dstores=False,
                    host_dstore_ids=None,
                    shared_dstore_ids=[ds_id],
                )
            # system DS req
            else:
                host_ds, share_ds, allow = self._build_dstores(vm_req, host_ds)
                ds_req[req_id] = DStoreRequirement(
                    id=req_id,
                    vm_id=int(vm.id),
                    size=int(system_ds_usage),
                    allow_host_dstores=allow,
                    host_dstore_ids=host_ds,
                    shared_dstore_ids=share_ds,
                )
        if not vm.template.disk and vm_req.datastores.id:
            host_ds, share_ds, allow = self._build_dstores(vm_req, host_ds)
            ds_req[0] = DStoreRequirement(
                id=0,
                vm_id=int(vm.id),
                size=0,
                allow_host_dstores=allow,
                host_dstore_ids=host_ds,
                shared_dstore_ids=share_ds,
            )
        return ds_req

    def _build_dstores(self, vm_req, host_ds):
        host_ds, share_ds, allow_host_dstores = {}, [], False
        for _ds_id in vm_req.datastores.id:
            if _ds_id in host_ds.keys():
                (
                    host_ds[host_ds[_ds_id]].append(_ds_id)
                    if _ds_id in host_ds
                    else host_ds[host_ds[_ds_id]]
                )
                allow_host_dstores = True
            else:
                share_ds.append(_ds_id)
        return host_ds, share_ds, allow_host_dstores

    def _build_disk_capacity(self, host):
        return {
            disk.id: Capacity(total=disk.total_mb, usage=disk.used_mb)
            for disk in getattr(host.host_share.datastores, "ds", [])
            if hasattr(disk, "id")
        }

    def _build_used_dstores(self, vm):
        _, _, host_ds = self.get_ds_map()
        vm_hist = vm.history_records.history
        last_rec = max(vm_hist, key=lambda item: item.seq)
        ds_id = last_rec.ds_id
        # Host DS
        if ds_id in host_ds.keys():
            self.used_host_dstores[vm.id, 0] = ds_id
        # Shared system ds or image ds
        else:
            self.used_shared_dstores[vm.id, 0] = ds_id

    def get_ds_map(self) -> tuple[set[int], set[int], dict[int, int]]:
        shared_ds, image_ds = set(), set()
        for ds in self.scheduler_driver_action.datastore_pool.datastore:
            ds_attrs = {
                child.qname.upper(): child.text.upper()
                for child in ds.template.children
            }
            if ds_attrs.get("TYPE") == "IMAGE_DS":
                image_ds.add(int(ds.id))
            # elif ds_attrs.get("SHARED") == "YES":
            else:
                shared_ds.add(int(ds.id))
        host_ds_dict = {
            int(host_ds.id): int(host.id)
            for host in self.scheduler_driver_action.host_pool.host
            for host_ds in getattr(host.host_share.datastores, "ds", [])
            if hasattr(host_ds, "id")
        }
        return shared_ds, image_ds, host_ds_dict

    def get_system_ds(self, host_id):
        host = next(
            (h for h in self.scheduler_driver_action.host_pool.host if h.id == host_id),
            None,
        )
        if not host:
            return None
        for ds in self.scheduler_driver_action.datastore_pool.datastore:
            ds_attrs = {
                child.qname.upper(): child.text.upper()
                for child in ds.template.children
            }
            if (
                ds_attrs.get("TYPE") == "SYSTEM_DS"
                and host.cluster_id in ds.clusters.id
            ):
                return int(ds.id)
        return None

    def _apply_predictive_adjustment(
        self, current: float, forecast: float = None
    ) -> float:
        predictive = self.config.get("predictive", 0)
        if predictive > 0 and forecast > 0:
            return current * (1 - predictive) + forecast * predictive
        return current

    def _normalize_weights(self, cluster_config):
        keys = ["CPU_USAGE", "CPU", "MEMORY", "DISK", "NET"]
        provided = {
            k: OptimizerParser._sanity_check(cluster_config[k])
            for k in keys
            if k in cluster_config
        }
        if not 0 < sum(provided.values()) <= 1:
            provided = self.DEFAULT_CONFIG[self.mode.upper()]["WEIGHTS"].copy()
        result = {}
        for key, weight in provided.items():
            lower_key = key.lower()
            if key == "CPU":
                new_key = f"{lower_key}_ratio"
            elif key in ["DISK", "NET"]:
                new_key = f"{lower_key}_usage"
            else:
                new_key = lower_key
            result[f"{new_key}_balance"] = weight
        return result

    def _get_cluster_placement(self):
        cluster_placement = {}
        for host in self.scheduler_driver_action.host_pool.host:
            cluster_placement.setdefault(host.cluster_id, set()).update(
                set(host.vms.id)
            )
        return cluster_placement

    def _build_disk_io_capacity(self, host) -> float:
        cluster_placement = self._get_cluster_placement()
        if host.cluster_id not in cluster_placement:
            return 0.0

        disk_io = sum(
            float(vm.monitoring.diskrdbytes_bw or 0)
            + float(vm.monitoring.diskwrbytes_bw or 0)
            for vm in self.scheduler_driver_action.vm_pool.vm
            if str(vm.id) in map(str, cluster_placement[host.cluster_id])
        )
        return disk_io

    def _build_net_capacity(self, host) -> float:
        cluster_placement = self._get_cluster_placement()
        if host.cluster_id not in cluster_placement:
            return 0.0

        net = sum(
            float(vm.monitoring.nettx_bw or 0) + float(vm.monitoring.netrx_bw or 0)
            for vm in self.scheduler_driver_action.vm_pool.vm
            if str(vm.id) in map(str, cluster_placement[host.cluster_id])
        )
        return net
