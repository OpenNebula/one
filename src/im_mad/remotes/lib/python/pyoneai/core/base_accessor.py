# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import annotations

__all__ = [
    "AccessorType",
    "BaseAccessor",
]

import abc
from enum import Enum
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .entity_uid import EntityUID
    from .metric import MetricAttributes
    from .time import Instant, Period
    from .tsnumpy.timeseries import Timeseries


class AccessorType(Enum):
    OBSERVATION = "Observation"
    PREDICTION = "Prediction"


class BaseAccessor(abc.ABC):

    @property
    @abc.abstractmethod
    def type(self) -> AccessorType:
        raise NotImplementedError()

    @abc.abstractmethod
    def get_timeseries(
        self,
        entity_uid: EntityUID,
        metric_attrs: MetricAttributes,
        time: Instant | Period,
        *args: Any,
        **kwargs: Any,
    ) -> Timeseries:
        raise NotImplementedError()
