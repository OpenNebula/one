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

from ..core.tsnumpy import Timeseries
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig


class FourierPredictionModel(BasePredictionModel):
    __SUPPORTS_CI__: ClassVar[bool] = False

    def __init__(self, model_config: ModelConfig):
        """Initialize the Fourier prediction model.
        
        Parameters
        ----------
        model_config : ModelConfig
            The model configuration
        """
        super().__init__(model_config)
        self.origin = None
        self.trend_func = None
        self.seasonality_func = None


    def _predict_univariate(
        self, metric: Timeseries, horizon: int
    ) -> Timeseries:
        """Predict univariate time series based on FFT features."""
        assert metric.ndim == 1, "Function expects univariate timeseries"

        time_index = self._forecast_time_index(metric, horizon)

        trend_forecast = self.trend_func(time_index, self.origin)
        seasonal_forecast = self.seasonality_func(time_index)

        forecast_vals = trend_forecast + seasonal_forecast

        return forecast_vals

    def fit(self, metric: Timeseries) -> FourierPredictionModel:
        """Fit model by extracting trend and seasonality components.
        
        Parameters
        ----------
        metric : Timeseries
            The univariate timeseries to fit the model to.
            
        Returns
        -------
        FourierPredictionModel
            Self with fitted parameters.
            
        Raises
        ------
        AssertionError
            If input is not a univariate timeseries.
        """
        assert metric.ndim == 1, "Function expects univariate timeseries"

        self.origin = metric._time_idx.origin
        self.trend_func = metric.compute_trend()
        self.seasonality_func = metric.compute_seasonality(self.trend_func)
        
        return self

    def predict(self, metric: Timeseries, horizon: int = 1) -> Timeseries:
        """
        Predict future time series values based on FFT features.

        Parameters
        ----------
        metric : Timeseries
            The historical metric values to use to predict.
        horizon : int, optional
            The number of future time steps to predict, by default 1

        Returns
        -------
        Timeseries
            The predicted future time series with `horizon` values
        """

        if metric.ndim == 1:
            self.fit(metric)
            return self._predict_univariate(metric, horizon)
        
        elif metric.ndim > 1:
            # Get predictions for each metric
            predictions = []
            for i, metric_name in enumerate(metric.names):
                # Extract the single metric using string indexing
                single_metric = metric[metric_name]
                self.fit(single_metric)
                predictions.append(self._predict_univariate(single_metric, horizon))
            
            # Combine predictions into a single multivariate timeseries
            # All predictions should have the same time index since they use the same horizon
            time_idx = predictions[0]._time_idx
            metric_names = np.array([p.metrics[0] for p in predictions])
            entity_uid_idx = predictions[0]._entity_idx.values
            
            # Combine data arrays along the metric dimension (axis=1)
            data_arrays = [p._data for p in predictions]
            combined_data = np.concatenate(data_arrays, axis=1)
            
            return Timeseries(
                time_idx=time_idx,
                metric_idx=metric_names,
                entity_uid_idx=entity_uid_idx,
                data=combined_data
            )
        else:
            raise ValueError("Timeseries does not contain data")

    @classmethod
    def load(
        cls,
        model_config: ModelConfig,
        checkpoint: str | os.PathLike | None = None,
    ) -> FourierPredictionModel:
        return cls(model_config)
