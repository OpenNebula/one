"""Base Class for OpenNebula Mapper."""

import abc
from collections.abc import Collection, Mapping
from typing import Any, Optional

from .model import Allocation, HostCapacity, VMRequirements


class Mapper(abc.ABC):
    __slots__ = ()

    @abc.abstractmethod
    def __init__(
        self,
        current_placement: Mapping[int, int],
        vm_requirements: Collection[VMRequirements],
        host_capacities: Collection[HostCapacity],
        criteria: Any,
        # migrations: Optional[bool] = None,
        allowed_migrations: Optional[int] = None,
        balance_constraints: Optional[Mapping[str, float]] = None,
        preemptive: bool = False,
        **kwargs
    ) -> None:
        raise NotImplementedError()

    @abc.abstractmethod
    def map(self) -> None:
        raise NotImplementedError()

    @abc.abstractmethod
    def placements(
        self, top_k: int = 1
    ) -> list[dict[int, Optional[Allocation]]]:
        raise NotImplementedError()

    @abc.abstractmethod
    def report(self, path: str = "") -> str:
        raise NotImplementedError()
