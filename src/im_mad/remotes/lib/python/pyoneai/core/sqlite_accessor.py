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

import sqlite3
from datetime import timedelta
from typing import Union

import numpy as np

from .base_accessor import AccessorType, BaseAccessor
from .entity_uid import EntityUID
from .metric_types import MetricAttributes, MetricType
from .time import Instant, Period
from .tsnumpy.index import TimeIndex
from .tsnumpy.timeseries import Timeseries


class SQLiteAccessor(BaseAccessor):
    """
    Metric accessor for SQLite database.

    Parameters
    ----------
    monitoring : dict[str, Union[str, int]]
        Dictionary containing the monitoring configuration.
        - "db_path": Path to the SQLite database.
        - "timestamp_col": Name of the timestamp column.
        - "value_col": Name of the metric value column.
        - "monitor_interval": Interval (seconds) at which the data is stored in the database.
        - "table_name_template": Template for the table name.
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
        monitoring: dict[str, Union[str, int]],
    ) -> None:
        self._connection = sqlite3.connect(monitoring["db_path"])
        self._timestamp_col = monitoring.get("timestamp_col", "TIMESTAMP")
        self._value_col = monitoring.get("value_col", "VALUE")
        self._table_name_template = monitoring.get("table_name_template", "{entityUID}_{metric_name}_monitoring")
        self._monitor_interval = monitoring.get("monitor_interval", 60)

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

        tolerance = timedelta(seconds=self._monitor_interval)

        if isinstance(time, Period):
            start = (time.start - tolerance).timestamp()
            end = (time.end + tolerance).timestamp()
        elif isinstance(time, Instant):
            start = (time.value - tolerance).timestamp()
            end = (time.value + tolerance).timestamp()

        ts = Timeseries.read_from_database(
            connection=self._connection,
            table_name=table_name,
            metric_attrs=metric_attrs,
            timestamp_col=self._timestamp_col,
            value_col=self._value_col,
            start_epoch=start,
            end_epoch=end,
        )
        if ts is None:
            return Timeseries(
                time_idx=time,
                metric_idx=np.array([metric_attrs]),
                entity_uid_idx=np.array([entity_uid]),
                data=np.full((len(time), 1, 1), np.nan),
            )

        if metric_attrs.type == MetricType.COUNTER:
            ts = ts.restore_counter()

        # Fill gaps
        # TODO: Add a method for the Timeseries
        # NEEDS TO BE FIXED: it is slow with long timeseries
        if isinstance(time, Period): # Instant doesn't have a start and end
             p = Period(slice(time.start, time.end, ts._time_idx.frequency))
             ts = ts.interpolate(TimeIndex(p.values))

        if TimeIndex(time.values).frequency > ts._time_idx.frequency:
            ts = ts.resample(TimeIndex(time.values).frequency)

        ts = ts.interpolate(TimeIndex(time.values))

        if isinstance(time, Instant):
            return ts[time]

        if metric_attrs.operator == "rate":
            ts = ts.rate()

        return ts.clip()
