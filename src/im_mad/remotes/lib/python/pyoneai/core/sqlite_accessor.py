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

from __future__ import annotations

__all__ = ["PredictorAccessor"]

import importlib.util
import sqlite3
from datetime import timedelta
from typing import TYPE_CHECKING, Any

import numpy as np

from .base_accessor import AccessorType, BaseAccessor
from .entity_uid import EntityUID
from .metric import MetricAttributes
from .time import Instant, Period
from .tsnumpy.timeseries import Timeseries


class SQLiteAccessor(BaseAccessor):
    """
    Metric accessor for SQLite database.

    Parameters
    ----------
    db_path : str
        Path to the SQLite database.
    timestamp_col : str, default=TIMESTAMP
        Name of the timestamp column.
    value_col : str, default=VALUE
        Name of the metric value column.
    monitor_interval : int, default=60
        Interval (seconds) at which the data is stored in the database.
    """

    __slots__ = (
        "_connection",
        "_timestamp_col",
        "_value_col",
        "_table_name_template",
        "_monitor_interval",
    )

    def __init__(
        self,
        db_path: str,
        timestamp_col: str = "TIMESTAMP",
        value_col: str = "VALUE",
        monitor_interval: int = 60,
    ) -> None:
        self._connection = sqlite3.connect(db_path)
        self._timestamp_col = timestamp_col
        self._value_col = value_col
        self._table_name_template = "{entityUID}_{metric_name}_monitoring"
        self._monitor_interval = monitor_interval

    @property
    def type(self) -> AccessorType:
        return AccessorType.OBSERVATION

    def get_timeseries(
        self,
        entity_uid: EntityUID,
        metric_attrs: MetricAttributes,
        time: Instant | Period,
    ) -> Timeseries:
        """
        Retrieve timeseries data from the SQLite database for the given
        time period.

        Parameters
        ----------
        entity : Entity
            Entity to retrieve data for.
        metric_attrs : MetricAttributes
            Attributes of the metric.
        time : Instant or Period
            Time period to retrieve data for.

        Returns
        -------
        Timeseries
            Timeseries data for the given time period.
        """
        table_name = self._table_name_template.format(
            entityUID=entity_uid, metric_name=metric_attrs.name
        )
        return Timeseries.read_from_database(
            connection=self._connection,
            table_name=table_name,
            metric_name=metric_attrs.name,
            timestamp_col=self._timestamp_col,
            value_col=self._value_col,
            time=time,
            tolerance=timedelta(seconds=self._monitor_interval),
        )
