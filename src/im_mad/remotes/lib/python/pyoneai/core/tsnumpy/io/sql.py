from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import TYPE_CHECKING

from pyoneai.core.metric_types import UInt

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
    obj: Timeseries
    retention: timedelta
    suffix: str

    def __init__(
        self,
        path: Path,
        obj: Timeseries,
        retention: timedelta | None = None,
        suffix: str = "monitoring",
    ) -> None:
        self.path = path
        self.obj = obj
        self.retention = retention
        self.suffix = suffix
        self._schemas = {
            m_attr: Schema.get_schema(m_attr) for m_attr in self.obj.metrics
        }

    @staticmethod
    def _get_table_name(
        entity_uid: EntityUID, m_attr: MetricAttributes, suffix: str
    ) -> str:
        return f"{entity_uid}_{m_attr.name}_{suffix}"

    @staticmethod
    def _get_create_table_query(
        schema: Schema, table_name: str, skip_if_exists: bool
    ) -> str:
        if skip_if_exists:
            return f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    {schema.TIMESTAMP.name} {schema.TIMESTAMP.sql_dtype} 
                    PRIMARY KEY,
                    {schema.VALUE.name} {schema.VALUE.sql_dtype}
                )
            """
        else:
            return f"""
                CREATE TABLE {table_name} (
                    {schema.TIMESTAMP.name} {schema.TIMESTAMP.sql_dtype} 
                    PRIMARY KEY,
                    {schema.VALUE.name} {schema.VALUE.sql_dtype}
                )
            """

    @staticmethod
    def _get_insert_data_query(schema: Schema, table_name: str) -> str:
        return f"""
            INSERT INTO {table_name} ({schema.TIMESTAMP.name}, 
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
            CREATE TRIGGER IF NOT EXISTS {table_name}_autoremove_old AFTER 
            INSERT ON {table_name} 
            BEGIN
                DELETE FROM {table_name} WHERE {schema.TIMESTAMP.name} < 
                (SELECT MAX({schema.TIMESTAMP.name}) FROM {table_name}) 
                - {retention.total_seconds()};
            END;
            """
        else:
            return f"""
            CREATE TRIGGER {table_name}_autoremove_old AFTER 
            INSERT ON {table_name} 
            BEGIN
                DELETE FROM {table_name} WHERE {schema.TIMESTAMP.name} < 
                (SELECT MAX({schema.TIMESTAMP.name}) FROM {table_name}) 
                - {retention.total_seconds()};
            END;
            """

    def insert_data(self) -> None:
        with sqlite3.connect(self.path) as conn:
            for m_attr, entity_uid, ts in self.obj.iter_over_variates():
                table_name = self._get_table_name(
                    entity_uid, m_attr, self.suffix
                )
                cursor = conn.cursor()
                cursor.execute(
                    self._get_create_table_query(
                        self._schemas[m_attr], table_name, skip_if_exists=True
                    )
                )
                if self.retention is not None:
                    cursor.execute(
                        self._get_add_retention_trigger_query(
                            self._schemas[m_attr],
                            table_name,
                            self.retention,
                            skip_if_exists=True,
                        )
                    )

                timestamps = list(
                    map(lambda x: int(x.timestamp()), ts.time_index)
                )
                data = ts.values.flatten().tolist()

                cursor.executemany(
                    self._get_insert_data_query(
                        self._schemas[m_attr], table_name
                    ),
                    list(zip(timestamps, data)),
                )
