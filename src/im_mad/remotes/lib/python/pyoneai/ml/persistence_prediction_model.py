# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems
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

import os
from typing import ClassVar

import numpy as np

from ..core.entity_uid import EntityUID, EntityType
from ..core.tsnumpy.timeseries import Timeseries
from ..core.tsnumpy.index.time import TimeIndex
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig


class PersistencePredictionModel(BasePredictionModel):
    __SUPPORTS_CI__: ClassVar[bool] = False

    def fit(self, metric: Timeseries):
        return self

    def predict(
        self,
        metric: Timeseries,
        horizon: int | None = None,
        forecast_index: TimeIndex | None = None,
    ) -> Timeseries:
        predictions = []
        time_index = self._forecast_time_index(
            metric, horizon, forecast_index
        )    
        horizon = len(time_index)

        for mattr in metric.metrics:
            last_value = metric[mattr].to_array()[-1]
            
            predicted_metric = Timeseries(
                time_idx=time_index,
                metric_idx=np.array([mattr]),
                entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, -1)]),
                data=np.repeat(last_value, horizon).reshape(-1, 1, 1)
            )
            
            predictions.append(predicted_metric)

        # Combine predictions into a single multivariate timeseries
        # All predictions should have the same time index since they use the same horizon
        metric_attributes = np.array([p.metrics[0] for p in predictions])
        entity_uid_idx = predictions[0]._entity_idx.values
        
        # Combine data arrays along the metric dimension (axis=1)
        data_arrays = [p._data for p in predictions]
        combined_data = np.concatenate(data_arrays, axis=1)
        return Timeseries(
            time_idx=time_index.values,
            metric_idx=metric_attributes,
            entity_uid_idx=entity_uid_idx,
            data=combined_data,
        )

    @classmethod
    def load(
        cls,
        model_config: ModelConfig,
        checkpoint: str | os.PathLike | None = None,
    ) -> PersistencePredictionModel:
        return cls(model_config)
