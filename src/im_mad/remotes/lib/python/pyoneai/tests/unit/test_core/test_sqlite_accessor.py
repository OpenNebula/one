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

from datetime import timedelta

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


class TestSQLiteAccessor:
    @pytest.fixture(autouse=True)
    def setup(self, mocker: MockerFixture):
        self.mock_connection = mocker.MagicMock()
        mocker.patch("sqlite3.connect", return_value=self.mock_connection)
        self.entity_uid = EntityUID(EntityType.VIRTUAL_MACHINE, 0)
        self.metric_attrs = MetricAttributes(name="cpu")
        self.monitor_interval = 60
        self.accessor = SQLiteAccessor(
            db_path="dummy_db_path", monitor_interval=self.monitor_interval
        )

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
        expected_ts = mocker.MagicMock()
        mocker.patch(
            "pyoneai.core.tsnumpy.Timeseries.read_from_database",
            return_value=expected_ts,
        )
        mock_period = mocker.MagicMock(spec=Period)
        expected_table_name = "virtualmachine_0_cpu_monitoring"
        result = self.accessor.get_timeseries(
            self.entity_uid, self.metric_attrs, mock_period
        )

        assert result == expected_ts
        Timeseries.read_from_database.assert_called_once_with(
            connection=self.accessor._connection,
            table_name=expected_table_name,
            metric_name="cpu",
            timestamp_col="TIMESTAMP",
            value_col="VALUE",
            time=mock_period,
            tolerance=timedelta(seconds=self.monitor_interval),
        )
