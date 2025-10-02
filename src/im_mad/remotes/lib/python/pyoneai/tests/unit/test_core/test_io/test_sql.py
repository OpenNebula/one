import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from pyoneai.core import (
    EntityType,
    EntityUID,
    Float,
    MetricAttributes,
    Period,
    Timeseries,
    UInt,
)
from pyoneai.core.tsnumpy.io import SQLEngine


class TestSqlEngine:

    @pytest.fixture
    def sample_ts(self, tmp_path) -> Timeseries:
        self.db_path = tmp_path / "test.db"
        period = Period(
            slice(
                "2024-01-01T00:00:00+00:00", "2024-01-01T01:00:00+00:00", "1h"
            )
        )

        entities = np.array(
            [
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                EntityUID(EntityType.VIRTUAL_MACHINE, 2),
            ]
        )

        metrics = np.array(
            [
                MetricAttributes(
                    name="cpu",
                ),
                MetricAttributes(
                    name="memory",
                ),
                MetricAttributes(
                    name="network",
                ),
            ]
        )

        data = np.array(
            [
                # t=0
                [
                    [1, 2],  # cpu
                    [3, 4],  # memory
                    [5, 6],  # network
                ],
                # t=1
                [
                    [7, 8],  # cpu
                    [9, 10],  # memory
                    [11, 12],  # network
                ],
            ]
        )

        yield Timeseries(
            time_idx=period,
            metric_idx=metrics,
            entity_uid_idx=entities,
            data=data,
        )

    @pytest.fixture(autouse=True)
    def setup(self):
        self.suffix = "monitoring"

    def _assert_table_exists(self, table_name):
        res = self.cursor.execute(
            f"SELECT name FROM sqlite_master WHERE type='table' "
            f"AND name='{table_name}'"
        )
        tables = res.fetchall()
        assert len(tables) == 1
        assert tables == [(table_name,)]

    def test_valid_time_index_on_inserting_multiple_data(self, sample_ts):
        engine = SQLEngine(self.db_path)
        engine.insert_data(sample_ts)
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                time_index = np.array(
                    [datetime.fromtimestamp(x[0], timezone.utc) for x in res]
                )
                assert np.array_equal(time_index, ts.time_index)

    def test_valid_values_on_inserting_multiple_data(self, sample_ts):
        engine = SQLEngine(self.db_path)
        engine.insert_data(sample_ts)
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                assert np.array_equal(
                    np.array([x[1] for x in res]), ts.values.squeeze()
                )

    def test_valid_time_index_on_inserting_single_data(self, sample_ts):
        new_ts = sample_ts.isel(time_idx=np.array([0]))
        engine = SQLEngine(self.db_path)
        engine.insert_data(new_ts)
        for m_attr, entity_uid, ts in new_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                time_index = np.array(
                    [datetime.fromtimestamp(x[0], timezone.utc) for x in res]
                )
                assert np.array_equal(time_index, ts.time_index)

    def test_valid_values_on_inserting_single_data(self, sample_ts):
        new_ts = sample_ts.isel(time_idx=np.array([0]))
        engine = SQLEngine(self.db_path)
        engine.insert_data(new_ts)
        for m_attr, entity_uid, ts in new_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                assert np.array_equal(
                    np.array([x[1] for x in res]), ts.values.flatten()
                )

    def test_retention_keep_latest(self, sample_ts):
        engine = SQLEngine(
            self.db_path,
        )
        engine.insert_data(
            sample_ts.isel(time_idx=np.array([0])),
            retention=timedelta(milliseconds=1),
        )
        time.sleep(0.002)
        engine = SQLEngine(
            self.db_path,
        )
        engine.insert_data(
            sample_ts.isel(time_idx=np.array([1])),
            retention=timedelta(milliseconds=1),
        )
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                keept_record_timestamp = datetime.fromtimestamp(
                    res[0][0], timezone.utc
                )
                assert ts.time_index[-1] == keept_record_timestamp

    def test_retention_keep_all_for_long_retention(self, sample_ts):
        engine = SQLEngine(
            self.db_path,
        )
        engine.insert_data(
            sample_ts.isel(time_idx=np.array([0])),
            retention=timedelta(days=1),
        )
        engine.insert_data(sample_ts.isel(time_idx=np.array([1])))
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = (
                    conn.cursor()
                    .execute(
                        f"SELECT * FROM {engine._get_table_name(entity_uid, m_attr)}"
                    )
                    .fetchall()
                )
                assert len(res) == 2

    def test_create_column_with_integer_type_for_uint_timeseries(
        self, sample_ts
    ):
        sample_ts._metric_idx.values[0] = MetricAttributes(
            name="cpu", dtype=UInt()
        )
        sample_ts._metric_idx.values[1] = MetricAttributes(
            name="memory", dtype=UInt()
        )
        sample_ts._metric_idx.values[2] = MetricAttributes(
            name="network", dtype=UInt()
        )
        engine = SQLEngine(self.db_path)
        engine.insert_data(sample_ts)
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = conn.cursor().execute(
                    f"SELECT type FROM PRAGMA_TABLE_INFO('{engine._get_table_name(entity_uid, m_attr)}') "
                    "WHERE name = 'VALUE';"
                )
            assert res.fetchone()[0] == "INTEGER"

    def test_create_column_with_real_type_for_float_timeseries(
        self, sample_ts
    ):
        sample_ts._metric_idx.values[0] = MetricAttributes(
            name="cpu", dtype=Float()
        )
        sample_ts._metric_idx.values[1] = MetricAttributes(
            name="memory", dtype=Float()
        )
        sample_ts._metric_idx.values[2] = MetricAttributes(
            name="network", dtype=Float()
        )
        engine = SQLEngine(self.db_path)
        engine.insert_data(sample_ts)
        for m_attr, entity_uid, ts in sample_ts.iter_over_variates():
            with sqlite3.connect(self.db_path) as conn:
                res = conn.cursor().execute(
                    f"SELECT type FROM PRAGMA_TABLE_INFO('{engine._get_table_name(entity_uid, m_attr)}') "
                    "WHERE name = 'VALUE';"
                )
            assert res.fetchone()[0] == "REAL"
