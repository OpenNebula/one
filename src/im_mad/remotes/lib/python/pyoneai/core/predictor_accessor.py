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

__all__ = ["PredictorAccessor"]

from typing import TYPE_CHECKING, Any

from .base_accessor import AccessorType, BaseAccessor
from .entity_uid import EntityUID
from .metric_types import MetricAttributes
from .time import Instant, Period
from .tsnumpy.timeseries import Timeseries

if TYPE_CHECKING:
    from ..ml.models import BasePredictionModel


class PredictorAccessor(BaseAccessor):
    __slots__ = ()

    def __init__(
        self,
        prediction_model: BasePredictionModel,
    ) -> None:
        self._prediction_model = prediction_model

    def get_timeseries(
        self,
        entity_uid: EntityUID,
        metric_attrs: MetricAttributes,
        time: Instant | Period,
        *args: Any,
        **kwargs: Any,
    ) -> Timeseries:
        observator_accessor = kwargs.get("observator_accessor")
        if not observator_accessor:
            raise ValueError("Missing 'observator_accessor' in kwargs")
        hist_steps = self._prediction_model.model_config.sequence_length
        if isinstance(time, Instant):
            hist_resolution = time.duration
            time_start = time.value
        else:
            hist_resolution = time.resolution
            time_start = time.start
        hist_start = (
            time_start - hist_resolution
        ) - hist_steps * hist_resolution
        hist_end = time_start - hist_resolution
        hist_period = Period(
            value=slice(hist_start, hist_end, hist_resolution),
            origin=time.origin,
        )
        obs = observator_accessor.get_timeseries(
            entity_uid, metric_attrs, hist_period
        )
        if isinstance(time, Instant):
            predicted_values = self._prediction_model.predict(
                metric=obs, horizon=1
            )
        elif isinstance(time, Period):
            predicted_values = self._prediction_model.predict(
                metric=obs, horizon=len(time.values)
            )
        else:
            raise TypeError(
                "'time' must be an instance of 'Instant' or 'Period'"
            )
        return predicted_values.clip()

    @property
    def type(self) -> AccessorType:
        return AccessorType.PREDICTION
