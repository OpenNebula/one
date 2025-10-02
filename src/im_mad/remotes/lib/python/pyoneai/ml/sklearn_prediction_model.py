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

from collections.abc import Collection, Mapping
from functools import partial
import importlib
from itertools import product
import os
from typing import Any, ClassVar, Optional, Union

import numpy as np
from scipy.linalg import LinAlgError, lstsq, solve, svd
from scipy.optimize import minimize_scalar
from scipy.sparse.linalg import lsqr

from ..core.tsnumpy.timeseries import TimeIndex, Timeseries
from .base_prediction_model import BasePredictionModel
from .model_config import ModelConfig


class _NotFitError(Exception):
    def __init__(self, message: str = "") -> None:
        self.message = message or "model is not fit"
        super().__init__(self.message)


class _TransformError(ValueError):
    def __init__(self, message: str = "") -> None:
        self.message = message or "data transformation failed"
        super().__init__(self.message)


class _RidgeRegressor:
    __slots__ = (
        "_alpha",
        "_scale",
        "_max_iter",
        "_tol",
        "_solver",
        "_interc",
        "_coeffs",
        "_is_fit",
    )

    _alpha: float
    _scale: bool
    _max_iter: Optional[int]
    _tol: float
    _solver: str
    _is_fit: bool
    _interc: Optional[np.floating]
    _coeffs: Optional[np.ndarray]

    def __init__(
        self,
        alpha: float = 1.0,
        scale: bool = False,
        max_iter: Optional[int] = None,
        tol: float = 0.0001,
        solver: str = "cholesky",
    ) -> None:
        if alpha < 0.0:
            raise ValueError("'alpha' must be non-negative")
        self._alpha = alpha
        self._scale = scale
        self._max_iter = max_iter
        self._tol = tol
        self._solver = solver
        self._interc = None
        self._coeffs = None
        self._is_fit = False

    @property
    def alpha(self) -> float:
        return self._alpha

    @property
    def solver(self) -> str:
        return self._solver

    @property
    def interc(self) -> Optional[np.floating]:
        return self._interc

    @property
    def coeffs(self) -> Optional[np.ndarray]:
        return self._coeffs

    @property
    def is_fit(self) -> bool:
        return self._is_fit

    def _solve_ols(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        return lstsq(x, y)[0]

    def _solve_ridge(
        self, x: np.ndarray, y: np.ndarray, solver: str = ""
    ) -> np.ndarray:
        solver = solver or self._solver
        if solver == "svd":
            try:
                u, s, v_t = svd(x, full_matrices=False, overwrite_a=True)
                s_ridge = np.where(s > 1e-15, s / (s**2 + self._alpha), 0.0)
                return v_t.T @ (s_ridge * (u.T @ y))
            except LinAlgError as err:
                raise RuntimeError(
                    "'_solve_ridge' could not find a solution"
                ) from err
        if solver == "cholesky":
            try:
                x_t = x.T
                x_gram = x_t @ x
                reg = self._alpha * np.eye(x.shape[1])
                return solve(
                    x_gram + reg,
                    x_t @ y,
                    overwrite_a=True,
                    overwrite_b=True,
                    assume_a="pos",
                )
            except LinAlgError:
                return self._solve_ridge(x, y, solver="svd")
        if solver == "lsqr":
            try:
                return lsqr(
                    x,
                    y,
                    damp=self._alpha**0.5,
                    atol=self._tol,
                    btol=self._tol,
                    iter_lim=self._max_iter,
                )[0]
            except LinAlgError:
                return self._solve_ridge(x, y, solver="svd")
        raise ValueError(f"'solver' {solver} not supported")

    def fit(self, x: np.ndarray, y: np.ndarray) -> "_RidgeRegressor":
        # Determining the resulting dtype and shape.
        dtype = np.promote_types(x.dtype, y.dtype)
        shape = x.shape[1]

        # Handlig the case with equal ``y``'s.
        if np.allclose(y, y[0], atol=self._tol):
            if not (y.ndim == 1 or (y.ndim == 2 and y.shape[1] == 1)):
                raise ValueError(
                    "'y' must be an one-dimensional array or two-dimensional "
                    "array with one column"
                )
            self._interc = dtype.type(y[0].reshape(1)[0])
            self._coeffs = np.zeros(shape=shape, dtype=dtype)
            self._is_fit = True
            return self

        # Centering ``x`` and ``y``.
        # TODO: Consider removing zero columns of ``x_cent``.
        x_mean = x.mean(axis=0)
        x_cent = x - x_mean
        y_mean = y.mean()
        y_cent = y - y_mean
        y_cent.shape = (y_cent.size,)

        # Removing zero columns from ``x_cent``.
        x_zero_mask = np.isclose(x_cent, 0.0, atol=self._tol)
        x_zero_col_mask = np.all(x_zero_mask, axis=0)
        x_any_zero_cols = x_zero_col_mask.any()
        if x_any_zero_cols:
            x_nonzero_col_mask = ~x_zero_col_mask
            x_cent = x_cent[:, x_nonzero_col_mask]

        # Scaling ``x`` and ``y`` (optional).
        if self._scale:
            x_std = np.std(x_cent, axis=0, ddof=0)
            y_std = np.std(y_cent, axis=0, ddof=0)
            # NumPy 2:
            # x_std = np.std(x_cent, axis=0, ddof=0, mean=x_mean)
            # y_std = np.std(y_cent, axis=0, ddof=0, mean=y_mean)
            x_cent /= x_std
            y_cent /= y_std

        # Solving the regression problem.
        if self._alpha:
            # Ridge regression.
            slope = self._solve_ridge(x_cent, y_cent)
        else:
            # Linear regression, ordinary least squares.
            slope = self._solve_ols(x_cent, y_cent)

        # Inverse scaling ``slope``.
        if self._scale:
            slope *= y_std / x_std

        if x_any_zero_cols:
            coeffs = np.empty(shape=shape, dtype=dtype)
            coeffs[x_zero_col_mask] = 0.0
            coeffs[x_nonzero_col_mask] = slope
        else:
            coeffs = slope

        self._interc = y_mean - x_mean @ coeffs
        self._coeffs = coeffs
        self._is_fit = True
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        if not self._is_fit:
            raise _NotFitError()
        y_pred = x @ self._coeffs + self._interc
        return y_pred  # .reshape(-1, 1)


def _mse(
    model: _RidgeRegressor,
    x_train: np.ndarray,
    x_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
) -> float:
    y_pred = model.fit(x_train, y_train).predict(x_test)
    mse = np.mean((y_test.reshape(-1) - y_pred.reshape(-1)) ** 2)
    return float(mse)


def _tune_alpha_opt(
    x: np.ndarray,
    y: np.ndarray,
    train_size: int,
    scale: bool = False,
    max_iter: Optional[int] = None,
    tol: float = 0.0001,
    solver: str = "cholesky",
) -> float:
    x_train, x_val = x[:train_size, :], x[train_size:, :]
    y_train, y_val = y[:train_size], y[train_size:]
    opt = minimize_scalar(
        lambda alpha: _mse(
            _RidgeRegressor(alpha, scale, max_iter, tol, solver),
            x_train,
            x_val,
            y_train,
            y_val,
        ),
        # bracket=None,
        bounds=(1e-2, 1e8),
        # args=(),
        # method=None,
        # tol=1e-4,
        # options={'maxiter': 10}
    )
    # Falling to OLS if the optimal regularizer is below zero or cannot
    # be found.
    return max(float(opt.x), 0.0) if opt.success else 0.0


def _tune_alpha_grid(
    x: np.ndarray,
    y: np.ndarray,
    train_size: int,
    alphas: Optional[Collection[float]] = None,
    scale: bool = False,
    max_iter: Optional[int] = None,
    tol: float = 0.0001,
    solver: str = "cholesky",
) -> float:
    x_train, x_val = x[:train_size, :], x[train_size:, :]
    y_train, y_val = y[:train_size], y[train_size:]
    if alphas is None:
        alphas = [10.0**i for i in range(-1, 5)]
    best_mse = float("inf")
    best_alpha = float("nan")
    for alpha in alphas:
        model = _RidgeRegressor(alpha, scale, max_iter, tol, solver)
        mse = _mse(model, x_train, x_val, y_train, y_val)
        if mse < best_mse:
            best_mse = mse
            best_alpha = alpha
    return best_alpha


def grid_search(
    x: np.ndarray,
    y: np.ndarray,
    train_share: float,
    model_type: type[Any],
    grid: Mapping[str, Collection[Any]],
) -> tuple[dict[str, Any], float]:
    # TODO: Consider parallelization.
    train_size = round(train_share * y.size)
    x_train, x_val = x[:train_size, :], x[train_size:, :]
    y_train, y_val = y[:train_size], y[train_size:]
    names = list(grid.keys())
    best_mse = float("inf")
    best_hps: dict[str, Any] = {}
    for values in product(*grid.values()):
        kwa = dict(zip(names, values))
        y_pred = model_type(**kwa).fit(x_train, y_train).predict(x_val)
        mse = float(np.mean((y_val.reshape(-1) - y_pred.reshape(-1)) ** 2))
        if mse < best_mse:
            best_mse = mse
            best_hps = kwa
    return best_hps, best_mse


def _create_lag_sizes(
    hist_size: int,
    lead_size: int = 0,
    hor_size: int = 1,
    min_obs: int = 20,
    max_size: Optional[int] = None,
) -> set[int]:
    min_lag_size = 2
    max_lag_size = hist_size - lead_size - hor_size - min_obs + 1
    if max_size is not None:
        max_lag_size = min(max_lag_size, max_size)
    out: set[int] = {min_lag_size}

    if max_lag_size <= min_lag_size:
        return out

    diff = max_lag_size - min_lag_size
    incr = diff // 4
    out.add(min_lag_size + incr)
    out.add(min_lag_size + 2 * incr)
    out.add(min_lag_size + 3 * incr)
    out.add(min_lag_size + 4 * incr)

    return out


def _calculate_default_lag_size(
    hist_size: int,
    lead_size: int = 0,
    hor_size: int = 1,
    min_obs: int = 20,
    order: int = 1,
) -> int:
    max_lag_size = hist_size - lead_size - hor_size - min_obs + 1
    diff = max_lag_size // order - 1
    # return 2 if diff <= 10 else min(diff // 2, 50)
    if diff <= 10:
        return 2
    if diff >= 100:
        return 50
    return diff // 2


def transform_data(
    data: Union[Timeseries, np.ndarray],
    hist_size: Optional[int] = None,
    lag_size: Optional[int] = None,
    lead_size: int = 0,
    hor_size: int = 1,
    min_obs: int = 2,
    order: int = 1,
) -> tuple[np.array, np.ndarray, np.ndarray, np.ndarray]:
    # NOTE: The algorithm chooses `hist_size`` last values from ``data``
    # to fit and validate the model, which has ``lag_size * order``
    # features. Parameters are:
    # * ``hist_size``: number of considered historical time steps
    # * ``lag_size``: number of lag time steps, i.e. features for
    #   ``order == 1``
    # * ``lead_size``: number of forecast latency time steps
    # * ``hor_size``: number of forecast horizon time steps
    # * ``min_obs``: minimal number of observations considered suitable
    # * ``order``: order of the fitting polynomial

    vals = np.asarray(data)

    if hist_size is None:
        hist_size = vals.size
    else:
        vals = vals[-hist_size:]

    if lag_size is None:
        lag_size = _calculate_default_lag_size(
            hist_size=hist_size,
            lead_size=lead_size,
            hor_size=hor_size,
            min_obs=min_obs,
            order=order,
        )

    n_cols = lag_size + lead_size + hor_size
    n_rows = hist_size - n_cols + 1
    if n_rows < min_obs:
        raise _TransformError()

    sliding_vals = np.lib.stride_tricks.as_strided(
        vals,
        strides=vals.strides * 2,
        shape=(n_rows, n_cols),
        subok=False,
        writeable=True,
    )

    x = sliding_vals[:, :lag_size]
    # TODO: Check this logic.
    x_pred = vals[-lag_size:].reshape(1, -1)
    if order > 1:
        xs, xs_pred = [x], [x_pred]
        for i in range(2, order + 1):
            xs.append(x**i)
            xs_pred.append(x_pred**i)
        x = np.hstack(xs)
        x_pred = np.hstack(xs_pred)
    # y = vals[n_rows - 1:]  # .reshape(-1, 1)
    y = sliding_vals[:, -1]  # .reshape(-1, 1)

    return sliding_vals, x, y, x_pred


def tune_hyperparameters(
    data: np.ndarray,
    train_share: float,
    model_type: type[Any],
    grid: Mapping[str, Collection[Any]],
    lag_sizes: Optional[Collection[int]] = None,
    lead_size: int = 0,
    hor_size: int = 1,
    min_obs: int = 20,
    max_size: Optional[int] = None,
    order: int = 1,
) -> tuple[dict[str, Any], float, int]:
    # TODO: Consider parallelization.
    best_mse = float("inf")
    best_hps: dict[str, Any] = {}
    best_lag_size = 1
    if lag_sizes is None:
        lag_sizes = _create_lag_sizes(
            data.size, lead_size, hor_size, min_obs, max_size
        )
    for lag_size in lag_sizes:
        try:
            _, x, y, __ = transform_data(
                data=data,
                hist_size=None,
                lag_size=lag_size,
                lead_size=lead_size,
                hor_size=hor_size,
                min_obs=min_obs,
                order=order,
            )
            hps, mse = grid_search(x, y, train_share, model_type, grid)
            if mse < best_mse:
                best_mse = mse
                best_hps = hps
                best_lag_size = lag_size
        except _TransformError:
            pass
    return best_hps, best_mse, best_lag_size


class SklearnPredictionModel(BasePredictionModel):
    __SUPPORTS_CI__: ClassVar[bool] = False

    def __init__(self, model_config: ModelConfig) -> None:
        super().__init__(model_config)
        train = model_config.training_params
        if (estimator_class_name := train.get("estimator_class")) is not None:
            module_name, class_name = estimator_class_name.rsplit(".", 1)
            module = importlib.import_module(module_name)
            model_class = getattr(module, class_name)
        else:
            model_class = _RidgeRegressor
        model_kwa = model_config.hyper_params
        self.model = model_class(**model_kwa)

        self._tune: Optional[partial]
        tune = False
        grid: Optional[dict[str, Any]] = None
        lag_sizes: Optional[list[int]] = None
        if "grid" in train:
            grid = train["grid"]
            tune = True
        elif model_class is _RidgeRegressor and "alpha" not in model_kwa:
            grid = {"alpha": [0.1, 1.0, 10.0, 100.0, 1_000.0]}
            tune = True
        if "lag_sizes" in train:
            lag_sizes = train["lag_sizes"]
            tune = True
        if tune:
            if grid is None:
                grid = {name: [val] for name, val in model_kwa.items()}
            if lag_sizes is None:
                if "lag_size" in train:
                    lag_sizes = [train["lag_size"]]
                else:
                    lag_sizes = None
            self._tune = partial(
                tune_hyperparameters,
                # data=...,
                train_share=train.get("train_share", 0.8),
                model_type=model_class,
                grid=grid,
                lag_sizes=lag_sizes,
                lead_size=train.get("lead_size", 0),
                # hor_size=...,
                min_obs=train.get("min_observations", 5),
                max_size=train.get("max_lag_size", 40),
                order=train.get("order", 1),
            )
        else:
            self._tune = None

    def _transform(
        self,
        metric: Union[Timeseries, np.ndarray],
        horizon: int,
        lag_size: Optional[int] = None,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        get = self.model_config.training_params.get
        _, x, y, x_pred = transform_data(
            data=np.asarray(metric).reshape(-1),
            hist_size=None,
            lag_size=lag_size or get("lag_size"),
            lead_size=get("lead_size", 0),
            hor_size=horizon,
            min_obs=get("min_observations", 20),
            order=get("order", 1),
        )
        return x, y, x_pred

    def fit(self, metric: Timeseries) -> SklearnPredictionModel:
        vals = metric.to_array().reshape(-1)
        vals = vals[-self.model_config.sequence_length :]
        x, y, _ = self._transform(metric=vals, horizon=1)
        self.model.fit(x, y)
        return self

    def predict(
        self,
        metric: Timeseries,
        horizon: Optional[int] = None,
        forecast_index: Optional[TimeIndex] = None,
    ) -> Timeseries:
        # TODO: Implement the forecast-index option.
        # NOTE: Currently, only the last time step is returned,
        # as if `forecast_index is None`.
        if not metric.ndim:
            raise ValueError("Timeseries does not contain data")

        if metric.ndim > 1:
            raise NotImplementedError(
                "'metric' with more than one variable is currently not "
                "supported"
            )
        if forecast_index is not None:
            horizon = int(
                (forecast_index - metric.time_index.values[-1])
                / metric._time_idx.frequency
            )

        if horizon is None:
            horizon = 1

        conf = self.model_config
        vals = metric.to_array().reshape(-1)[-conf.sequence_length :]
        pred = np.empty(shape=horizon, dtype=vals.dtype)
        for i in range(horizon):
            if self._tune is None:
                model = self.model
                lag_size = None
            else:
                kwa, _, lag_size = self._tune(data=vals, hor_size=i + 1)
                model = type(self.model)(**kwa)

            try:
                x, y, x_pred = self._transform(
                    metric=metric, horizon=i + 1, lag_size=lag_size
                )
                model.fit(x, y)
                pred[i] = model.predict(x_pred).reshape(())
            except _TransformError:
                pred[i] = vals.mean()
        # np.maximum(pred, 0.0, out=pred)

        return Timeseries(
            time_idx=self._forecast_time_index(metric, horizon),
            metric_idx=metric.metrics,
            entity_uid_idx=metric.entity_uids,
            data=pred.reshape(-1, 1, 1),
        )

    @classmethod
    def load(
        cls,
        model_config: ModelConfig,
        checkpoint: Optional[Union[str, os.PathLike]] = None,
    ) -> SklearnPredictionModel:
        return cls(model_config)
