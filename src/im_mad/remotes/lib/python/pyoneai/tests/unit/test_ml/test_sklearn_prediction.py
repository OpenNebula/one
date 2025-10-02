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

import tempfile
from pathlib import Path

import numpy as np
import pytest

from pyoneai.ml.sklearn_prediction_model import (
    SklearnPredictionModel,
    _RidgeRegressor,
)
from pyoneai.core.tsnumpy.timeseries import Timeseries

from pyoneai.ml import ModelConfig
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)


# NOTE: at the moment superclass tests are hidden until
# SklearnPredictionModel supports multivariate input
class TestSklearnPredictionModel(TestPredictionModelInterface):
    __test__ = True

    @pytest.fixture
    def model_config(self) -> ModelConfig:
        """Return a model configuration for SklearnPredictionModel."""
        return ModelConfig(
            model_class="pyoneai.ml.sklearn_prediction_model.SklearnPredictionModel",
            hyper_params={},
            training_params={},
            sequence_length=100,
        )

    @pytest.fixture
    def prediction_model(
        self, model_config: ModelConfig
    ) -> "SklearnPredictionModel":
        """Instantiate and returns a SklearnPredictionModel."""
        return SklearnPredictionModel(model_config)

    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        self.ts_length = 100

    @pytest.fixture
    def tmp_modelconfig_path(self):
        path = Path(tempfile.gettempdir()) / "model_config.yaml"
        yield path
        if path.exists():
            path.unlink()

    @pytest.mark.parametrize(
        "create_timeseries", ["create_univariate_timeseries"]
    )
    def test_horizon_based_on_forecast_index(
        self, mocker, create_timeseries, prediction_model
    ):
        ts = getattr(self, create_timeseries)(10)
        expected_horizon = 110
        query_forecast_index = ts.time_index[-1] + self.freq * expected_horizon
        predictions = prediction_model.predict(
            ts, horizon=expected_horizon
        )
        assert predictions.time_index[-1] == query_forecast_index

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_correct_forecast_timeindex_values_multistep(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=10)
        assert predictions.time_index[0] == ts.time_index[-1] + self.freq

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_correct_forecast_timeindex_length_multistep(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=10)
        assert len(predictions.time_index) == 10

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_correct_forecast_timeindex_instant(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=1)
        assert predictions.time_index[0] == ts.time_index[-1] + self.freq

    @pytest.mark.skip(
        reason="SklearnPredictionModel does not support multivariate input"
    )
    def test_produce_multivariate_on_multivariate_input(
        self, prediction_model
    ):
        super().test_produce_multivariate_on_multivariate_input(
            prediction_model
        )

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_keep_original_metric_name(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=1)
        assert np.array_equal(
            predictions.names, ts.names
        ), "Metric names should be preserved in the predicted timeseries"

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_predict_returns_timeseries_correct_length(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        for horizon in [1, 5, 10]:
            predictions = prediction_model.predict(ts, horizon=horizon)
            assert (
                len(predictions) == horizon
            ), f"Predicted timeseries should have {horizon} time steps"

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries"],
    )
    def test_predict_returns_timeseries(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=5)
        assert isinstance(
            predictions, Timeseries
        ), "predict() should return a Timeseries instance"

    def test_optimize_alpha_when_context_size_provided(self, mocker):
        """Test that only alpha is optimized when context_size (n_lags) is provided."""
        optimize_mock = mocker.patch(
            "pyoneai.ml.sklearn_prediction_model.tune_hyperparameters",
            return_value=({}, 0.5, 10),
        )

        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={"alpha": 1.0},
            training_params={"lag_sizes": [2, 10]},
            sequence_length=100,
        )
        prediction_model = SklearnPredictionModel(model_config)
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.predict(ts, horizon=1)

        optimize_mock.assert_called_once()

    def test_optimize_both_when_both_provided(self, mocker):
        """
        Test that both alpha and lag_size are optimized when their
        options are provided.
        """
        optimize_mock = mocker.patch(
            "pyoneai.ml.sklearn_prediction_model.tune_hyperparameters",
            return_value=({}, 0.8, 15),
        )

        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={},
            training_params={"lag_sizes": [2, 10], "grid": {"alpha": [1.0]}},
            sequence_length=100,
        )
        prediction_model = SklearnPredictionModel(model_config)
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.predict(ts, horizon=1)

        # Should optimize both parameters
        optimize_mock.assert_called_once()

    def test_no_optimization_when_neither_provided(self, mocker):
        """
        Test that no optimization occurs when neither grid nor lag sizes
        are provided.
        """
        optimize_mock = mocker.patch(
            "pyoneai.ml.sklearn_prediction_model.tune_hyperparameters"
        )

        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={"alpha": 0.3},
            training_params={},
            sequence_length=100,
        )
        prediction_model = SklearnPredictionModel(model_config)
        ts = self.create_univariate_timeseries(self.ts_length)
        prediction_model.predict(ts, horizon=6)

        optimize_mock.assert_not_called()

    def test_optimization_parameters_passed_correctly(self, mocker):
        """Test that optimization function receives correct parameters."""
        optimize_mock = mocker.patch(
            "pyoneai.ml.sklearn_prediction_model.grid_search",
            return_value=({}, float("nan")),
        )

        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={},
            training_params={
                "lag_size": 2,
                "grid": {"alpha": [1.0, 2.0, 3.0, 4.0, 5.0]},
            },
            sequence_length=10,
        )
        prediction_model = SklearnPredictionModel(model_config)
        prediction_model._tune(np.arange(100), hor_size=1)

        # Verify optimization was called with correct parameters
        optimize_mock.assert_called_once()
        grid = optimize_mock.call_args[0][-1]
        assert grid == {"alpha": [1.0, 2.0, 3.0, 4.0, 5.0]}

    def test_alpha_validation_in_hyperparams(self):
        """Test that negative alpha values are rejected."""
        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={"alpha": -0.5},  # negative alpha
            training_params={},
            sequence_length=2,
        )

        with pytest.raises(ValueError, match="'alpha' must be non-negative"):
            _ = SklearnPredictionModel(model_config)

    def test_fallback_lag_size_calculation(self):
        """Test fallback n_lags calculation when not optimized or provided."""
        model_config = ModelConfig(
            model_class="pyoneai.ml.SklearnPredictionModel",
            hyper_params={},
            training_params={"order": 1},
            sequence_length=100,
        )
        prediction_model = SklearnPredictionModel(model_config)

        x = prediction_model._transform(np.arange(30), horizon=6)[0].shape[1]
        assert x == 2
        x = prediction_model._transform(np.arange(100), horizon=6)[0].shape[1]
        assert x == 37
        x = prediction_model._transform(np.arange(500), horizon=6)[0].shape[1]
        assert x == 50
