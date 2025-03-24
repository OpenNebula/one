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
    Entity,
    EntityType,
    EntityUID,
    Float,
    Instant,
    MetricAttributes,
    MetricType,
    Period,
    Timeseries,
    UInt,
)
from pyoneai.ml import (
    FourierPredictionModel,
    ModelConfig,
    PersistencePredictionModel,
)


class TestEntity:

    def sample_db(self):
        conn = sqlite3.connect(self.monitoring["db_path"])

        for name, metric in self.metrics.items():
            table_name = f"{self.entity_uid}_{name}_monitoring"

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
            min_value = metric.dtype.limits[0]
            max_value = metric.dtype.limits[1]
            amplitude = (max_value - min_value) / 2
            offset = (max_value + min_value) / 2
            time_seconds = np.array(
                [(t - start).total_seconds() for t in times]
            )
            data = (
                amplitude * np.sin(2 * np.pi * time_seconds / period) + offset
            )

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
        self.model_config, self.prediction_model_class = config_and_model
        self.monitoring = {
            "db_path": os.path.join(tmp_path, "test_metrics.db"),
            "monitor_interval": 60,
        }
        self.entity_uid = EntityUID(type=EntityType.VIRTUAL_MACHINE, id=1)
        self.metrics = {
            "cpu": MetricAttributes(
                name="cpu",
                type=MetricType.COUNTER,
                dtype=Float(0.0, 100.0),
            ),
            "memory": MetricAttributes(
                name="memory", type=MetricType.GAUGE, dtype=UInt(0, 1000000)
            ),
        }

        self.sample_db()

        self.entity = Entity(
            uid=self.entity_uid,
            metrics=self.metrics,
            monitoring=self.monitoring,
            artifact=self.prediction_model_class(self.model_config),
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

    def test_past(self):
        for _, m in self.entity.metrics.items():
            timeseries = m[self.period_past]

            assert isinstance(timeseries, Timeseries)
            assert len(timeseries) == len(self.period_past)
            assert np.all(~np.isnan(timeseries.to_array()))
            assert np.all(
                (timeseries.to_array() >= m.attributes.dtype.limits[0])
                & (timeseries.to_array() <= m.attributes.dtype.limits[1])
            )

    def test_future(self):
        for _, m in self.entity.metrics.items():
            timeseries = m[self.period_future]

            assert isinstance(timeseries, Timeseries)
            assert len(timeseries) == len(self.period_future)
            assert np.all(~np.isnan(timeseries.to_array()))
            assert np.all(
                (timeseries.to_array() >= m.attributes.dtype.limits[0])
                & (timeseries.to_array() <= m.attributes.dtype.limits[1])
            )

    def test_past_and_future(self):
        for _, m in self.entity.metrics.items():
            timeseries = m[self.period_past_future]

            assert isinstance(timeseries, Timeseries)
            assert len(timeseries) == len(self.period_past_future)
            assert np.all(~np.isnan(timeseries.to_array()))
            assert np.all(
                (timeseries.to_array() >= m.attributes.dtype.limits[0])
                & (timeseries.to_array() <= m.attributes.dtype.limits[1])
            )

    # def test_instant_past(self):
    #     for _, m in self.entity.metrics.items():
    #         timeseries = m[self.instant_past]

    #         assert isinstance(timeseries, Timeseries)
    #         assert len(timeseries) == 1
    #         assert np.all(~np.isnan(timeseries.to_array()))
    #         assert np.all(
    #             (timeseries.to_array() >= m.attributes.dtype.limits[0])
    #             & (timeseries.to_array() <= m.attributes.dtype.limits[1])
    #         )

    # def test_instant_future(self):
    #     for _, m in self.entity.metrics.items():
    #         timeseries = m[self.instant_future]

    #         assert isinstance(timeseries, Timeseries)
    #         assert len(timeseries) == 1
    #         assert np.all(~np.isnan(timeseries.to_array()))
    #         assert np.all(
    #             (timeseries.to_array() >= m.attributes.dtype.limits[0])
    #             & (timeseries.to_array() <= m.attributes.dtype.limits[1])
    #         )
