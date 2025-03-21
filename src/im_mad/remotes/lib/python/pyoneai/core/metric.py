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
    "Metric",
]

from typing import TYPE_CHECKING, Union


from .entity_uid import EntityUID
from .time import Instant, Period


if TYPE_CHECKING:
    from .metric_accessor import MetricAccessor
    from .metric_types import MetricAttributes
    from .tsnumpy.timeseries import Timeseries

class Metric:
    __slots__ = ("_entity_uid", "_attrs", "_accessor")

    _entity_uid: EntityUID
    _attrs: MetricAttributes
    _accessor: MetricAccessor

    def __init__(
        self,
        entity_uid: EntityUID,
        attrs: MetricAttributes,
        accessor: MetricAccessor,
    ) -> None:
        self._entity_uid = entity_uid
        self._attrs = attrs
        self._accessor = accessor

    @property
    def entity_uid(self):
        return self._entity_uid

    @property
    def attributes(self):
        return self._attrs

    @property
    def accessor(self):
        return self._accessor

    def __getitem__(
        self, key: Union[str, slice, Instant, Period]
    ) -> Timeseries:
        time: Instant | Period

        if isinstance(key, str):
            time = Instant(key)
        elif isinstance(key, slice):
            time = Period(key)
        elif isinstance(key, (Instant, Period)):
            time = key
        else:
            raise TypeError(
                "'key' must be an instance of 'str', 'slice', 'Instant', "
                "or 'Period'"
            )
        return self.accessor.get_timeseries(
            self.entity_uid, self.attributes, time
        )
