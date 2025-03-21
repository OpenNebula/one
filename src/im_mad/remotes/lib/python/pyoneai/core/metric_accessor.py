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

__all__ = ["MetricAccessor"]
from numbers import Number
from typing import Union, TYPE_CHECKING

from .base_accessor import BaseAccessor
from .time import Instant, Period
from .tsnumpy.timeseries import Timeseries

if TYPE_CHECKING:
    from .entity_uid import EntityUID
    from .metric import MetricAttributes

class MetricAccessor:
    __slots__ = ("_observator_accessor", "_predictor_accessor")

    def __init__(
        self,
        observator_accessor: BaseAccessor,
        predictor_accessor: BaseAccessor,
    ) -> None:
        self._observator_accessor = observator_accessor
        self._predictor_accessor = predictor_accessor

    def get_timeseries(
        self,
        entity_uid: EntityUID,
        metric_attrs: MetricAttributes,
        time: Union[Instant, Period],
    ) -> Timeseries:
        if isinstance(time, Period):
            past, future = time.split()
            obs, pred = None, None
            if past is not None:
                obs = self._observator_accessor.get_timeseries(
                    entity_uid, metric_attrs, past
                )
            if future is not None:
                pred = self._predictor_accessor.get_timeseries(
                    entity_uid,
                    metric_attrs,
                    future,
                    observator_accessor=self._observator_accessor,
                )
            if pred is None:
                # TODO: obs can be None here and we expect to return just Number or TimeSeries
                return obs
            if obs is None:
                return pred
            return obs.append(pred)

        if isinstance(time, Instant):
            if time.is_past:
                return self._observator_accessor.get_timeseries(
                    entity_uid, metric_attrs, time
                )
            elif time.is_future:
                return self._predictor_accessor.get_timeseries(
                    entity_uid,
                    metric_attrs,
                    time,
                    observator_accessor=self._observator_accessor,
                )
            raise TypeError(
                f"argument {time} should be either Instant or Period"
            )
