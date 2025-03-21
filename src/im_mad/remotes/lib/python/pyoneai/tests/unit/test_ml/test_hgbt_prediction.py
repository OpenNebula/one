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

import importlib
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pytest

from pyoneai.core import Instant, MetricAttributes, Period, Timeseries
from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.ml.hgbt_prediction_model import HgbtPredictionModel

try:
    import sklearn
except ImportError:
    pass
else:
    from pyoneai.ml.hgbt_prediction_model import HgbtPredictionModel

from pyoneai.ml import ModelConfig
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)


@pytest.mark.skipif(
    not importlib.util.find_spec("sklearn"), reason="sklearn not installed"
)
class TestHgbtPredictionModel(TestPredictionModelInterface):
    __test__ = True

    @pytest.fixture
    def model_config(self) -> ModelConfig:
        """Return a model configuration for HgbtPredictionModel."""
        return ModelConfig(
            model_class="sklearn.ensemble.HistGradientBoostingRegressor",
            hyper_params={},
            training_params={
                "max_iter": 50,
                "context_length": self.context_length,
                "compute_ci": True,
            },
            sequence_length=2,
        )

    @pytest.fixture
    def prediction_model(
        self, model_config: ModelConfig
    ) -> "HgbtPredictionModel":
        """Instantiate and returns a HgbtPredictionModel."""
        return HgbtPredictionModel(model_config)

    @pytest.fixture(autouse=True)
    def setup(self):
        self.context_length = 4
        self.ts_length = 300
        HgbtPredictionModel.MIN_N_SPLITS = 6

    @pytest.fixture
    def tmp_modelconfig_path(self):
        path = Path(tempfile.gettempdir()) / "model_config.yaml"
        yield path
        path.unlink()

    @pytest.fixture
    def tmp_checkpoint_path(self):
        path = Path(tempfile.gettempdir()) / "checkpoint.checkpoint"
        yield path
        path.unlink()

    def test_fail_on_timeseries_too_short(self, prediction_model):
        start = datetime(2023, 1, 1, tzinfo=timezone.utc)
        freq = timedelta(hours=1)
        ts = Timeseries(
            time_idx=np.array(
                [start, start + freq, start + 2 * freq], dtype=np.datetime64
            ),
            metric_idx=np.array([MetricAttributes(name="cpu_usage")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=(np.sin(np.linspace(0, 2 * np.pi, 3)) + 1).reshape(-1, 1, 1),
        )
        with pytest.raises(
            ValueError,
            match=f"The passed context length {self.context_length}*",
        ):
            prediction_model._validate_fit_metric(ts)

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_get_forecast_index_starting_at_next_value(
        self, create_timeseries, prediction_model
    ):
        ts = getattr(self, create_timeseries)(10)
        index = ts.time_index[-1]

        freq = ts._time_idx.frequency
        next_value = index + freq
        forecast_index = prediction_model._get_forecast_index(ts, 100)
        assert forecast_index[0] == next_value

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_get_forecast_index_of_proper_length(
        self, create_timeseries, prediction_model
    ):
        ts = getattr(self, create_timeseries)(10)
        forecast_index = prediction_model._get_forecast_index(ts, 100)
        assert len(forecast_index) == 100

    def test_singlestep_forecast_univariate_not_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        forecast = prediction_model.predict(ts, 1)
        assert len(forecast) == 1
        assert len(forecast.names) == 1
        assert np.all(forecast.names == ts.names)

    def test_singlestep_forecast_multivariate_not_fitted_before(
        self, prediction_model
    ):
        ts = self.create_multivariate_timeseries(self.ts_length)
        forecast = prediction_model.predict(ts, 1)
        assert len(forecast) == 1
        assert len(forecast.names) == 2
        assert np.all(forecast.names == ts.names)

    def test_multistep_forecast_univariate_not_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        forecast = prediction_model.predict(ts, 100)
        assert len(forecast) == 100
        assert len(forecast.names) == 1

    def test_multistep_forecast_multivariate_not_fitted_before(
        self, prediction_model
    ):
        ts = self.create_multivariate_timeseries(self.ts_length)
        forecast = prediction_model.predict(ts, 100)
        assert len(forecast) == 100
        assert len(forecast.names) == 2

    def test_fail_on_timeseries_shorted_than_context_length(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts2 = self.create_univariate_timeseries(3)
        prediction_model.fit(ts)
        with pytest.raises(
            ValueError,
            match=r"The passed historical context \(time series\) on"
            r" length*",
        ):
            prediction_model.predict(ts2)

    def test_fail_on_fitting_multivariate(self, prediction_model):
        with pytest.raises(
            ValueError,
            match=r"Histogram-based Gradient Boosting Tree can be "
            r"trained for univariate time series only.",
        ):
            prediction_model.fit(
                self.create_multivariate_timeseries(self.ts_length)
            )

    def test_singlestep_univariate_forecast_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_predict = self.create_univariate_timeseries(self.context_length)
        forecast = prediction_model.fit(ts).predict(ts_predict, 1)
        assert forecast.ndim == ts_predict.ndim
        assert len(forecast) == 1

    def test_singlestep_multivariate_forecast_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = self.create_multivariate_timeseries(self.context_length)
        forecast = prediction_model.fit(ts).predict(ts_pred, 1)
        assert forecast.ndim == ts_pred.ndim
        assert len(forecast) == 1

    def test_multistep_univariate_forecast_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = self.create_univariate_timeseries(self.context_length)
        forecast = prediction_model.fit(ts).predict(ts_pred, 100)
        assert forecast.ndim == ts_pred.ndim
        assert len(forecast) == 100

    def test_multistep_multivariate_forecast_fitted_before(
        self, prediction_model
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = self.create_multivariate_timeseries(self.context_length)
        forecast = prediction_model.fit(ts).predict(ts_pred, 100)
        assert forecast.ndim == ts_pred.ndim
        assert len(forecast) == 100

    def test_not_fit_on_predict_if_fitted_before(
        self, prediction_model, mocker
    ):
        fit_mock = mocker.patch(
            "pyoneai.ml.HgbtPredictionModel._fit",
            autospec=True,
            side_effect=HgbtPredictionModel._fit,
        )
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = self.create_multivariate_timeseries(self.context_length)
        prediction_model.fit(ts)
        prediction_model.predict(ts_pred)
        fit_mock.assert_called_once()
        assert np.all(fit_mock.call_args_list[0].args[1] == ts)

    def test_fit_on_predict_if_not_fitted_before(
        self, prediction_model, mocker
    ):
        fit_mock = mocker.patch(
            "pyoneai.ml.HgbtPredictionModel._fit",
            autospec=True,
            side_effect=HgbtPredictionModel._fit,
        )
        ts = self.create_multivariate_timeseries(self.ts_length)
        prediction_model.predict(ts)
        assert fit_mock.call_count == ts.ndim
        for i, metric_name in enumerate(ts.names):
            assert np.all(
                fit_mock.call_args_list[i].args[1] == ts[metric_name]
            )

    def test_save_momdel(
        self, prediction_model, tmp_modelconfig_path, tmp_checkpoint_path
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.fit(ts)
        prediction_model.save(tmp_modelconfig_path, tmp_checkpoint_path)
        assert tmp_modelconfig_path.exists()
        assert tmp_checkpoint_path.exists()

    def test_load_checkpoint_without_ci(
        self,
        model_config,
        tmp_modelconfig_path,
        tmp_checkpoint_path,
    ):
        model_config.compute_ci = False
        prediction_model = HgbtPredictionModel(model_config)
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.fit(ts)
        prediction_model.save(tmp_modelconfig_path, tmp_checkpoint_path)
        regressor = type(prediction_model).load(
            model_config, tmp_checkpoint_path
        )
        assert (
            prediction_model.gbrt_mean.get_params()
            == regressor.gbrt_mean.get_params()
        )

    @pytest.mark.skip("to enable when Timeseries will contain CI features")
    def test_load_checkpoint_with_ci(
        self,
        prediction_model,
        model_config,
        tmp_modelconfig_path,
        tmp_checkpoint_path,
    ):
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.fit(ts)
        prediction_model.save(tmp_modelconfig_path, tmp_checkpoint_path)
        regressor = type(prediction_model).load(
            model_config, tmp_checkpoint_path
        )
        assert (
            prediction_model.gbrt_mean.get_params()
            == regressor.gbrt_mean.get_params()
        )
        assert (
            prediction_model.gbrt_q5.get_params()
            == regressor.gbrt_q5.get_params()
        )
        assert (
            prediction_model.gbrt_q95.get_params()
            == regressor.gbrt_q95.get_params()
        )

    def test_fail_on_fit_timeseries_with_nans(self, prediction_model):
        start = datetime(2023, 1, 1, tzinfo=timezone.utc)
        freq = timedelta(hours=1)
        ts = Timeseries(
            time_idx=Period(slice(start, start + freq * 999, freq)).values,
            metric_idx=np.array([MetricAttributes(name="cpu_usage")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.array(
                [np.nan, 1, 2, 3, 4, 5, np.nan, 7, 8, 9] * 100
            ).reshape(-1, 1, 1),
        )
        with pytest.raises(
            ValueError, match=r"Time series cannot contain NaN values."
        ):
            prediction_model.fit(ts)

    def test_on_predict_ts_with_nans(self, prediction_model):
        ts = self.create_univariate_timeseries(self.ts_length)
        start = datetime(2023, 1, 1, tzinfo=timezone.utc)
        freq = timedelta(hours=1)
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = Timeseries(
            time_idx=Period(slice(start, start + 999 * freq, freq)).values,
            metric_idx=np.array([MetricAttributes(name="cpu_usage")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.array(
                [np.nan, 1, 2, 3, 4, 5, np.nan, 7, 8, 9] * 100
            ).reshape(-1, 1, 1),
        )
        forecast = prediction_model.fit(ts).predict(ts_pred, 100)
        assert np.sum(np.isnan(forecast)) == 0

    def test_does_not_create_extra_hgbt_if_no_ci(self, model_config):
        model_config.compute_ci = False
        regressor = HgbtPredictionModel(model_config)
        assert regressor.gbrt_q5 is None
        assert regressor.gbrt_q95 is None

    def test_does_not_predict_ci_if_no_ci(self, model_config):
        ts = self.create_univariate_timeseries(self.ts_length)
        ts_pred = self.create_univariate_timeseries(self.context_length)
        model_config.compute_ci = False
        regressor = HgbtPredictionModel(model_config)
        forecast = regressor.fit(ts).predict(ts_pred, 100)
        assert np.all(forecast.names == ts.names)

    def test_fit_model_returns_self(self, prediction_model):
        super().test_fit_model_returns_self(
            prediction_model, "create_univariate_timeseries"
        )
