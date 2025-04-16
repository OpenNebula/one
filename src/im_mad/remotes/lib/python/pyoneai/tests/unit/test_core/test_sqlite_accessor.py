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

import pytest
from pytest_mock import MockerFixture

from pyoneai.core import (
    AccessorType,
    EntityType,
    EntityUID,
    MetricAttributes,
    Period,
    SQLiteAccessor,
)
from pyoneai.core.tsnumpy import Timeseries
from datetime import datetime, timezone
import numpy as np
from pyoneai.core.tsnumpy.index import TimeIndex


class TestSQLiteAccessor:
    @pytest.fixture(autouse=True)
    def setup(self, mocker: MockerFixture):
        self.mock_connection = mocker.MagicMock()
        mocker.patch("sqlite3.connect", return_value=self.mock_connection)
        self.entity_uid = EntityUID(EntityType.VIRTUAL_MACHINE, 0)
        self.metric_attrs = MetricAttributes(name="cpu")
        self.monitoring = {
            "db_path": "dummy.db",
            "monitor_interval": 60,
        }
        self.accessor = SQLiteAccessor(self.monitoring)

    def test_init(self):
        assert self.accessor._connection is self.mock_connection
        assert self.accessor._timestamp_col == "TIMESTAMP"
        assert self.accessor._value_col == "VALUE"
        assert (
            self.accessor._table_name_template
            == "{entityUID}_{metric_name}_monitoring"
        )

    def test_type(self):
        assert self.accessor.type == AccessorType.OBSERVATION

    def test_get_timeseries(self, mocker):
        time_values = np.array([
            datetime(2025, 1, 1, 9, 0, 0, tzinfo=timezone.utc),
            datetime(2025, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
            datetime(2025, 1, 1, 11, 0, 0, tzinfo=timezone.utc),
        ])
        
        real_ts = Timeseries(
            time_idx=TimeIndex(time_values),
            metric_idx=np.array([self.metric_attrs]),
            entity_uid_idx=np.array([self.entity_uid]),
            data=np.array([[[50.0]], [[60.0]], [[70.0]]])
        )
        
        # Patch the read_from_database to return our real timeseries
        mocker.patch(
            "pyoneai.core.tsnumpy.timeseries.Timeseries.read_from_database",
            return_value=real_ts,
        )
        mock_period = Period(
                slice("2025-01-01T09:15:00", "2025-01-01T16:26:00", "1h")
            )
        self.accessor.get_timeseries(
            self.entity_uid, self.metric_attrs, mock_period
        )
        Timeseries.read_from_database.assert_called_once()
