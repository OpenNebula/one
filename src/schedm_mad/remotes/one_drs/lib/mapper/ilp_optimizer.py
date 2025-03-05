"""Integer Linear Programming Optimizer for OpenNebula Mapper."""

from collections import defaultdict as ddict
from collections.abc import Collection, Mapping
from itertools import chain, combinations
from typing import TYPE_CHECKING, Any, Callable, Literal, Optional, Union

import pulp
from pulp import (
    LpAffineExpression as LinExpr,
    LpMaximize as _MAX,
    LpMinimize as _MIN,
    LpProblem as Model,
    LpSenses as _SENSES,
    LpSolutionOptimal as _OPTIMAL_STATUS,
    LpSolver as Solver,
    LpStatus as _STATUS,
    LpVariable as Var,
    lpSum as sum_,
    value
)

from .mapper import Mapper
from .model import (
    Allocation,
    Capacity,
    DStoreCapacity,
    DStoreMatches,
    HostCapacity,
    HostMatches,
    PCIDeviceMatch,
    VMGroup,
    VMRequirements,
    VMState,
    VNetCapacity
)


# TODO: Consider using grouping instead of inverse matching for all
# relations. It might be slower, but the code might be simpler.
# TODO: Use `defaultdict` for grouping. Also, consider using it for
# inverse matches.


