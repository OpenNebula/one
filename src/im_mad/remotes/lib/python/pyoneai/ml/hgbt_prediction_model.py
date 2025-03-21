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
import pickle
from pathlib import Path
from typing import Any, ClassVar
from warnings import warn

import numpy as np
from sklearn.model_selection import TimeSeriesSplit


from ..core.metric_types import MetricAttributes
from ..core.entity_uid import EntityUID
from ..core.time import Period
from ..core.tsnumpy.timeseries import Timeseries
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig
from .utils import get_class


class HgbtPredictionModel(BasePredictionModel):
    """
    Implement a Histogram Gradient Boosing tree (HGBT) regressor model.

    The HGBT model is fit on-the-fly during each call of the
    `predict` method.
    """

    # NOTE: does not support CI until CI are enabled in Timeseries class
    __SUPPORTS_CI__: ClassVar[bool] = False
    MIN_N_SPLITS: ClassVar[int] = 200

    is_fit: bool
    _context_length: int
    _max_iter: int
    _compute_ci: bool
    gbrt_mean: Any
    gbrt_q5: Any
    gbrt_q95: Any

    def __init__(self, model_config: ModelConfig):
        super().__init__(model_config)
        self._is_fit = False
        self._max_iter = self.model_config.training_params.get("max_iter", 100)
        self._context_length = self.model_config.training_params.get(
            "context_length", 200
        )
        # TODO: change when CI are enabled in Timeseries class
        if self.model_config.compute_ci:
            warn(
                "HgbtPredictionModel does not currently support computation "
                "of confidence intervals. That option will be ignored."
            )
        self._compute_ci = False
        self.gbrt_mean, self.gbrt_q5, self.gbrt_q95 = (
            self._configure_regressors()
        )

    def _configure_regressors(self) -> tuple[Any, Any, Any]:
        gbrt_mean = gbrt_q5 = gbrt_q95 = None
        model_class = get_class(self.model_config.model_class)
        gbrt_mean = model_class(loss="poisson", max_iter=self._max_iter)
        if self._compute_ci:
            gbrt_q5 = model_class(
                loss="quantile", quantile=0.05, max_iter=self._max_iter
            )
            gbrt_q95 = model_class(
                loss="quantile", quantile=0.95, max_iter=self._max_iter
            )
        return (gbrt_mean, gbrt_q5, gbrt_q95)

    def _validate_fit_metric(self, metric: Timeseries):
        index = metric._time_idx
        if not index.is_monotonic_increasing:
            raise ValueError("Time series must be monotonic " "increasing.")
        if not index.is_unique:
            raise ValueError("Time series must have unique index.")

        if len(metric) < self.MIN_N_SPLITS + self._context_length:
            raise ValueError(
                f"The passed context length {self._context_length} "
                f"is too long or the time series is too short ({len(metric)}) "
                "to train a model with the specified number of splits. "
                "Number of observations must be at least "
                f"{self.MIN_N_SPLITS}+<context_length>, in your case:"
                f"({self.MIN_N_SPLITS + self._context_length})."
            )
        if metric.ndim > 1:
            raise ValueError(
                "Histogram-based Gradient Boosting Tree can be "
                "trained for univariate time series only."
            )
        if any(np.isnan(metric.values)):
            raise ValueError("Time series cannot contain NaN values.")

    def _validate_forecast_metric(self, metric: Timeseries):
        if len(metric) < self._context_length:
            raise ValueError(
                "The passed historical context (time series) on length "
                f"{len(metric)} is too short. It needs to be of the length "
                "not less than predefined conext length "
                f"({self._context_length})."
            )

    def _prepare_splits(
        self, metric: Timeseries
    ) -> list[tuple[np.ndarray, np.ndarray]]:
        return list(
            TimeSeriesSplit(
                n_splits=len(metric) - self._context_length,
                max_train_size=self._context_length,
                test_size=1,
            ).split(metric)
        )

    def _get_forecast_index(
        self, metric: Timeseries, horizon: int = 1
    ) -> np.ndarray:

        last_ts = metric.time_index[-1]
        freq = metric._time_idx.frequency

        return Period(
            slice(
                last_ts,
                last_ts + horizon * freq,
                freq,
            )
        ).values[1:]

    def _fit(self, metric: Timeseries) -> None:
        self._validate_fit_metric(metric)
        splits = self._prepare_splits(metric)
        x = np.array([metric.isel(idx[0]).values for idx in splits]).squeeze()
        y = np.array([metric.isel(idx[1]).values for idx in splits]).squeeze()
        self.gbrt_mean.fit(x, y)
        if self._compute_ci:
            self.gbrt_q5.fit(x, y)
            self.gbrt_q95.fit(x, y)

    def fit(
        self,
        metric: Timeseries,
    ) -> HgbtPredictionModel:
        """
        Train the HGBT model with the passed time series.

        Parameters
        ----------
        metric : Timeseries
            The metric used to train the model (univariate or
            multivariate).

        Returns
        -------
        HgbtPredictionModel
            The instance of the fitted HgbtPredictionModel.
        """
        self._fit(metric)
        self._is_fit = True
        return self

    def _forecast_with_ci(
        self,
        metric: MetricAttributes,
        entity_uid: EntityUID,
        x: Timeseries,
        forecast_index: np.ndarray,
        horizon: int,
    ) -> Timeseries:
        preds_mean = []
        preds_q5 = []
        preds_q95 = []

        x_feed = x.values.reshape(1, -1)
        for _ in range(horizon):
            preds_mean.append(self.gbrt_mean.predict(x_feed))
            preds_q5.append(self.gbrt_q5.predict(x_feed))
            preds_q95.append(self.gbrt_q95.predict(x_feed))
            x_feed = np.roll(x_feed, -1)
            # NOTE: simple assigning
            # x_feed[-1] = preds_mean[-1]
            # replaces all values to preds_mean[-1]
            np.put(x_feed, -1, preds_mean[-1])

        # TODO: to be refactored
        return Timeseries(
            time_idx=forecast_index,
            metric_idx=metric,
            entity_uid_idx=entity_uid,
            data=None,
        )

    def _forecast_without_ci(
        self,
        metric: MetricAttributes,
        entity_uid: EntityUID,
        x: Timeseries,
        forecast_index: np.ndarray,
        horizon: int,
    ) -> Timeseries:
        preds_mean = []

        x_feed = x.values.reshape(1, -1)
        for _ in range(horizon):
            preds_mean.append(self.gbrt_mean.predict(x_feed))
            x_feed = np.roll(x_feed, -1)
            # NOTE: simple assigning
            # x_feed[-1] = preds_mean[-1]
            # replaces all values to preds_mean[-1]
            np.put(x_feed, -1, preds_mean[-1])

        return Timeseries(
            time_idx=forecast_index,
            metric_idx=np.array([metric]),
            entity_uid_idx=np.array([entity_uid]),
            data=np.array(preds_mean).reshape(-1, 1, 1),
        )

    def predict(self, metric: Timeseries, horizon: int = 1) -> Timeseries:
        """
        Generate predictions using the HGBT model.

        The HGBT model is fit on-the-fly to the provided metric.

        Parameters
        ----------
        metric : Timeseries
            The metric data (univariate or multivariate) used for
            fitting the HGBT model and making predictions.
        horizon : int
            The number of steps into the future to predict (default
            is 1).

        Returns
        -------
        Timeseries
            A Timeseries object containing the predictions generated by the
            HGBT model.
        """
        self._validate_forecast_metric(metric)
        all_x = metric.isel(slice(-self._context_length, None))
        multivariate = []
        for mattr in metric.metrics:
            for entity_uid in metric.entity_uids:
                x = all_x[mattr]
                if not self._is_fit:
                    # NOTE: fit on the fly
                    self._fit(metric[(mattr, entity_uid)])

                forecast_index = self._get_forecast_index(metric, horizon)

                if self._compute_ci:
                    forecast_ts = self._forecast_with_ci(
                        mattr, entity_uid, x, forecast_index, horizon
                    )
                else:
                    forecast_ts = self._forecast_without_ci(
                        mattr, entity_uid, x, forecast_index, horizon
                    )
                multivariate.append(forecast_ts)
        return Timeseries.merge(*multivariate)

    @classmethod
    def load(
        cls,
        model_config: ModelConfig,
        checkpoint: str | os.PathLike | None = None,
    ) -> HgbtPredictionModel:
        """
        Load an HGBT model with the specified model configuration.

        This method does not utilize checkpoints as HGBT is fit
        on-the-fly during prediction.

        Parameters
        ----------
        model_config : ModelConfig
            The model configuration used to load the HGBT model.
        checkpoint : str or os.PathLike or None
            Path with HGBT checkpoint to load, default is None

        Returns
        -------
        HgbtPredictionModel
            An instance of the HgbtPredictionModel with the loaded
            configuration.
        """
        model = cls(model_config)
        if checkpoint is None:
            return model
        try:
            with open(checkpoint, "rb") as file:
                model.gbrt_mean, model.gbrt_q5, model.gbrt_q95 = pickle.load(
                    file
                )
            return model
        except ValueError:
            raise ValueError(
                f"Failed to load HGBT model from checkpoint {checkpoint}."
            )

    def save(
        self,
        model_config_path: os.PathLike | str,
        checkpoint_path: os.PathLike | str | None = None,
    ) -> None:
        """
        Save the model configuration and state.

        Parameters
        ----------
        model_config_path : os.PathLike or str
            The file path where the model configuration (ModelConfig)
            will be saved.
        checkpoint_path : os.PathLike or str or None
            The file path where the model checkpoint will be saved.
        """
        super().save(model_config_path, checkpoint_path)
        if checkpoint_path:
            checkpoint_path = Path(checkpoint_path)
            checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            with open(checkpoint_path, "wb") as f:
                pickle.dump((self.gbrt_mean, self.gbrt_q5, self.gbrt_q95), f)
