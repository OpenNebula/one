from typing import Optional, Union

from xsdata.formats.dataclass.context import XmlContext
from xsdata.formats.dataclass.serializers import XmlSerializer
from xsdata.formats.dataclass.serializers.config import SerializerConfig

from lib.models.plan import Plan
from lib.models.scheduler_driver_action import SchedulerDriverAction


class OptimizerSerializer:
    __slots__ = ("xml_serializer", "parser")

    def __init__(self, parser):
        xml_config = SerializerConfig(indent="  ", xml_declaration=False)
        xml_context = XmlContext()
        self.xml_serializer = XmlSerializer(context=xml_context, config=xml_config)
        self.parser = parser

    def render(self, output: Union[Plan, SchedulerDriverAction]) -> str:
        return self.xml_serializer.render(output)

    def build_optimizer_output(
        self,
        opt_placement: dict,
    ) -> (Plan, list):
        logs = []
        actions = []
        for vm_id, alloc in opt_placement.items():
            operation = self._get_operation(alloc)
            if operation == "NOOP_DEPLOY":
                logs.append(
                    (vm_id, "ERROR", "Cannot allocate the VM following the constraints")
                )
                continue
            elif operation == "NOOP_RUN":
                logs.append((vm_id, "INFO", "VM already allocated on optimal host"))
                continue
            # Migration or Deploy

            ds_id, shared = self._get_vm_ds(alloc)
            actions.append(
                Plan.Action(
                    vm_id=vm_id,
                    operation=operation,
                    host_id=getattr(alloc, "host_id", None),
                    ds_id=ds_id,
                    nic=[
                        Plan.Action.Nic(nic_id, network_id)
                        for nic_id, network_id in getattr(alloc, "nics", {}).items()
                    ],
                )
            )
            datastore_info = (
                f"using system datastore {ds_id}"
                if shared
                else (f"using host datastore {ds_id}" if ds_id else "without datastore")
            )
            logs.append(
                (
                    vm_id,
                    "INFO",
                    f"Placing VM in host '{alloc.host_id}' {datastore_info}",
                )
            )
        plan = Plan(id=self.parser.plan_id, action=actions)
        return plan, logs

    def _get_vm_ds(self, alloc) -> tuple[int, bool]:
        shared_ds, _, _ = self.parser.get_ds_map()
        if alloc.shared_dstore_ids:
            # NOTE: This can contain both system shared datastores and
            # image datastores. We need the system shared datastore.
            for _ds in alloc.shared_dstore_ids.values():
                if shared_ds and _ds in shared_ds:
                    return _ds, True
        elif alloc.host_dstore_ids:
            # NOTE: The VM can only have one host datastore.
            return next(iter(alloc.dstore_ids)), False
        sys_ds = self.parser.get_system_ds(alloc.host_id)
        return sys_ds, False

    def _get_operation(self, alloc) -> str:
        initial_placement = self.parser._parse_current_placement()
        if alloc:
            placement = initial_placement.get(int(alloc.vm_id))
            if placement is None:
                return "deploy"
            if placement == int(alloc.host_id):
                return "NOOP_RUN"
            if placement != int(alloc.host_id):
                return "migrate"
        else:
            # TODO: not implemented
            # if placement is not None:
            #     return "poweroff"
            return "NOOP_DEPLOY"
