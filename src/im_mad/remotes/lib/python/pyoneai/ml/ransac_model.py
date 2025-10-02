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

__all__ = [
    "RANSACPredictionModel",
    "LinearModel",
    "QuadraticModel",
    "ExponentialModel",
]

import warnings
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING, ClassVar, Optional

import numpy as np

from ..core.time import Period
from ..core.tsnumpy.index.entity import EntityUID
from ..core.tsnumpy.index.metric import MetricAttributes
from ..core.tsnumpy.timeseries import Timeseries
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig
from .utils import get_class

if TYPE_CHECKING:
    from ..core.tsnumpy.timeseries import Timeseries


@dataclass(frozen=True)
class BaseRegressionModel(ABC):
    """
    Base class for regression models.

    Attributes
    ----------
    MIN_SAMPLES: The minimum number of samples required to fit the model.

    Methods
    -------
    get_default() -> BaseRegressionModel:
        Returns the default model.

    fit(x: np.ndarray, y: np.ndarray) -> BaseRegressionModel:
        Fits the model to the given data.

    predict(x: np.ndarray) -> np.ndarray:
        Returns the predicted values for the given input.

    compute_residuals(x: np.ndarray, y: np.ndarray) -> np.ndarray:
        Returns the residuals for the given data.

    __call__(x: np.ndarray) -> np.ndarray:
        Returns the predicted values for the given input.
    """

    MIN_SAMPLES: ClassVar[int]

    @classmethod
    @abstractmethod
    def get_default(cls) -> BaseRegressionModel:
        raise NotImplementedError

    @classmethod
    @abstractmethod
    def fit(self, x: np.ndarray, y: np.ndarray) -> BaseRegressionModel:
        raise NotImplementedError

    @abstractmethod
    def predict(self, x: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def compute_residuals(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        return np.abs(y - self.predict(x))

    def __call__(self, x):
        return self.predict(x)


@dataclass(frozen=True)
class LinearModel(BaseRegressionModel):
    """Linear regression model."""

    MIN_SAMPLES: ClassVar[int] = 2

    slope: float
    intercept: float

    @classmethod
    def get_default(cls) -> LinearModel:
        return cls(0.0, 0.0)

    @classmethod
    def fit(cls, x: np.ndarray, y: np.ndarray) -> None:
        try:
            slope, intercept = np.polyfit(x, y, 1)
            return cls(slope, intercept)
        except np.linalg.LinAlgError as err:
            raise ValueError("Could not fit linear model") from err

    def predict(self, x: np.ndarray) -> np.ndarray:
        return np.polyval([self.slope, self.intercept], x)


@dataclass(frozen=True)
class QuadraticModel(BaseRegressionModel):
    """Quadratic regression model."""

    MIN_SAMPLES: ClassVar[int] = 3

    a: float
    b: float
    c: float

    @classmethod
    def get_default(cls) -> QuadraticModel:
        return cls(0.0, 0.0, 0.0)

    @classmethod
    def fit(cls, x: np.ndarray, y: np.ndarray) -> None:
        try:
            a, b, c = np.polyfit(x, y, 2)
            return cls(a, b, c)
        except np.linalg.LinAlgError as err:
            raise ValueError("Could not fit quadratic model") from err

    def predict(self, x: np.ndarray) -> np.ndarray:
        return np.polyval([self.a, self.b, self.c], x)


@dataclass(frozen=True)
class ExponentialModel(BaseRegressionModel):
    """Exponential regression model."""

    MIN_SAMPLES: ClassVar[int] = 2

    a: float
    constant: float

    @classmethod
    def get_default(cls) -> ExponentialModel:
        return cls(0.0, 0.0)

    @classmethod
    def fit(cls, x: np.ndarray, y: np.ndarray) -> None:
        try:
            a, constant = np.polyfit(x, np.log(y + 1), 1)
            return cls(a, constant)
        except np.linalg.LinAlgError as err:
            raise ValueError("Could not fit quadratic model") from err

    def predict(self, x: np.ndarray) -> np.ndarray:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=RuntimeWarning)
            return np.exp(np.polyval([self.a, self.constant], x)) - 1


class RANSACPredictionModel(BasePredictionModel):
    """RANSAC-based prediction model.

    This prediction model uses RANSAC metalgorithm to find
    the best regression model for each variate. out of the predefined
    set of regression models.

    Currently supported regression models are:
    - LinearModel
    - QuadraticModel
    - ExponentialModel
    """

    __SUPPORTS_CI__: ClassVar[bool] = False

    residual_threshold: Optional[float]
    max_trials: int
    random_state: int
    stop_probability: float
    regression_models: list[str]
    criterion: str
    variates_best_model: dict[
        tuple[MetricAttributes, EntityUID], BaseRegressionModel
    ]

    def __init__(
        self,
        model_config: ModelConfig,
    ) -> None:
        super().__init__(model_config)
        self.residual_threshold = self.model_config.hyper_params.get(
            "residual_threshold"
        )
        self.max_trials = self.model_config.hyper_params.get("max_trials", 100)
        self.stop_probability = self.model_config.hyper_params.get(
            "stop_probability", 0.99
        )
        self.variates_best_model = {}
        self.random_state = self.model_config.hyper_params.get(
            "random_state", 42
        )
        self.regression_models = self.model_config.hyper_params.get(
            "regression_models",
            [
                f"{__name__}.LinearModel",
                f"{__name__}.QuadraticModel",
                f"{__name__}.ExponentialModel",
            ],
        )
        self.criterion = self.model_config.hyper_params.get(
            "criterion", "mape"
        )
        self.scaling = self.model_config.hyper_params.get("scaling", 0.5)

    def _get_regression_model_classes(self) -> list[type[BaseRegressionModel]]:
        return [
            get_class(model_class) for model_class in self.regression_models
        ]

    @staticmethod
    def _compute_max_trials(
        n_inliers,
        n_samples,
        min_samples,
        probability,
        tol: float = np.spacing(1),
    ) -> int:
        inlier_ratio = n_inliers / float(n_samples)
        nom = max(tol, 1 - probability)
        denom = max(tol, 1 - inlier_ratio**min_samples)
        if nom == 1:
            return 0
        if denom == 1:
            return np.inf
        return int(np.abs(np.ceil(np.log(nom) / np.log(denom))))

    @staticmethod
    def _ensure_valid_data(
        x: np.ndarray, y: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        valid_mask = np.isfinite(y) & np.isfinite(x)
        if not np.all(valid_mask):
            return x[valid_mask], y[valid_mask]
        else:
            return x, y

    @staticmethod
    def _compute_residual_threshold(
        y: np.ndarray, scaling: float = 1.0
    ) -> float:
        median_y = np.median(y)
        mad = np.median(np.abs(y - median_y))
        return scaling * mad if mad > np.spacing(1) else np.spacing(1)

    def _compute_criterion(
        self,
        metric_attr: MetricAttributes,
        entity_uid: EntityUID,
        org_time_index: np.ndarray,
        org_values: np.ndarray,
        inlier_mask: np.ndarray[bool],
        x_timestamps: np.ndarray,
        regression_model: BaseRegressionModel,
    ) -> float:
        if not hasattr(Timeseries, self.criterion):
            raise ValueError(f"Criterion '{self.criterion}' is not supported.")

        y_pred = regression_model.predict(x_timestamps)

        time_index = org_time_index[inlier_mask]
        pred_metric_masked = Timeseries(
            time_idx=time_index,
            metric_idx=np.array([metric_attr]),
            entity_uid_idx=np.array([entity_uid]),
            data=y_pred.reshape(-1, 1, 1),
        )
        true_metric_masked = Timeseries(
            time_idx=time_index,
            metric_idx=np.array([metric_attr]),
            entity_uid_idx=np.array([entity_uid]),
            data=org_values[inlier_mask].reshape(-1, 1, 1),
        )

        return getattr(Timeseries, self.criterion)(
            true_metric_masked, pred_metric_masked
        )

    def fit(
        self,
        metric: Timeseries,
    ) -> RANSACPredictionModel:
        """
        Fit the best regression model using RANSAC metaalgorithm.

        Parameters
        ----------
        metric : Timeseries
            The timeseries to fit the model on.

        Returns
        -------
        RANSACPredictionModel
            The fitted RANSACPredictionModel
        """
        for m_attr, entity_uid, ts in metric.iter_over_variates():
            self.variates_best_model[(m_attr, entity_uid)] = (
                self._fit_model_for_univariate_timeseries(ts)
            )

        return self

    def _fit_model_for_univariate_timeseries(self, metric: Timeseries):
        assert metric.is_univariate, "Timeseries must be univariate."
        x = metric._time_idx.get_time_deltas_from_origin(
            metric._time_idx.origin, metric.time_index
        )
        rng = np.random.default_rng(self.random_state)
        y = metric.values.squeeze()

        if len(x) != len(y):
            raise ValueError("Internal error: x and y lengths do not match.")

        best_model: BaseRegressionModel
        best_criterion_value: float = np.inf
        for regression_model_class in self._get_regression_model_classes():
            x_valid, y_valid = RANSACPredictionModel._ensure_valid_data(x, y)
            if len(y_valid) < regression_model_class.MIN_SAMPLES:
                criterion = self._compute_criterion(
                    metric.metrics[0],
                    metric.entity_uids[0],
                    metric.time_index,
                    metric.values.squeeze(),
                    np.ones(len(x_valid), dtype=bool),
                    x_valid,
                    best_model,
                )
                if criterion < best_criterion_value:
                    best_criterion_value = criterion
                    best_model = regression_model_class.get_default()
                continue

            if self.residual_threshold is None:
                residual_threshold = (
                    RANSACPredictionModel._compute_residual_threshold(
                        y_valid, self.scaling
                    )
                )
            else:
                residual_threshold = self.residual_threshold

            ransac_best_model: BaseRegressionModel
            best_inlier_mask = None
            max_inliers = -1
            n_samples_valid = len(x_valid)

            max_trials = self.max_trials
            current_trial = 0
            while current_trial < max_trials:
                current_trial += 1
                indices = rng.choice(
                    n_samples_valid,
                    regression_model_class.MIN_SAMPLES,
                    replace=False,
                )
                x_sample = x_valid[indices]
                y_sample = y_valid[indices]

                try:
                    model = regression_model_class.fit(x_sample, y_sample)
                except ValueError:
                    continue
                residuals = model.compute_residuals(x_valid, y_valid)

                inlier_mask_current = residuals < residual_threshold
                n_inliers_current = np.sum(inlier_mask_current)

                if n_inliers_current > max_inliers:
                    max_inliers = n_inliers_current
                    ransac_best_model = model
                    best_inlier_mask = inlier_mask_current

                max_trials = min(
                    max_trials,
                    RANSACPredictionModel._compute_max_trials(
                        max_inliers,
                        n_samples_valid,
                        regression_model_class.MIN_SAMPLES,
                        self.stop_probability,
                    ),
                )

            if (
                best_inlier_mask is not None
                and np.sum(best_inlier_mask)
                >= regression_model_class.MIN_SAMPLES
            ):
                x_inliers = x_valid[best_inlier_mask]
                y_inliers = y_valid[best_inlier_mask]
                best_inliers_values = x_inliers
                try:
                    ransac_best_model = regression_model_class.fit(
                        x_inliers, y_inliers
                    )
                except ValueError:
                    pass
            else:
                ransac_best_model = regression_model_class.fit(
                    x_valid, y_valid
                )
                best_inlier_mask = np.ones(len(x_valid), dtype=bool)
                best_inliers_values = x_valid

            criterion = self._compute_criterion(
                metric.metrics[0],
                metric.entity_uids[0],
                metric.time_index,
                metric.values.squeeze(),
                best_inlier_mask,
                best_inliers_values,
                ransac_best_model,
            )

            if criterion < best_criterion_value:
                best_criterion_value = criterion
                best_model = ransac_best_model
        return best_model

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

    def predict(self, metric: Timeseries, horizon: int = 1) -> Timeseries:
        """Predict the future values based on the regression model.

        Parameters
        ----------
        metric : Timeseries
            The metric data for generating predictions (univariate or
            multivariate).
        horizon : int
            The number of steps ahead to predict (default is 1).

        Returns
        -------
        Timeseries
            The prediction results of the model.
        """
        horizon_values = self._get_forecast_index(metric, horizon)
        x = np.array(
            list(
                map(
                    lambda x: x.timestamp()
                    - metric._time_idx.origin.timestamp(),
                    horizon_values,
                )
            )
        )
        result_tss = []
        for m_attr, entity_uid, ts in metric.iter_over_variates():
            if (m_attr, entity_uid) not in self.variates_best_model:
                model = self._fit_model_for_univariate_timeseries(ts)
                self.variates_best_model[(m_attr, entity_uid)] = model

            model = self.variates_best_model[(m_attr, entity_uid)]
            y = model.predict(x)
            result_tss.append(
                Timeseries(
                    time_idx=horizon_values,
                    metric_idx=np.array([m_attr]),
                    entity_uid_idx=np.array([entity_uid]),
                    data=np.array(y).reshape(-1, 1, 1),
                )
            )
        return Timeseries.merge(*result_tss)

    @classmethod
    def load(
        cls, model_config: ModelConfig, checkpoint=None
    ) -> RANSACPredictionModel:
        return cls(model_config)
