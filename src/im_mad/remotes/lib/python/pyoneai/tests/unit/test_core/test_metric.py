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

from datetime import datetime, timedelta, timezone
from numbers import Number
from unittest.mock import MagicMock

import pytest

from pyoneai.core import (
    EntityUID,
    Instant,
    Metric,
    MetricAccessor,
    MetricAttributes,
    Period,
)
from pyoneai.core.tsnumpy import Timeseries
from pyoneai.core.metric_types import UInt


class TestMetric:
    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        self.mock_entity_uid = mocker.MagicMock(spec=EntityUID)
        self.mock_attrs = mocker.MagicMock(spec=MetricAttributes)
        self.mock_accessor = mocker.MagicMock(spec=MetricAccessor)
        self.metric = Metric(
            entity_uid=self.mock_entity_uid,
            attrs=self.mock_attrs,
            accessor=self.mock_accessor,
        )

    def test_init(self):
        assert hasattr(self.metric, "entity_uid")
        assert self.metric._entity_uid is self.mock_entity_uid
        assert hasattr(self.metric, "attributes")
        assert self.metric._attrs is self.mock_attrs
        assert hasattr(self.metric, "accessor")
        assert self.metric._accessor is self.mock_accessor

    @pytest.mark.parametrize(
        "key, mock_return_type, expected_type, expected_attrs",
        [
            (
                "2024-01-01T00:00:00+00:00",
                Number,
                Instant,
                {"value": datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)},
            ),
            (
                slice(
                    "2024-07-04T15:08:45+00:00",
                    "2024-07-04T15:10:00+00:00",
                    "15s",
                ),
                Timeseries,
                Period,
                {
                    "start": datetime(
                        2024, 7, 4, 15, 8, 45, tzinfo=timezone.utc
                    ),
                    "end": datetime(2024, 7, 4, 15, 10, tzinfo=timezone.utc),
                    "resolution": timedelta(seconds=15),
                },
            ),
            (
                Instant("2024-07-04T15:08:45+00:00"),
                Number,
                Instant,
                {
                    "value": datetime(
                        2024, 7, 4, 15, 8, 45, tzinfo=timezone.utc
                    )
                },
            ),
            (
                Period(
                    slice(
                        "2024-07-04T15:08:45+00:00",
                        "2024-07-04T15:10:00+00:00",
                        "15s",
                    )
                ),
                Timeseries,
                Period,
                {
                    "start": datetime(
                        2024, 7, 4, 15, 8, 45, tzinfo=timezone.utc
                    ),
                    "end": datetime(
                        2024, 7, 4, 15, 10, 00, tzinfo=timezone.utc
                    ),
                    "resolution": timedelta(seconds=15),
                },
            ),
        ],
    )
    def test_getitem(
        self, key, mock_return_type, expected_type, expected_attrs, mocker
    ):
        self.mock_accessor.get_timeseries.return_value = MagicMock(
            spec=mock_return_type
        )

        result = self.metric[key]
        self.mock_accessor.get_timeseries.assert_called_once_with(
            self.mock_entity_uid, self.mock_attrs, mocker.ANY
        )
        actual_key = self.mock_accessor.get_timeseries.call_args[0][2]

        assert isinstance(actual_key, expected_type)
        for attr, value in expected_attrs.items():
            assert getattr(actual_key, attr) == value

        assert isinstance(result, mock_return_type)

    def test_getitem_with_invalid_key(self):
        with pytest.raises(TypeError):
            _ = self.metric[123]
