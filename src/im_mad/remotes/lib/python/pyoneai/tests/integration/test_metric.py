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

import os
import sqlite3
from datetime import datetime, timedelta, timezone
from unittest.mock import ANY

import numpy as np
import pytest

from pyoneai.core import (
    EntityType,
    EntityUID,
    Instant,
    Metric,
    MetricAccessor,
    MetricAttributes,
    Period,
    PredictorAccessor,
    SQLiteAccessor,
    Timeseries,
)
from pyoneai.ml import (
    FourierPredictionModel,
    ModelConfig,
    PersistencePredictionModel,
)


class TestMetric:

    def sample_db(self):
        conn = sqlite3.connect(self.monitoring["db_path"])

        entity_uid = "virtualmachine_1"
        metric_name = "cpu"
        table_name = f"{entity_uid}_{metric_name}_monitoring"

        conn.execute(
            f"""         
            CREATE TABLE IF NOT EXISTS {table_name} (
                TIMESTAMP INTEGER PRIMARY KEY,
                VALUE REAL NOT NULL
            )
        """
        )

        start = datetime(2024, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(2024, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        frequency = timedelta(minutes=60)

        times = []
        current = start
        while current <= end:
            times.append(current)
            current += frequency

        data = []
        period = 24 * 3600
        min_value = 0
        max_value = 100
        amplitude = (max_value - min_value) / 2
        offset = (max_value + min_value) / 2
        time_seconds = np.array([(t - start).total_seconds() for t in times])
        data = amplitude * np.sin(2 * np.pi * time_seconds / period) + offset

        conn.executemany(
            f"INSERT INTO {table_name} (TIMESTAMP, VALUE) VALUES (?, ?)",
            zip([t.timestamp() for t in times], data),
        )
        conn.commit()
        conn.close()

    @pytest.fixture
    def fourier_config_and_model(self):
        yield ModelConfig(
            model_class="pyoneai.ml.FourierPredictionModel",
            sequence_length=100,
            hyper_params={"nbr_freqs_to_keep": 40},
        ), FourierPredictionModel

    # @pytest.fixture
    # def hgbt_config_and_model(self):
    #     HgbtPredictionModel.MIN_N_SPLITS = 1
    #     yield ModelConfig(
    #         model_class="sklearn.ensemble.HistGradientBoostingRegressor",
    #         sequence_length=100,
    #         training_params={
    #             "max_iter": 100,
    #             "context_length": 10,
    #             "compute_ci": False,
    #         },
    #     ), HgbtPredictionModel

    # @pytest.fixture
    # def arima_config_and_model(self):
    #     yield ModelConfig(
    #         model_class="statsmodels.tsa.arima.model.ARIMA",
    #         sequence_length=100,
    #         hyper_params={
    #             "order": [0, 0, 0],
    #             "seasonal_order": [0, 0, 0, 0],
    #             "enforce_stationarity": True,
    #             "enforce_invertibility": True,
    #             "concentrate_scale": False,
    #             "trend_offset": 1,
    #         },
    #     ), ArimaPredictionModel

    @pytest.fixture
    def persistence_config_and_model(self):
        yield ModelConfig(
            model_class="pyoneai.ml.PersistencePredictionModel",
            sequence_length=2,
        ), PersistencePredictionModel

    # NOTE: this fixture parametrizes the prediction models
    @pytest.fixture(
        params=[
            "fourier_config_and_model",
            # "hgbt_config_and_model",
            # "arima_config_and_model",
            "persistence_config_and_model",
        ]
    )
    def config_and_model(self, request):
        yield request.getfixturevalue(request.param)

    @pytest.fixture(autouse=True)
    def setup(self, config_and_model, tmp_path, mocker):
        model_config, prediction_model_class = config_and_model
        self.monitoring = {
            "db_path": os.path.join(tmp_path, "test_metrics.db"),
            "monitor_interval": 3600,
        }
        self.sample_db()
        self.observator = SQLiteAccessor(self.monitoring)

        self.predictor = PredictorAccessor(
            prediction_model=prediction_model_class(model_config)
        )

        metric_accessor = MetricAccessor(
            observator_accessor=self.observator,
            predictor_accessor=self.predictor,
        )

        self.mock_observator_get_ts = mocker.patch.object(
            SQLiteAccessor,
            "get_timeseries",
            wraps=metric_accessor._observator_accessor.get_timeseries,
        )

        self.mock_predictor_get_ts = mocker.patch.object(
            PredictorAccessor,
            "get_timeseries",
            wraps=metric_accessor._predictor_accessor.get_timeseries,
        )

        self.entity_uid = EntityUID(type=EntityType.VIRTUAL_MACHINE, id=1)
        self.attrs = MetricAttributes(name="cpu")

        self.metric = Metric(
            entity_uid=self.entity_uid,
            attrs=self.attrs,
            accessor=metric_accessor,
        )

        self.period_past_future = Period(
            slice("-1d", "+1d", "1h"),
            origin="2024-10-31T10:00+00:00",
        )

        self.period_past = Period(
            slice("-1d", "-5h", "1h"),
            origin="2024-10-31T23:00+00:00",
        )

        self.period_future = Period(
            slice("+1h", "+5h", "1h"),
            origin="2024-12-30T23:00+00:00",
        )

        self.instant_past = Instant(
            timedelta(days=-1),
            origin=datetime(2024, 12, 30, tzinfo=timezone.utc),
        )
        self.instant_future = Instant(
            timedelta(days=+1),
            origin=datetime(2024, 12, 30, tzinfo=timezone.utc),
        )

    def test_metric_past(self):
        """Verify retrieval of past metrics with tolerance-adjusted time range."""
        timeseries = self.metric[self.period_past]
        assert isinstance(timeseries, Timeseries)
        # Verify all requested points exist (timeseries may contain extra points due to tolerance)
        period_times = set(self.period_past.values)
        ts_times = set(timeseries.time_index)
        assert period_times.issubset(ts_times), "Timeseries is missing requested time points"

        self.mock_observator_get_ts.assert_called_once_with(
            self.entity_uid, self.attrs, self.period_past
        )
        self.mock_predictor_get_ts.assert_not_called()
        
        # NOTE: Both pandas and polars has to_numpy method to test values
        assert np.all(~np.isnan(timeseries.to_array()))

    def test_metric_future(self):
        timeseries = self.metric[self.period_future]

        assert isinstance(timeseries, Timeseries)
        assert len(timeseries) == len(self.period_future)
        self.mock_observator_get_ts.assert_called_once()
        self.mock_predictor_get_ts.assert_called_once()
        assert np.all(~np.isnan(timeseries.to_array()))

    def test_metric_past_and_future(self):
        """Verify retrieval of metrics spanning both past and future periods."""
        timeseries = self.metric[self.period_past_future]

        assert isinstance(timeseries, Timeseries)
        # Verify all requested points exist (timeseries may contain extra points due to tolerance)
        period_times = set(self.period_past.values)
        ts_times = set(timeseries.time_index)
        assert period_times.issubset(ts_times), "Timeseries is missing requested time points"
        assert self.mock_observator_get_ts.call_count == 2
        self.mock_predictor_get_ts.assert_called_once()
        assert np.all(~np.isnan(timeseries.to_array()))

    def test_metric_instant_past(self):
        timeseries = self.metric[self.instant_past]

        assert isinstance(timeseries, Timeseries)
        assert len(timeseries) == 1
        self.mock_observator_get_ts.assert_called_once_with(
            self.entity_uid, self.attrs, self.instant_past
        )
        self.mock_predictor_get_ts.assert_not_called()
        assert np.all(~np.isnan(timeseries.to_array()))

    def test_metric_instant_future(self):
        timeseries = self.metric[self.instant_future]

        assert isinstance(timeseries, Timeseries)
        assert len(timeseries) == 1
        self.mock_observator_get_ts.assert_called_once_with(
            self.entity_uid, self.attrs, ANY
        )
        self.mock_predictor_get_ts.assert_called_once_with(
            self.entity_uid,
            self.attrs,
            self.instant_future,
            observator_accessor=self.observator,
        )
        assert np.all(~np.isnan(timeseries.to_array()))
