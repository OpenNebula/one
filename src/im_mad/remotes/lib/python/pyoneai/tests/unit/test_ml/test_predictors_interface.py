from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.time import Instant, Period
from pyoneai.core.tsnumpy.timeseries import Timeseries


class TestPredictionModelInterface:
    __test__ = False

    @pytest.fixture
    def model_config(self):
        raise NotImplementedError(
            "The 'model_config' fixture must be provided by the test class."
        )

    @pytest.fixture
    def prediction_model(self, model_config):
        raise NotImplementedError(
            "The 'prediction_model' fixture must be provided by the test class."
        )

    def generate_time_index(self, n):
        start = datetime(2024, 7, 12, 1, 0, 10, tzinfo=timezone.utc)
        freq = timedelta(seconds=10)
        if n > 1:
            return Period(slice(start, start + (n - 1) * freq, freq)).values
        else:
            return np.array([start])

    def generate_data(self, n):
        return np.random.random(n)

    def create_univariate_timeseries(self, n):
        time_index = self.generate_time_index(n)
        data = self.generate_data(n).reshape(-1, 1, 1)
        return Timeseries(
            time_idx=time_index,
            metric_idx=np.array(["metric_x"]),
            entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, -1)]),
            data=data
        )

    def create_multivariate_timeseries(self, n):
        time_index = self.generate_time_index(n)
        data_x = self.generate_data(n).reshape(-1, 1, 1)
        data_y = self.generate_data(n).reshape(-1, 1, 1)
        # Combine data for both metrics
        data = np.concatenate([data_x, data_y], axis=1)
        return Timeseries(
            time_idx=time_index,
            metric_idx=np.array(["metric_x", "metric_y"]),
            entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, -1)]),
            data=data
        )

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_fit_model_returns_self(self, prediction_model, create_timeseries):
        ts = getattr(self, create_timeseries)(10)
        fitted_model = prediction_model.fit(ts)
        assert isinstance(
            fitted_model, type(prediction_model)
        ), "fit() should return an instance of the prediction model"

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_predict_returns_timeseries(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=5)
        assert isinstance(
            predictions, Timeseries
        ), "predict() should return a Timeseries instance"

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
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
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_keep_original_metric_name(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=1)
        assert np.array_equal(
            predictions.names, ts.names
        ), "Metric names should be preserved in the predicted timeseries"

    def test_produce_multivariate_on_multivariate_input(
        self, prediction_model
    ):
        ts = self.create_multivariate_timeseries(10)
        predictions = prediction_model.predict(ts, horizon=1)
        assert predictions.ndim == ts.ndim

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_correct_forecast_timeindex_instant(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=1)
        # For the new Timeseries class, we need to check the time index differently
        if isinstance(predictions.time_index, Instant):
            last_time = ts.time_index.values[-1]
            freq = timedelta(seconds=10)  # Using the same frequency as in generate_time_index
            assert predictions.time_index.value == last_time + freq
        else:
            assert False, "Expected Instant time index for horizon=1"

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_correct_forecast_timeindex_period(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(10)
        predictions = prediction_model.predict(ts, horizon=10)
        # For the new Timeseries class, we need to check the time index differently
        if isinstance(predictions.time_index, Period):
            last_time = ts.time_index.values[-1]
            freq = timedelta(seconds=10)  # Using the same frequency as in generate_time_index
            assert predictions.time_index.values[0] == last_time + freq
        else:
            assert False, "Expected Period time index for horizon=10"

    
    def test_load_model_produces_correct_type(
        self, prediction_model, model_config
    ):
        loaded_model = prediction_model.load(model_config)
        assert isinstance(loaded_model, type(prediction_model))

    def _test_warn_on_unsupported_compute_ci_option(
        self, prediction_model_class, model_config
    ):
        with pytest.warns(
            Warning,
            match=r"Model of type .* does not "
            r"support computation of confidence intervals. "
            r"That option will be ignored",
        ):
            _ = prediction_model_class(model_config)