class ILPOptimizer(Mapper):
    __slots__ = (
        "_curr_alloc",
        "_used_host_dstores",
        "_used_shared_dstores",
        "_vm_reqs",
        "_affined_vms",
        "_affined_vm_groups",
        "_anti_affined_vm_groups",
        "_host_caps",
        "_dstore_caps",
        "_vnet_caps",
        "_criteria",
        "_migrations",
        "_balance_constraints",
        "_preemptive",
        "_narrow",
        "_model",
        "_solver",
        "_pcid_matches",
        "_vm_host_matches",
        "_host_vm_matches",
        "_dstore_matches",
        "_x_prev",
        "_x_next",
        "_x_next_vmg",
        "_x_next_affined_idx",
        "_x_pend",
        "_x_pend_vmg",
        "_y",
        "_z",
        "_x_next_dstore_host",
        "_x_next_dstore_shared",
        "_x_vnet",
        "_balance",
        "_x_migr",
        "_n_migr",
        "_n_migr_ub",
        "_max_n_migr_vms",
        "_opt_placement",
    )

    if TYPE_CHECKING:
        _curr_alloc: dict[int, int]
        _used_host_dstores: dict[tuple[int, int], tuple[int, int]]
        _used_shared_dstores: dict[tuple[int, int], int]
        _vm_reqs: dict[int, VMRequirements]
        _affined_vms: dict[int, int]
        _affined_vm_groups: dict[int, VMGroup]
        _anti_affined_vm_groups: dict[int, VMGroup]
        _host_caps: dict[int, HostCapacity]
        _dstore_caps: dict[int, DStoreCapacity]
        _vnet_caps: dict[int, VNetCapacity]
        _criteria: Optional[Union[str, Mapping, Callable]]
        _migrations: bool
        _balance_constraints: dict[str, float]
        _preemptive: bool
        _narrow: bool
        _model: Model
        _solver: Solver
        _pcid_matches: list[PCIDeviceMatch]
        _vm_host_matches: dict[int, list[HostCapacity]]
        _host_vm_matches: dict[int, list[VMRequirements]]
        _dstore_matches: list[DStoreMatches]
        _x_prev: set[tuple[int, int]]
        _x_next: dict[tuple[int, int], Union[Var, float]]
        _x_next_vmg: dict[tuple[int, int], Var]
        _x_next_affined_idx: set[tuple[int, int]]
        _x_pend: dict[tuple[int, Literal[-1]], Union[Var, float]]
        _x_pend_vmg: dict[tuple[int, Literal[-1]], Var]
        _y: dict[int, Var]
        _z: dict[tuple[int, int, int, str], Var]
        _x_next_dstore_host: dict[tuple[int, int, int, int], Union[Var, float]]
        _x_next_dstore_shared: dict[tuple[int, int, int], Union[Var, float]]
        _x_vnet: dict[tuple[int, int, int], Var]
        _balance: dict[str, Var]
        _x_migr: dict[tuple[int, int], Union[Var, float]]
        _n_migr: dict[int, Union[LinExpr, float]]
        _n_migr_ub: Optional[int]
        _max_n_migr_vms: int
        _opt_placement: dict[int, Optional[Allocation]]

    def __init__(
        self,
        # VM-host allocations: {vm_id: host_id}.
        current_placement: Mapping[int, int],
        # Local host datastores already assigned to VMs:
        # {(vm_id, dstore_req_id): disk_id}.
        used_host_dstores: Mapping[tuple[int, int], int],
        # Shared datastores already assigned to VMs:
        # {(vm_id, dstore_req_id): dstore_id}.
        used_shared_dstores: Mapping[tuple[int, int], int],
        vm_requirements: Collection[VMRequirements],
        vm_groups: Collection[VMGroup],
        host_capacities: Collection[HostCapacity],
        dstore_capacities: Collection[DStoreCapacity],
        vnet_capacities: Collection[VNetCapacity],
        criteria: Any,
        # migrations: Optional[bool] = None,
        allowed_migrations: Optional[int] = None,
        balance_constraints: Optional[Mapping[str, float]] = None,
        preemptive: bool = False,
        **kwargs
    ) -> None:
        # Capturing the inputs.

        # Current VM ID -> host ID allcations.
        self._curr_alloc = dict(current_placement)

        # Current VM ID and storage requirement index -> host ID and
        # local disk ID allocations.
        self._used_host_dstores = {
            (vm_id, dstore_req_id): (current_placement[vm_id], disk_id)
            for (vm_id, dstore_req_id), disk_id in used_host_dstores.items()
        }

        # Current VM ID and storage requirement index -> shared
        # datastore ID allocations.
        self._used_shared_dstores = dict(used_shared_dstores)

        # VM requirements.
        self._vm_reqs = all_vm_reqs = {
            vm_req.id: vm_req for vm_req in vm_requirements
        }
        waiting_states = {VMState.PENDING, VMState.RESCHED}
        all_waiting = all(
            vm_req.state in waiting_states for vm_req in vm_requirements
        )
        # any_running = any(vm_req.state == 3 for vm_req in vm_requirements)

        # VM groups.
        # VM ID -> Affined VM group ID.
        affined_vms: dict[int, int] = {}
        # Affined VM group ID -> VM group.
        affined_vm_groups: dict[int, VMGroup] = {}
        # Anti-affined VM group ID -> VM group.
        anti_affined_vm_groups: dict[int, VMGroup] = {}
        for vmg in vm_groups:
            if vmg.affined:
                vmg_id = vmg.id
                for vm_id in vmg.vm_ids:
                    affined_vms[vm_id] = vmg_id
                affined_vm_groups[vmg_id] = vmg
            else:
                anti_affined_vm_groups[vmg.id] = vmg
        self._affined_vms = affined_vms
        self._affined_vm_groups = affined_vm_groups
        self._anti_affined_vm_groups = anti_affined_vm_groups

        # Host capacities.
        self._host_caps = all_host_caps = {
            host_cap.id: host_cap for host_cap in host_capacities
        }

        # Shared datastore capacities. Transformed to match only one
        # cluster.
        # Datastore ID -> used storage.
        used_storage: dict[int, int] = {}
        for (vm_id, req_id), dstore_id in self._used_shared_dstores.items():
            if dstore_id not in used_storage:
                used_storage[dstore_id] = 0
            used_storage[dstore_id] += all_vm_reqs[vm_id].storage[req_id].size
        all_dstore_caps: dict[int, DStoreCapacity]
        self._dstore_caps = all_dstore_caps = {}
        for dstore_cap in dstore_capacities:
            dstore_id = dstore_cap.id
            used = used_storage.get(dstore_id, 0)
            all_dstore_caps[dstore_id] = DStoreCapacity(
                id=dstore_id,
                size=Capacity(dstore_cap.size.free + used, used),
                cluster_ids=dstore_cap.cluster_ids
            )

        # VNet capacities.
        self._vnet_caps = {
            vnet_cap.id: vnet_cap for vnet_cap in vnet_capacities
        }

        # Balance constraints.
        balanced_vars = {'cpu_usage', 'cpu_ratio', 'memory'}
        if balance_constraints is None:
            self._balance_constraints = {}
        else:
            self._balance_constraints = dict(balance_constraints)
        if not self._balance_constraints.keys() <= balanced_vars:
            names = self._balance_constraints.keys() - balanced_vars
            raise ValueError(f"'balance_constraints' {names} are not allowed")

        # Mapping criteria.
        balance_criteria = {f'{name}_balance' for name in balanced_vars}
        if isinstance(criteria, Mapping):
            self._criteria: dict[str, float] = {}
            for var_name, var_weight in criteria.items():
                if var_name not in balance_criteria:
                    raise ValueError(f"'criteria' cannot be '{var_name}'")
                self._criteria[var_name[:-8]] = float(var_weight)
        elif criteria in balance_criteria:
            self._criteria = {criteria[:-8]: 1.0}
        else:
            self._criteria = criteria

        # Whether migrations are allowed.
        # TODO: Add `migrations` as a parameter.
        migrations = None
        if migrations is None:
            self._migrations = not all_waiting
        else:
            self._migrations = bool(migrations)
        self._n_migr_ub = allowed_migrations

        # Whether preemptive scheduling is allowed.
        if preemptive:
            raise NotImplementedError(
                "'preemptive' must be `False` because preemptive scheduling "
                "is not supported at the moment"
            )
        self._preemptive = bool(preemptive)

        # Whether to use a narrow problem definition (i.e. with free
        # host resources and pending VMs).
        self._narrow = free = (
            all_waiting and not preemptive and not self._migrations
        )

        # Model.
        name = kwargs.pop('name', 'opennebula-scheduling-problem')
        sense = kwargs.pop('sense', 'min').lower()
        self._model = Model(name=name, sense={'max': _MAX, 'min': _MIN}[sense])
        solver = kwargs.pop('solver', None)
        if solver is None or isinstance(solver, Solver):
            self._solver = solver
        else:
            self._solver = pulp.getSolver(solver, **kwargs)

        # Matching VMs and hosts.
        # Host and PCI device matches for the VMs inside affined VM groups.
        all_non_pend_affined_vm_ids = {
            vm_id
            for vm_id in affined_vms
            if all_vm_reqs[vm_id].state is not VMState.PENDING
        }

        affined_vm_matches: dict[int, HostMatches] = {}
        for vmg in affined_vm_groups.values():
            if (
                (non_pend_vm_ids := all_non_pend_affined_vm_ids & vmg.vm_ids)
                and len(vmg.vm_ids) > len(non_pend_vm_ids)
            ):
                # If there are both pending and non-pending VMs in an
                # affined group, common hosts are determined only for
                # the non-pending ones.
                vmg_ = VMGroup(id=-1, affined=True, vm_ids=non_pend_vm_ids)
            else:
                vmg_ = vmg

            affined_vm_matches |= vmg_.find_host_matches(
                vm_requirements, host_capacities, vnet_capacities, free
            )

        # Suitable VM requirements and PCI devices.
        pcid_matches: list[PCIDeviceMatch] = []
        # Suitable {VM ID: [HostCapacity]} pairs.
        vm_host_matches: dict[int, list[HostCapacity]] = {}
        for vm_id, vm_req in all_vm_reqs.items():
            matches = (
                affined_vm_matches.get(vm_id)
                or vm_req.find_host_matches(
                    host_capacities, vnet_capacities, free
                )
            )
            pcid_matches += matches.pci_devices
            vm_host_matches[vm_id] = [
                all_host_caps[host_id] for host_id in matches.hosts
            ]
        self._pcid_matches = pcid_matches
        self._vm_host_matches = vm_host_matches

        # Suitable {host ID: [VMRequirements]} combinations.
        host_vm_matches: dict[int, list[VMRequirements]] = {}
        for vm_id, host_caps in vm_host_matches.items():
            vm_req = all_vm_reqs[vm_id]
            for host_cap in host_caps:
                if host_cap.id in host_vm_matches:
                    host_vm_matches[host_cap.id].append(vm_req)
                else:
                    host_vm_matches[host_cap.id] = [vm_req]
        self._host_vm_matches = host_vm_matches

        # List of DStoreMatches.
        all_dstore_matches: list[DStoreMatches] = []
        self._dstore_matches = all_dstore_matches = []
        for vm_id, vm_req in all_vm_reqs.items():
            dstore_matches = vm_req.find_storage_matches(
                host_capacities=vm_host_matches[vm_id],
                dstore_capacities=all_dstore_caps.values(),
                free=free
            )
            all_dstore_matches += dstore_matches

        # Data structures associated to the decision variables.
        # Set of the tuples (vm_id, host_id) representing the current
        # allocations. Use it like this:
        # `float((vm_id, host_id) in self._x_prev)`.
        self._x_prev = set(self._curr_alloc.items())
        # Dict {(vm_id, host_id): x}, where x is a decision variable
        # that represents potential new allocations.
        self._x_next = {}
        # Dict {(vmg_idx, host_id): x}, where x is a decision variable
        # that represents potential new allocations for all affined VMs
        # in a group.
        self._x_next_vmg = {}
        # Set {(vm_id, host_id)} that contains all allocations that
        # correspond to a common decision variable related to an affined
        # VM group.
        self._x_next_affined_idx = set()
        # Dict {(vm_id, -1): x}, where x is a decision variable that
        # represents whether a VM will be left pending.
        self._x_pend = {}
        # Dict {(vm_id, -1): x}, where x is a decision variable that
        # represents whether all affined VMs from a group will be left
        # pending.
        self._x_pend_vmg = {}
        # Dict {host_id: y}, where y is a decision variable that
        # represents whether a host will be used (have at least 1 VM).
        self._y = {}
        # Dict {(vm_id, vm_req_idx, host_id, pcid_address): z}, where z
        # is a decision variable that determines if the PCI device with
        # the given address, that belong to the given host will be used
        # to satisfy the specified requirement of the VM.
        self._z = {}
        # Dict {(vm_id, vm_dstore_req_id, host_id, host_disk_id): x},
        # where x is a decision variable that determines whether a
        # local disk of the host will be used for the requirement of VM.
        self._x_next_dstore_host = {}
        # Dict {(vm_id, vm_dstore_req_id, datastore_id): x}, where x is
        # a decision variable that determines whether the cluster
        # datastore will be used for the VM.
        self._x_next_dstore_shared = {}
        # Dict {(vm_id, nic_id, vnet_id): x}, where x is a  decision
        # variable that denotes if the VM NIC will be connected to the
        # VNet.
        self._x_vnet = {}
        # Dict {quantity_name: max_value}, where quantity_name is
        # 'cpu_usage', 'cpu_ratio', or 'memory', and max_value is
        # maximal allowed share for each host.
        self._balance = {}
        # Dict {(VM ID, host ID): m} that shows if a VM is going to
        # migrate to a particular host (m = 1) or not (m = 0).
        self._x_migr: dict[tuple[int, int], Union[Var, float]] = {}
        # Dict {VM ID: n} that shows if a VM is going to migrate at all
        # (n = 1) or not (n = 0).
        self._n_migr: dict[int, Union[LinExpr, float]] = {}
        # Maximal possible number of migrations for all VMs.
        self._max_n_migr_vms: int = 0
        # Optimization result with {VM ID: Allocation} placements.
        self._opt_placement: dict[int, Optional[Allocation]] = {}

    def _add_variables(self) -> None:
        x_next = self._x_next
        x_next_vmg = self._x_next_vmg
        x_next_affined_idx = self._x_next_affined_idx
        x_pend = self._x_pend
        x_pend_vmg = self._x_pend_vmg
        y = self._y
        z = self._z
        x_next_dstore_host = self._x_next_dstore_host
        x_next_dstore_shared = self._x_next_dstore_shared
        used_shared_dstores = self._used_shared_dstores
        x_vnet = self._x_vnet
        vm_reqs = self._vm_reqs
        vm_host_matches = self._vm_host_matches
        affined_vms = self._affined_vms
        no_alloc: tuple[int, Literal[-1]]
        no_alloc_: tuple[int, Literal[-1]]

        for host_id in self._host_vm_matches:
            y_name = f"y_{host_id}"
            y[host_id] = Var(name=y_name, cat="Binary")

        # NOTE: When working with the groups of affined VMs, two cases
        # are observed:
        # 1. All VMs in a group are pending: group initial placement.
        #    All these VMs must go to the same host or remain pending.
        # 2. Some VMs are already allocated and some might be pending.
        #    All the allocated VMs of a group must go to the same host
        #    in the optimal solution. A pending VM might go to the same
        #    host or remain pending.
        # In the case of the narrow problem with pending VMs that should
        # be added to a group, it would be better to specify the target
        # host(s) then to work with a group.
        pend_state = VMState.PENDING
        # The IDs of all the groups of affined VMs that contain only
        # pending VMs (group initial placement).
        pend_affined_vmg_ids = {
            vmg_id
            for vmg_id, vmg in self._affined_vm_groups.items()
            if all(vm_reqs[vm_id].state is pend_state for vm_id in vmg.vm_ids)
        }

        # If preemptive scheduling is not allowed, the VMs that are
        # currently allocated cannot be left pending.
        if not self._preemptive:
            for vm_id in self._curr_alloc:
                x_pend[vm_id, -1] = 0.0

        # TODO: If there is no cluster storage for a VM and that VM also
        # cannot use any disk of a host, then `x_next[vm_id, host_id]`
        # should be `0.0`. If there is no storage of a VM at all, then
        # `x_pend[vm_id, -1]` should be `1.0`. This might be especially
        # problematic to implement for affined VM groups.
        for vm_id, host_caps in vm_host_matches.items():
            if not host_caps:
                # TODO: In this case, the check
                # `x_pend.get(no_alloc) == 0.0` should be done. If
                # `True`, it is certain that the problem is infeasible.
                x_pend[vm_id, -1] = 1.0
                continue
            if (
                (vmg_id := affined_vms.get(vm_id)) is not None
                and (
                    vmg_id in pend_affined_vmg_ids
                    or vm_reqs[vm_id].state is not pend_state
                )
            ):
                for host_cap in host_caps:
                    host_id = host_cap.id
                    if (alloc_ := (vmg_id, host_id)) not in x_next_vmg:
                        x_name = f"x_ag_{vmg_id}_{host_id}"
                        x_var = Var(name=x_name, cat="Binary")
                        x_next_vmg[alloc_] = x_var
                    x_next[vm_id, host_id] = x_next_vmg[alloc_]
                    x_next_affined_idx.add((vm_id, host_id))
                if (no_alloc := (vm_id, -1)) not in x_pend:
                    if (no_alloc_ := (vmg_id, -1)) not in x_pend_vmg:
                        x_name = f"x_ag_{vmg_id}_{-1}"
                        x_var = Var(name=x_name, cat="Binary")
                        x_pend_vmg[no_alloc_] = x_var
                    x_pend[no_alloc] = x_pend_vmg[no_alloc_]
            else:
                for host_cap in host_caps:
                    host_id = host_cap.id
                    if (alloc := (vm_id, host_id)) not in x_next:
                        x_name = f"x_{vm_id}_{host_id}"
                        x_next[alloc] = Var(name=x_name, cat="Binary")
                if (no_alloc := (vm_id, -1)) not in x_pend:
                    x_name = f"x_{vm_id}_{-1}"
                    x_pend[no_alloc] = Var(name=x_name, cat="Binary")

        for pcid_match in self._pcid_matches:
            vm_id = pcid_match.vm_id
            req_idx = pcid_match.requirement
            host_id = pcid_match.host_id
            pcid_address = pcid_match.short_address
            # NOTE: There are issues with ":" in the name of a variable.
            pcid_address_corr = pcid_address.replace(':', '_')
            z_name = f"z_{vm_id}_{req_idx}_{host_id}_{pcid_address_corr}"
            pcid_match_idx = (vm_id, req_idx, host_id, pcid_address)
            z[pcid_match_idx] = Var(name=z_name, cat="Binary")

        for dstore_match in self._dstore_matches:
            vm_id = dstore_match.vm_id
            req_id = dstore_match.requirement
            if not vm_host_matches[vm_id]:
                continue
            # if self._vm_reqs[vm_id].storage[req_id].size == 0:
            #     continue
            if (vm_id, req_id) in used_shared_dstores:
                dstore_id = used_shared_dstores[vm_id, req_id]
                x_next_dstore_shared[vm_id, req_id, dstore_id] = 1.0
                continue
            for host_id, disk_ids in dstore_match.host_dstores.items():
                for disk_id in disk_ids:
                    x_name_idx = f"{vm_id}_{req_id}_{host_id}_{disk_id}"
                    x_name = f"x_dstore_host_{x_name_idx}"
                    x_var = Var(name=x_name, cat="Binary")
                    x_next_dstore_host[vm_id, req_id, host_id, disk_id] = x_var
            for dstore_id in dstore_match.shared_dstores:
                x_name = f"x_dstore_shared_{vm_id}_{req_id}_{dstore_id}"
                x_var = Var(name=x_name, cat="Binary")
                x_next_dstore_shared[vm_id, req_id, dstore_id] = x_var

        for vm_id, vm_req in self._vm_reqs.items():
            if vm_req.state is not VMState.PENDING:
                continue
            for nic_id, nic_matches in vm_req.nic_matches.items():
                for vnet_id in nic_matches:
                    vnet_match_idx = (vm_id, nic_id, vnet_id)
                    x_name = f'x_vnet_{vm_id}_{nic_id}_{vnet_id}'
                    x_vnet[vnet_match_idx] = Var(name=x_name, cat="Binary")

    def _add_constraints(self) -> None:
        x_pend = self._x_pend
        x_next = self._x_next
        x_next_vmg = self._x_next_vmg
        x_next_affined_idx = self._x_next_affined_idx
        x_all = x_next | x_pend
        y = self._y
        z = self._z
        x_next_dstore_host = self._x_next_dstore_host
        x_next_dstore_shared = self._x_next_dstore_shared
        attr_name = 'free' if self._narrow else 'total'
        affined_vms = self._affined_vms
        vm_host_matches = self._vm_host_matches
        all_vm_reqs = self._vm_reqs
        all_vnet_caps = self._vnet_caps
        all_dstore_caps = self._dstore_caps
        all_host_caps = self._host_caps
        prev_alloc = self._curr_alloc
        used_host_dstores = self._used_host_dstores
        model = self._model

        # Each VM must be allocated to exactly one host, including the
        # imaginary host with the ID -1. The case when preemptive
        # scheduling is not allowed is handled with predefined zeros in
        # `ILPOptimizer._x_pend`.
        # .. math::
        #    \sum_{j=1}^m X_{ij} = 1, \quad \forall i=1, 2, \ldots, n
        for vm_id, host_caps in vm_host_matches.items():
            all_host_ids = [host_cap.id for host_cap in host_caps]
            all_host_ids.append(-1)
            x_sum = sum_([x_all[vm_id, host_id] for host_id in all_host_ids])
            # It can happen that `x_sum` is a constant. In such a case,
            # (i.e. when `x_sum.expr` is an empty `dict`), no constraint
            # is added.
            if len(x_sum):
                model += (x_sum == 1, f"vm_{vm_id}_to_exactly_one_host")

        # The RAM demanded by all VMs allocated to a host cannot exceed
        # the RAM of that host.
        # .. math::
        #    \sum_{i=1}^n V_i^m X_{ij} \leq H_j^m Y_j, \quad
        #    \forall j=1, 2, \ldots, m
        for host_id, vm_reqs in self._host_vm_matches.items():
            host_cap = all_host_caps[host_id]
            model += (
                sum_(
                    vm_req.memory * x_next[vm_req.id, host_id]
                    for vm_req in vm_reqs
                )
                <= getattr(host_cap.memory, attr_name) * y[host_id],
                f"mem_constraint_for_host_{host_id}",
            )

        # The number of CPU cores demanded by all VMs allocated to a
        # host cannot exceed the number of CPU cores of that host.
        # .. math::
        #    \sum_{i=1}^n V_i^c X_{ij} \leq H_j^c Y_j, \quad
        #    \forall j=1, 2, \ldots, m
        for host_id, vm_reqs in self._host_vm_matches.items():
            host_cap = all_host_caps[host_id]
            model += (
                sum_(
                    vm_req.cpu_ratio * x_next[vm_req.id, host_id]
                    for vm_req in vm_reqs
                )
                <= getattr(host_cap.cpu, attr_name) * y[host_id],
                f"cpu_ratio_constraint_for_host_{host_id}",
            )

        # No VM can be allocated to the host that is not committed
        # (implied by other constraints).
        # .. math::
        #    X_{ij} \leq Y_j, \quad \forall i=1, 2, \ldots, n, \quad
        #    \forall j=1, 2, \ldots, m
        for (vm_id, host_id), x_next_var in x_next.items():
            if (vm_id, host_id) not in x_next_affined_idx:
                model += (
                    x_next_var <= y[host_id],
                    f"vm_{vm_id}_to_committed_host_{host_id}",
                )
        for (vmg_id, host_id), x_next_var in x_next_vmg.items():
            model += (
                x_next_var <= y[host_id],
                f"vm_group_{vmg_id}_to_committed_host_{host_id}",
            )

        # Pending VMs that belong to affined VM groups can either remain
        # pending or be allocated to the host where other VMs from that
        # group are.
        for (vm_id, host_id), x_next_var in x_next.items():
            if (
                (vm_id, host_id) not in x_next_affined_idx
                and (vmg_id := affined_vms.get(vm_id, -1)) != -1
            ):
                model += (
                    x_next[vm_id, host_id] <= x_next_vmg[vmg_id, host_id],
                    f"vm_{vm_id}_to_host_{host_id}_with_group_{vmg_id}",
                )

        # No two anti-affined VMs can be allocated to the same host.
        for vmg_id, vmg in self._anti_affined_vm_groups.items():
            host_ids = {
                vm_id: {host_cap.id for host_cap in vm_host_matches[vm_id]}
                for vm_id in vmg.vm_ids
            }
            # Iterate through all the pairs of VMs in a group.
            for l_vm_id, r_vm_id in combinations(vmg.vm_ids, 2):
                # Iterate through all the common hosts for a pair of
                # VMs.
                for host_id in host_ids[l_vm_id] & host_ids[r_vm_id]:
                    model += (
                        x_next[l_vm_id, host_id] + x_next[r_vm_id, host_id]
                        <= 1,
                        f"vms_{l_vm_id}_and_{r_vm_id}_from_group_{vmg_id}_"
                        f"anti_affined_on_host_{host_id}",
                    )

        # Grouping `z`-variables.
        # TODO: Consider using `itertools.groupby`.
        z_req: dict[tuple[int, int], LinExpr] = {}
        z_pcid: dict[tuple[int, str], LinExpr] = {}
        for (vm_id, req_idx, host_id, pcid_address), z_var in z.items():
            # Grouping by VM requirements.
            # TODO: Reconsider the application of `dict.setdefault`.
            req_sum = z_req.setdefault((vm_id, req_idx), LinExpr())
            req_sum += z_var
            # Grouping by PCI device addresses.
            # NOTE: Only `pcid_address` can be used here as well.
            pcid_sum = z_pcid.setdefault((host_id, pcid_address), LinExpr())
            pcid_sum += z_var

        # A PCI device can be assigned to a VM only if that VM is
        # allocated to the host that owns the device.
        for (vm_id, req_idx, host_id, pcid_address), z_var in z.items():
            model += (
                # NOTE: There are issues with ":" in the name of a variable.
                z_var <= x_next[vm_id, host_id],
                f"pcid_{host_id}_{pcid_address.replace(':', '_')}_allocation_"
                f"constraint_for_requirement_{vm_id}_{req_idx}"
            )

        # One PCI requirement of a VM can correspond to exactly one PCI
        # device.
        for (vm_id, req_idx), req_sum in z_req.items():
            model += (
                req_sum == 1 - x_pend[vm_id, -1],
                f"pcid_requirement_{vm_id}_{req_idx}_1_selection_constraint"
            )

        # A PCI device can be assigned to at most one VM requirement.
        for (host_id, pcid_address), pcid_sum in z_pcid.items():
            model += (
                # NOTE: There are issues with ":" in the name of a variable.
                pcid_sum <= 1,
                f"pcid_{host_id}_{pcid_address.replace(':', '_')}_single_"
                f"assignment_constraint"
            )

        # A VM can use the local storage of a host for a storage
        # requirement only if it is allocated to that host.
        x_vars = x_next_dstore_host
        for (vm_id, req_id, host_id, disk_id), x_var in x_vars.items():
            model += (
                x_var <= x_next[vm_id, host_id],
                f"vm_{vm_id}_requirement_{req_id}_to_host_{host_id}_local_"
                f"storage_disk_{disk_id}_constraint"
            )

        # If a VM that is already scheduled uses a host disk for a
        # storage requirement and does not migrate, the used disk
        # remains the same.
        x_vars = x_next_dstore_host
        resched_state = VMState.RESCHED
        for vm_id, vm_req in self._vm_reqs.items():
            if all_vm_reqs[vm_id].state is not resched_state:
                continue
            for req_id in vm_req.storage:
                if (vm_id, req_id) not in used_host_dstores:
                    continue
                prev_host_id, prev_disk_id = used_host_dstores[vm_id, req_id]
                # NOTE: This is probably redundant.
                if prev_host_id != prev_alloc.get(vm_id, -1):
                    continue
                idx = (vm_id, req_id, prev_host_id, prev_disk_id)
                model += (
                    x_next_dstore_host[idx] >= x_next[vm_id, prev_host_id],
                    f"vm_{vm_id}_requirement_{req_id}_remains_on_"
                    f"{prev_host_id}_disk_{prev_disk_id}_no_migration"
                )

        # Grouping `x_dstore` variables by VM requirements.
        x_dstore_req: ddict[tuple[int, int], LinExpr] = ddict(LinExpr)
        x_next_dstore = chain(
            x_next_dstore_host.items(), x_next_dstore_shared.items()
        )
        for (vm_id, req_id, *_), x_var in x_next_dstore:
            x_dstore_req[vm_id, req_id] += x_var
        # NOTE: This part takes into account VMs without matches.
        for vm_id, vm_req in all_vm_reqs.items():
            for req_id in vm_req.storage:
                if (vm_id, req_id) not in x_dstore_req:
                    x_dstore_req[vm_id, req_id] = LinExpr()

        # A VM can use exactly one datastore for each storage
        # requirement if it is allocated.
        # TODO: Check what happens if a VM is left pending.
        for (vm_id, req_id), req_sum in x_dstore_req.items():
            model += (
                req_sum == 1 - x_pend[vm_id, -1],
                f"vm_{vm_id}_requirement_{req_id}_single_datastore_constraint"
            )

        # Grouping by hosts and their disks.
        host_disk_usage: ddict[tuple[int, int], LinExpr] = ddict(LinExpr)
        x_vars = x_next_dstore_host
        for (vm_id, req_id, host_id, disk_id), x_var in x_vars.items():
            req_size = all_vm_reqs[vm_id].storage[req_id].size
            host_disk_usage[host_id, disk_id] += x_var * req_size

        # The local storage demanded by all VMs allocated to a host
        # datastore cannot exceed the size of that host datastore.
        for (host_id, disk_id), s_var in host_disk_usage.items():
            disk_cap = all_host_caps[host_id].disks[disk_id]
            model += (
                s_var <= getattr(disk_cap, attr_name) * y[host_id],
                f"storage_constraint_for_host_{host_id}_disk_{disk_id}",
            )

        # Grouping by shared datastores.
        sum_shared_dstore: ddict[int, LinExpr] = ddict(LinExpr)
        for (vm_id, req_id, dstore_id), x_var in x_next_dstore_shared.items():
            req_size = all_vm_reqs[vm_id].storage[req_id].size
            sum_shared_dstore[dstore_id] += x_var * req_size

        # The storage demanded by all VMs allocated to a shared
        # datastore cannot exceed the size of that datastore.
        for dstore_id, s_var in sum_shared_dstore.items():
            dstore_cap = all_dstore_caps[dstore_id].size
            model += (
                s_var <= getattr(dstore_cap, attr_name),
                f"storage_constraint_for_datastore_{dstore_id}",
            )

        # x_vnet[vm_id, nic_id, vnet_id]
        # Grouping `x_vnet`-variables.
        x_vnet_req: dict[tuple[int, int], LinExpr] = {}
        x_vnet_id: dict[int, LinExpr] = {}
        x_vnet_share: ddict[tuple[int, int], LinExpr] = ddict(LinExpr)
        for (vm_id, nic_id, vnet_id), x_vnet_var in self._x_vnet.items():
            # Grouping by VM requirements.
            # TODO: Reconsider the application of `dict.setdefault`.
            req_sum = x_vnet_req.setdefault((vm_id, nic_id), LinExpr())
            req_sum += x_vnet_var
            # Grouping by VNet IDs.
            vnet_id_sum = x_vnet_id.setdefault(vnet_id, LinExpr())
            vnet_id_sum += x_vnet_var
            # Grouping by VMs and VNets if shared VNets are not allowed.
            if not all_vm_reqs[vm_id].share_vnets:
                x_vnet_share[vm_id, vnet_id] += x_vnet_var 

        # One NIC requirement of a VM can correspond to exactly one
        # VNet.
        for (vm_id, nic_id), req_sum in x_vnet_req.items():
            model += (
                req_sum == 1 - x_pend[vm_id, -1],
                f"vnet_requirement_{vm_id}_{nic_id}_1_selection_constraint"
            )

        # Number of satisfied NIC requirements by each VNet cannot be
        # greater than the number of free IP addresses of that VNet.
        for vnet_id, vnet_id_sum in x_vnet_id.items():
            model += (
                vnet_id_sum <= all_vnet_caps[vnet_id].n_free_ip_addresses,
                f"vnet_{vnet_id}_ip_address_availability_constraint"
            )

        # For each VM, a particular VNet can satisfy only one NIC
        # requirement if shared VNets are not allowed. Otherwise,
        # `x_vnet_share` is an empty `defaultdict`.
        for (vm_id, vnet_id), vnet_share_sum in x_vnet_share.items():
            model += (
                vnet_share_sum == 1 - x_pend[vm_id, -1],
                f"vm_{vm_id}_vnet_{vnet_id}_1_requirement_constraint"
            )

        # Grouping allocations by clusters.
        # Dict {(vm_id, cluster_id): x}, where x is an expression that
        # denotes if the VM is allocated to any host that is a part of
        # cluster.
        x_cluster: dict[tuple[int, int], LinExpr] = {}
        for vm_id, host_caps in vm_host_matches.items():
            for host_cap in host_caps:
                # TODO: Reconsider the application of `dict.setdefault`.
                alloc = (vm_id, host_cap.cluster_id)
                if alloc not in x_cluster:
                    x_cluster[alloc] = LinExpr()
                x_cluster[alloc] += x_next[vm_id, host_cap.id]

        # A storage requirement of a VM can be satisfied with a
        # datastore only if that VM is allocated to a host that is a
        # part of a cluster which corresponds to that datastore.
        for (vm_id, req_id, dstore_id), x_var in x_next_dstore_shared.items():
            # TODO: Try to make this more efficient.
            x_cluster_sum = LinExpr()
            for cluster_id in all_dstore_caps[dstore_id].cluster_ids:
                if (alloc := (vm_id, cluster_id)) in x_cluster:
                    x_cluster_sum += x_cluster[alloc]
            model += (
                x_var <= x_cluster_sum,
                f"vm_{vm_id}_requirement_{req_id}_datastore_{dstore_id}_"
                "cluster_constraint"
            )

        # A NIC requirement of a VM can be satisfied with a VNet only if
        # that VM is allocated to a host that is a part of a cluster
        # which corresponds to that datastore.
        for (vm_id, nic_id, vnet_id), x_vnet_var in self._x_vnet.items():
            x_cluster_sum = LinExpr()
            for cluster_id in all_vnet_caps[vnet_id].cluster_ids:
                if (alloc := (vm_id, cluster_id)) in x_cluster:
                    x_cluster_sum += x_cluster[alloc]
            model += (
                x_vnet_var <= x_cluster_sum,
                f"vm_{vm_id}_nic_{nic_id}_vnet_{vnet_id}_cluster_constraint"
            )

        if self._n_migr_ub is not None:
            model += (
                sum_(self._n_migr.values()) <= self._n_migr_ub,
                f"max_number_of_migrations_{self._n_migr_ub}_constraint"
            )

        for var_name, bound in self._balance_constraints.items():
            if var_name not in self._balance:
                self._add_balance_variable(name=var_name)
            model += (
                self._balance[var_name] <= bound,
                f"{var_name}_bounded_constraint"
            )

    def _create_expressions(self) -> None:
        # Migration-related expressions.
        # TODO: Make this code conditional, if migrations are allowed.
        prev_alloc = self._curr_alloc
        vm_host_matches = self._vm_host_matches
        x_next = self._x_next
        x_migr = self._x_migr
        n_migr = self._n_migr

        # VMs that can migrate are the VMs that are both:
        # 1. Currently allocated
        # 2. Requested for (re)scheduling
        # This should be an empty set for a narrow problem.
        vm_ids = set(prev_alloc) & set(vm_host_matches)
        for vm_id in vm_ids:
            n_migr[vm_id] = vm_n_migr = LinExpr()
            # Hosts where the VM can migrate to.
            host_ids = {host_cap.id for host_cap in vm_host_matches[vm_id]}
            host_ids.discard(prev_alloc[vm_id])
            for host_id in host_ids:
                x_migr[vm_id, host_id] = migr = x_next[vm_id, host_id]
                vm_n_migr += migr
                self._max_n_migr_vms += 1

    def _add_balance_variable(self, name: str) -> Var:
        model = self._model

        if name.startswith('cpu_'):
            var_name = 'cpu'
        elif name == 'memory':
            var_name = 'memory'
        else:
            raise ValueError(f"'name' cannot be '{name}'")

        x_next = self._x_next
        host_caps = self._host_caps
        max_host_load = Var(name=f"max_host_load_{name}", lowBound=0)
        self._balance[name] = max_host_load

        var_sum = {}
        for host_id, vm_reqs in self._host_vm_matches.items():
            var_sum[host_id] = sum_(
                getattr(vm_req, name) * x_next[vm_req.id, host_id]
                for vm_req in vm_reqs
            )
        if self._narrow:
            for host_id, var in var_sum.items():
                var += getattr(host_caps[host_id], var_name).usage
        for host_id, var in var_sum.items():
            model += (
                var / getattr(host_caps[host_id], var_name).total
                <= max_host_load,
                f"max_{name}_load_for_host_{host_id}",
            )

        return max_host_load

    def _add_balance_objectives(self, objs: dict[str, float]) -> None:
        # Minimize the load disbalance accross the hosts.
        # TODO: Check the approach with both `max_host_load` and
        # `max_host_free`.

        add_var = self._add_balance_variable
        balance_vars = self._balance
        obj = LinExpr()
        sum_weights = sum(objs.values())
        for name, weight in objs.items():
            if name not in balance_vars:
                add_var(name=name)
            obj += (weight / sum_weights) * balance_vars[name]

        # TODO: Reconsider the implementation of both penalties.
        n_pend_vms = sum_(self._x_pend.values())
        pend_penalty = 1.1 * n_pend_vms
        n_migr_vms = sum_(self._n_migr.values())
        migr_penalty = n_migr_vms / (self._max_n_migr_vms * 2 + 1)
        self._model.sense = _MIN
        self._model += obj + pend_penalty + migr_penalty * 0.01

    def _set_objective(self) -> None:
        model = self._model
        if isinstance(self._criteria, dict):
            self._add_balance_objectives(self._criteria)
        elif self._criteria == "migration_count":
            model.sense = _MIN
            model += sum_(self._n_migr.values())
        elif self._criteria == "pack":
            # Minimize the number of used hosts.
            model.sense = _MIN
            n_hosts = sum_(self._y.values())
            # Pending penalty. Leaving a VM unallocated should not
            # decrease the objective value. One unallocated VM might
            # decrease the number of used hosts at most by 1.
            # However, it is penalized by 1.1.
            n_pend_vms = sum_(self._x_pend.values())
            pend_penalty = 1.1 * n_pend_vms
            # Migration penalty. The ties among the objective values
            # of the solutions are resolved in favor of the one with
            # the lowest number of migrations. However, that should
            # not prevent the migrations that reduce the number of
            # used hosts. One additional migration might decrease
            # the number of used hosts by 1 or not at all. If it
            # does, it should happen. That is why the total penalty
            # for all migrations should be < 1.
            # CAVEAT: It is probably *not* a good idea to use just
            # `self._max_n_migr * number` because `self._max_n_migr`
            # might be zero.
            # CAVEAT: A very large divisor might be problematic.
            n_migr_vms = sum_(self._n_migr.values())
            migr_penalty = n_migr_vms / (self._max_n_migr_vms * 2 + 1)
            model += n_hosts + pend_penalty + migr_penalty
        else:
            raise NotImplementedError()

    def _set_opt_placement(self) -> None:
        if self._model.status != _OPTIMAL_STATUS:
            return
        # self._opt_placement = {
        #     vm_id: host_id
        #     for (vm_id, host_id), x_next_var in self._x_next.items()
        #     if round(value(x_next_var))
        # }

        vm_host_matches = self._vm_host_matches
        x_pend = self._x_pend
        x_next = self._x_next
        x_next_dstore_shared = self._x_next_dstore_shared
        x_next_dstore_host = self._x_next_dstore_host
        x_next_dstore_shared = self._x_next_dstore_shared
        x_vnet = self._x_vnet
        opt_placement = self._opt_placement
        for vm_id, vm_req in self._vm_reqs.items():
            # VM is not allocated.
            if round(value(x_pend[vm_id, -1])):
                opt_placement[vm_id] = None
                continue

            # VM is allocated.
            # Searching for the host.
            host_id = -1
            for host_cap in vm_host_matches[vm_id]:
                if round(value(x_next[vm_id, host_cap.id])):
                    host_id = host_cap.id
                    break

            # Searching for the NICs.
            nics: dict[int, int] = {}
            if vm_req.state is VMState.PENDING:
                for nic_id, nic_matches in vm_req.nic_matches.items():
                    for vnet_id in nic_matches:
                        if round(value(x_vnet[vm_id, nic_id, vnet_id])):
                            nics[nic_id] = vnet_id
                            break
            # Adding the allocation for the VM.
            opt_placement[vm_id] = Allocation(
                vm_id=vm_id,
                host_id=host_id,
                host_dstore_ids={},
                shared_dstore_ids={},
                nics=nics
            )

        # TODO: Optimize this part.
        # Searching for the host datastore.
        for (vm_id, req_id, _, disk_id), var in x_next_dstore_host.items():
            vm_placement = opt_placement[vm_id]
            # NOTE: The other condition is probably redundant.
            if round(value(var)) and vm_placement is not None:
                vm_placement.host_dstore_ids[req_id] = disk_id

        # Searching for the shared datastore.
        for (vm_id, req_id, ds_id), var in x_next_dstore_shared.items():
            vm_placement = opt_placement[vm_id]
            # NOTE: The other condition is probably redundant.
            if round(value(var)) and vm_placement is not None:
                vm_placement.shared_dstore_ids[req_id] = ds_id

    def _optimize(self) -> None:
        self._add_variables()
        self._create_expressions()
        self._add_constraints()
        self._set_objective()
        self._model.solve(solver=self._solver)
        self._set_opt_placement()

    def map(self) -> None:
        self._optimize()

    def placements(
        self, top_k: int = 1
    ) -> list[dict[int, Optional[Allocation]]]:
        if top_k == 1:
            return [self._opt_placement]
        raise NotImplementedError()

    def report(self, path: str = "") -> str:
        model = self._model

        out = (
            "STATUS:\n"
            f"  {_STATUS[model.status]}\n"
            f"VARIABLES ({len(model.variables())}):\n"
        )

        x_all = self._x_next
        names = set()
        if self._x_pend:
            # NOTE: This must be a new `dict`:
            x_all = x_all | self._x_pend
        for (vm_id, host_id), x_var in x_all.items():
            if isinstance(x_var, float):
                name, val, kind = "_", x_var, "CONST"
            else:
                name, val, kind = x_var.name, x_var.value(), x_var.cat
            out += f"  {name}={val} ({kind}) (VM_{vm_id} H_{host_id})\n"
            names.add(name)
        for host_id, y_var in self._y.items():
            name, val, kind = y_var.name, y_var.value(), y_var.cat
            out += f"  {name}={val} ({kind}) (H_{host_id})\n"
            names.add(name)
        for (vm_id, req_idx, host_id, pcid_address), z_var in self._z.items():
            name, val, kind = z_var.name, z_var.value(), z_var.cat
            out += (
                f"  {name}={val} ({kind}) "
                f"(VM_{vm_id} REQ_{req_idx} H_{host_id} PCID_{pcid_address})\n"
            )
            names.add(name)
        for (vm_id, nic_id, vnet_id), x_var in self._x_vnet.items():
            name, val, kind = x_var.name, x_var.value(), x_var.cat
            out += (
                f"  {name}={val} ({kind}) "
                f"(VM_{vm_id} NIC_{nic_id} VNET_{vnet_id})\n"
            )
            names.add(name)
        for var in model.variables():
            if var.name not in names:
                out += f"  {var.name}={var.value()}\n"

        out += f"CONSTRAINTS ({len(model.constraints)}):\n"
        for constr in model.constraints.values():
            out += f"  {constr.name}:\n"
            out += f"    {str(constr)}  ({constr.slack})\n"

        out += (
            "OBJECTIVE:\n"
            f"  {_SENSES[model.sense]}\n"
            f"    {str(model.objective).strip()} = {model.objective.value()}\n"
        )

        if path:
            with open(path, mode="w", encoding="utf-8") as file:
                file.write(out)

        return out
