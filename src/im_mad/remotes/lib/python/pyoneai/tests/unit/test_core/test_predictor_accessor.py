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

import pytest
from pytest_mock import MockerFixture
import numpy as np

from pyoneai.core import (
    AccessorType,
    EntityUID,
    Instant,
    MetricAttributes,
    Period,
    PredictorAccessor,
)


class TestPredictorAccessor:
    @pytest.fixture(autouse=True)
    def setup(self, mocker: MockerFixture):
        self.mock_model = mocker.MagicMock()
        self.mock_model.model_config = mocker.MagicMock()
        self.mock_model.model_config.sequence_length = 4
        self.mock_entity_uid = mocker.MagicMock(spec=EntityUID)
        self.mock_metric_attrs = mocker.MagicMock(spec=MetricAttributes)
        self.mock_observator_accessor = mocker.MagicMock()
        self.instant = Instant(
            "2024-07-04T12+00:00", origin="2024-07-04T11:59:45+00:00"
        )
        self.period = Period(
            slice("2024-07-04T12+00:00", "2024-07-04T14+00:00", "15s"),
            origin="2024-07-04T12+00:00",
        )
        self.accessor = PredictorAccessor(prediction_model=self.mock_model)

    def test_type(self):
        assert self.accessor.type == AccessorType.PREDICTION

    def test_get_timeseries_instant(self, mocker: MockerFixture):
        result = self.accessor.get_timeseries(
            self.mock_entity_uid,
            self.mock_metric_attrs,
            self.instant,
            observator_accessor=self.mock_observator_accessor,
        )
        self.mock_observator_accessor.get_timeseries.assert_called_once_with(
            self.mock_entity_uid,
            self.mock_metric_attrs,
            mocker.ANY,
        )
        hist_start_ = (
            self.instant.origin
            - self.mock_model.model_config.sequence_length
            * self.instant.duration
        )
        hist_end = self.instant.origin
        duration = (
            self.mock_model.model_config.sequence_length
            * self.instant.duration
        )
        called_period = self.mock_observator_accessor.get_timeseries.call_args[
            0
        ][2]
        assert called_period.start == hist_start_
        assert called_period.end == hist_end
        assert called_period.duration == duration
        assert called_period.resolution == self.instant.duration

        self.mock_model.predict.assert_called_once_with(
            metric=self.mock_observator_accessor.get_timeseries.return_value,
            horizon=1,
        )
        assert np.array_equal(
            result._data, self.mock_model.predict.return_value._data
        )

    def test_get_timeseries_period(self, mocker: MockerFixture):
        result = self.accessor.get_timeseries(
            self.mock_entity_uid,
            self.mock_metric_attrs,
            self.period,
            observator_accessor=self.mock_observator_accessor,
        )
        self.mock_observator_accessor.get_timeseries.assert_called_once_with(
            self.mock_entity_uid,
            self.mock_metric_attrs,
            mocker.ANY,
        )
        called_period = self.mock_observator_accessor.get_timeseries.call_args[
            0
        ][2]
        hist_start = (
            (self.period.start - self.period.resolution)
            - self.mock_model.model_config.sequence_length
            * self.period.resolution
        )
        hist_end = self.period.start - self.period.resolution
        duration = (
            self.mock_model.model_config.sequence_length
            * self.period.resolution
        )
        assert called_period.start == hist_start
        assert called_period.end == hist_end
        assert called_period.duration == duration
        assert called_period.resolution == self.period.resolution

        self.mock_model.predict.assert_called_once_with(
            metric=self.mock_observator_accessor.get_timeseries.return_value,
            horizon=len(self.period.values),
        )
        assert np.array_equal(
            result._data, self.mock_model.predict.return_value._data
        )
