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

import os
from typing import Callable, ClassVar

import numpy as np

from ..core.tsnumpy import Timeseries
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig
from pyoneai.core.entity_uid import EntityType, EntityUID


class FourierPredictionModel(BasePredictionModel):
    __SUPPORTS_CI__: ClassVar[bool] = False

    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self.nbr_freqs_to_keep = model_config.hyper_params.get(
            "nbr_freqs_to_keep", 40
        )

    def _get_freqs_to_keep(self, metric: Timeseries):
        """
        Compute number of FFT strongest frequencies to keep.

        It returns the value of the provided hyper-parameter named
        `nbr_freqs_to_keep` or the number of frequencies in the
        input metric, if it is shorter than `nbr_freqs_to_keep`.
        """
        if self.nbr_freqs_to_keep < 1 or self.nbr_freqs_to_keep > len(metric):
            return len(metric)
        return self.nbr_freqs_to_keep

    def _find_trend_func(self, metric: Timeseries) -> Callable[[int], float]:
        """
        Find trend function for the timeseries.

        Fits the line in the log-transformed timeseries.
        """
        assert metric.ndim == 1
        values = metric.to_array().squeeze()
        trend_coeff = np.polyfit(
            range(len(metric)), np.log(values + 1), 1
        )
        return lambda x: np.exp(np.poly1d(trend_coeff)(x)) - 1

    def _detrend(
        self, metric: Timeseries, trend_func: Callable[[int], float]
    ) -> Timeseries:
        """Remove trend from the timeseries.

        Parameters
        ----------
        metric : Timeseries
            The metric to detrend.
        trend_func : Callable[[int], float]
            The trend function to remove.

        Returns
        -------
        Timeseries
            The detrended timeseries.
        """
        assert metric.ndim == 1
        trend_values = np.array([trend_func(i) for i in range(len(metric))])
        detrended_values = metric.to_array().squeeze() - trend_values
        
        return Timeseries(
            time_idx=metric.time_index,
            metric_idx=np.array([metric.names[0]]),
            entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, -1)]),
            data=detrended_values.reshape(-1, 1, 1),
        )

    def _find_seasonality_func(
        self, detrend_metric: Timeseries
    ) -> Callable[[int], float]:
        """Find FFT seasonality pattern in the detrended timeseries.

        Computes FFT features and leaves just the strongest ones.
        Number of the FFT features to keep are computed based on the
        provided hyper-parameter `nbr_freqs_to_keep` or the length of
        the input metric, if it is shorter than `nbr_freqs_to_keep`.

        Parameters
        ----------
        detrend_metric : Timeseries
            The detrended timeseries.

        Returns
        -------
        Callable[[int], float]
            The seasonality function.
        """
        assert detrend_metric.ndim == 1
        freqs_to_keep = self._get_freqs_to_keep(detrend_metric)
        # Extract data values directly from the data array
        values = detrend_metric.to_array().squeeze()
        fft = np.fft.fft(values)
        strongest_freqs_idx = np.argpartition(abs(fft), -freqs_to_keep)[
            -freqs_to_keep:
        ]
        fft_filtered = np.zeros(len(fft), dtype=np.complex128)
        fft_filtered[strongest_freqs_idx] = fft[strongest_freqs_idx]
        _predicted_vals = np.fft.ifft(fft_filtered).real
        return lambda x: _predicted_vals[x % len(_predicted_vals)]

    def _generate_trend_forecasts(
        self,
        metric: Timeseries,
        trend_func: Callable[[int], float],
        horizon: int,
    ) -> np.ndarray:
        return np.array(
            [trend_func(len(metric) + i + 1) for i in range(horizon)]
        )

    def _generate_seasonal_forecasts(
        self,
        metric: Timeseries,
        seasonal_func: Callable[[int], float],
        horizon: int,
    ) -> np.ndarray:
        return np.array(
            [seasonal_func(len(metric) + i + 1) for i in range(horizon)]
        )

    def _predict_univariate(
        self, metric: Timeseries, horizon: int
    ) -> Timeseries:
        """Predict univariate time series based on FFT features."""
        assert metric.ndim == 1, "Function expects univariate timeseries"
        trend_func = self._find_trend_func(metric)
        detrend_metric = self._detrend(metric, trend_func)
        seasonal_func = self._find_seasonality_func(detrend_metric)

        trend_forecast = self._generate_trend_forecasts(
            metric, trend_func, horizon
        )
        seasonal_forecast = self._generate_seasonal_forecasts(
            detrend_metric, seasonal_func, horizon
        )
        forecast_vals = trend_forecast + seasonal_forecast

        time_index = self._forecast_time_index(metric, horizon)
        return Timeseries(
            time_idx=time_index,
            metric_idx=np.array([metric.names[0]]),
            entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, -1)]),
            data=forecast_vals.reshape(-1, 1, 1)
        )

    def fit(self, metric: Timeseries):
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
            return self._predict_univariate(metric, horizon)
        elif metric.ndim > 1:
            # Get predictions for each metric
            predictions = []
            for i, metric_name in enumerate(metric.names):
                # Extract the single metric using string indexing
                single_metric = metric[metric_name]
                predictions.append(self._predict_univariate(single_metric, horizon))
            
            # Combine predictions into a single multivariate timeseries
            # All predictions should have the same time index since they use the same horizon
            time_idx = predictions[0]._time_idx
            metric_names = np.array([p.names[0] for p in predictions])
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
