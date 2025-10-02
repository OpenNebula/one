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
from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Union

import numpy as np

from pyoneai.core.metric_types import UInt
from pyoneai.core.time import Instant, Period

if TYPE_CHECKING:
    from pyoneai.core.entity_uid import EntityUID
    from pyoneai.core.metric_types import DType, MetricAttributes, UInt
    from pyoneai.core.tsnumpy.timeseries import Timeseries


@dataclass(frozen=True)
class Column:
    name: str
    dtype: DType

    @property
    def sql_dtype(self) -> str:
        return "INTEGER" if isinstance(self.dtype, UInt) else "REAL"


@dataclass(frozen=True)
class Schema:
    TIMESTAMP: Column
    VALUE: Column

    @classmethod
    def get_schema(cls, metric_attributes: MetricAttributes):
        return cls(
            TIMESTAMP=Column("TIMESTAMP", UInt()),
            VALUE=Column("VALUE", metric_attributes.dtype),
        )


class SQLEngine:
    path: Path
    suffix: str

    def __init__(
        self,
        path: Path,
        suffix: str = "monitoring",
    ) -> None:
        self.path = path
        self.suffix = suffix

    def _get_table_name(
        self, entity_uid: EntityUID, m_attr: MetricAttributes
    ) -> str:
        return f"{entity_uid}_{m_attr.name}_{self.suffix}"

    @staticmethod
    def _get_create_table_query(
        schema: Schema, table_name: str, skip_if_exists: bool
    ) -> str:
        if skip_if_exists:
            return f"""
                CREATE TABLE IF NOT EXISTS '{table_name}' (
                    {schema.TIMESTAMP.name} {schema.TIMESTAMP.sql_dtype} 
                    PRIMARY KEY,
                    {schema.VALUE.name} {schema.VALUE.sql_dtype}
                )
            """
        else:
            return f"""
                CREATE TABLE '{table_name}' (
                    {schema.TIMESTAMP.name} {schema.TIMESTAMP.sql_dtype} 
                    PRIMARY KEY,
                    {schema.VALUE.name} {schema.VALUE.sql_dtype}
                )
            """

    @staticmethod
    def _get_insert_data_query(schema: Schema, table_name: str) -> str:
        return f"""
            INSERT INTO '{table_name}' ({schema.TIMESTAMP.name}, 
            {schema.VALUE.name}) VALUES (?, ?)
        """

    @staticmethod
    def _get_add_retention_trigger_query(
        schema: Schema,
        table_name: str,
        retention: timedelta,
        skip_if_exists: bool,
    ) -> str:
        if skip_if_exists:
            return f"""
            CREATE TRIGGER IF NOT EXISTS '{table_name}_autoremove_old' AFTER 
            INSERT ON '{table_name}'
            BEGIN
                DELETE FROM '{table_name}' WHERE {schema.TIMESTAMP.name} < 
                (SELECT MAX({schema.TIMESTAMP.name}) FROM '{table_name}') 
                - {retention.total_seconds()};
            END;
            """
        else:
            return f"""
            CREATE TRIGGER '{table_name}_autoremove_old' AFTER 
            INSERT ON '{table_name}' 
            BEGIN
                DELETE FROM '{table_name}' WHERE {schema.TIMESTAMP.name} < 
                (SELECT MAX({schema.TIMESTAMP.name}) FROM '{table_name}') 
                - {retention.total_seconds()};
            END;
            """

    @staticmethod
    def _get_read_query(
        schema: Schema,
        table_name: str,
        start_timestamp: int,
        end_timestamp: int,
    ) -> str:
        return f"""
        SELECT {schema.TIMESTAMP.name}, {schema.VALUE.name}
        FROM '{table_name}'
        WHERE {schema.TIMESTAMP.name} BETWEEN '{start_timestamp}' AND '{end_timestamp}'
        ORDER BY {schema.TIMESTAMP.name} ASC;
        """

    def insert_data(
        self, obj: Timeseries, retention: timedelta | None = None
    ) -> None:
        schemas = {m_attr: Schema.get_schema(m_attr) for m_attr in obj.metrics}
        with sqlite3.connect(self.path) as conn:
            for m_attr, entity_uid, ts in obj.iter_over_variates():
                table_name = self._get_table_name(entity_uid, m_attr)
                cursor = conn.cursor()
                cursor.execute(
                    self._get_create_table_query(
                        schemas[m_attr], table_name, skip_if_exists=True
                    )
                )
                if retention is not None:
                    cursor.execute(
                        self._get_add_retention_trigger_query(
                            schemas[m_attr],
                            table_name,
                            retention,
                            skip_if_exists=True,
                        )
                    )

                timestamps = list(
                    map(lambda x: int(x.timestamp()), ts.time_index)
                )
                data = ts.values.flatten().tolist()

                cursor.executemany(
                    self._get_insert_data_query(schemas[m_attr], table_name),
                    list(zip(timestamps, data)),
                )

    def read_data(
        self,
        metric_attributes: MetricAttributes,
        entity_uid: EntityUID,
        time: Union[Period, Instant],
    ) -> Timeseries | None:
        """
        Read Timeseries from database.

        Parameters
        ----------
        metric_attributes : MetricAttributes
            Metric attributes.
        entity_uid : EntityUID
            Entity UID.
        time : Union[Period, Instant]
            Time range to read.

        Returns
        -------
        Timeseries
            Timeseries object
        """
        from pyoneai.core.tsnumpy.index.time import TimeIndex
        from pyoneai.core.tsnumpy.timeseries import Timeseries

        if not isinstance(time, (Period, Instant)):
            raise TypeError("Time must be a Period or Instant")
        start_timestamp = int(time.values[0].timestamp())
        end_timestamp = int(time.values[-1].timestamp())
        schema = Schema.get_schema(metric_attributes)
        table_name = self._get_table_name(entity_uid, metric_attributes)
        with sqlite3.connect(self.path) as conn:
            cursor = conn.cursor()

            data = cursor.execute(
                self._get_read_query(
                    schema, table_name, start_timestamp, end_timestamp
                )
            ).fetchall()
            if not data:
                return None

        time_index = TimeIndex(
            np.array(
                [datetime.fromtimestamp(row[0], timezone.utc) for row in data],
                dtype="object",
            )
        )

        values = []
        for row in data:
            value = row[1]
            if value is None:
                values.append(np.nan)
            else:
                try:
                    values.append(float(value))
                except (ValueError, TypeError):
                    values.append(np.nan)
        values = np.array(values, dtype=schema.VALUE.dtype.DTYPE)
        return Timeseries(
            time_idx=time_index,
            metric_idx=np.array([metric_attributes]),
            entity_uid_idx=np.array([entity_uid]),
            data=values.reshape((len(time_index), 1, 1)),
        )
