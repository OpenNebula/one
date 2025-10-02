import importlib
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Union

import numpy as np
import pytest

from pyoneai.core import MetricAttributes, MetricType
from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.metric_types import Float, UInt
from pyoneai.core.time import Instant, Period
from pyoneai.core.tsnumpy.index import MetricIndex, TimeIndex
from pyoneai.core.tsnumpy.timeseries import Timeseries


# TODO: Remove once we define the __eq__ method for EntityUID
def assert_entities_equal(
    expected: Union[EntityUID, list], actual: np.ndarray
) -> None:
    """Assert that the actual entities match the expected ones.

    Parameters
    ----------
    expected : Union[EntityUID, list]
        Expected entity or list of entities
    actual : np.ndarray
        Array of actual entities from the timeseries
    """
    if isinstance(expected, EntityUID):
        expected = [expected]

    assert len(expected) == len(
        actual
    ), f"Number of entities mismatch: expected {len(expected)}, got {len(actual)}"

    for exp, act in zip(expected, actual):
        assert (
            exp.type == act.type
        ), f"Entity type mismatch: expected {exp.type}, got {act.type}"
        assert (
            exp.id == act.id
        ), f"Entity ID mismatch: expected {exp.id}, got {act.id}"


def assert_metrics_equal(
    expected: Union[str, list], actual: np.ndarray
) -> None:
    """Assert that the actual metrics match the expected ones.

    Parameters
    ----------
    expected : Union[str, list]
        Expected metric name or list of metric names
    actual : np.ndarray
        Array of actual metric names from the timeseries
    """
    if isinstance(expected, str):
        expected = [expected]

    assert len(expected) == len(
        actual
    ), f"Number of metrics mismatch: expected {len(expected)}, got {len(actual)}"

    assert all(
        exp == act for exp, act in zip(expected, actual)
    ), f"Metric names mismatch: expected {expected}, got {actual.tolist()}"


@pytest.fixture(scope="module")
def sample_timeseries():
    """Create a sample timeseries with test data.

    Returns
    -------
    Timeseries
        Sample timeseries with shape (2 hours, 3 metrics, 2 entities):

        Time t=0:
            Metrics     VM1  VM2
            cpu         1    2
            memory      3    4
            network     5    6

        Time t=1:
            Metrics     VM1  VM2
            cpu         7    8
            memory      9    10
            network     11   12
    """
    # Create time period (2 hours with hourly intervals)
    period = Period(
        slice("2024-01-01T00:00:00+00:00", "2024-01-01T01:00:00+00:00", "1h")
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

    return Timeseries(
        time_idx=period,
        metric_idx=metrics,
        entity_uid_idx=entities,
        data=data,
    )


@pytest.fixture(scope="function")
def univariate_sample_timeseries():
    time = Period(
        slice("2024-01-01T00:00:00+00:00", "2024-01-01T11:00:00+00:00", "30s")
    )
    yield Timeseries(
        time_idx=time,
        metric_idx=np.array([MetricAttributes(name="cpu")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=np.random.normal(80, 5, size=time.values.shape).reshape(-1, 1, 1),
    )


@pytest.fixture(scope="module")
def large_timeseries():
    """Create a larger timeseries for comprehensive slicing tests.

    Returns
    -------
    Timeseries
        Sample timeseries with shape (24 hours, 8 metrics, 5 entities):
        - Time: 24 hours of hourly data
        - Metrics: cpu, memory, disk_read, disk_write, net_rx, net_tx, iops, load
        - Entities: 5 virtual machines
    """
    reference_datetime = datetime(2024, 1, 1, hour=0, tzinfo=timezone.utc)
    dates = [
        reference_datetime + timedelta(hours=i) for i in range(24)
    ]  # 24 hours of data
    time_index = Period(np.array(dates))

    metric_index = np.array(
        [
            MetricAttributes(name="cpu"),
            MetricAttributes(name="memory"),
            MetricAttributes(name="disk_read"),
            MetricAttributes(name="disk_write"),
            MetricAttributes(name="net_rx"),
            MetricAttributes(name="net_tx"),
            MetricAttributes(name="iops"),
            MetricAttributes(name="load"),
        ]
    )

    entity_index = np.array(
        [
            EntityUID(EntityType.VIRTUAL_MACHINE, i)
            for i in range(1, 6)  # 5 VMs
        ]
    )

    # Random data: 24 hours x 8 metrics x 5 VMs
    # Using random seed for reproducibility
    np.random.seed(42)
    data = np.random.rand(24, 8, 5)
    return Timeseries(time_index, metric_index, entity_index, data)


@pytest.fixture(scope="module")
def trend_detection_timeseries():
    """Create timeseries with different trend patterns for testing."""
    # Time index
    time_points = 50
    time_idx = np.array(
        [
            datetime(2023, 1, 1, 0, 0, 0) + timedelta(hours=i)
            for i in range(time_points)
        ]
    )
    time_idx = TimeIndex(time_idx)

    # Constant timeseries (no trend)
    constant_data = np.ones((time_points, 1, 1)) * 5.0

    # Linear increasing trend
    linear_increasing = np.linspace(1, 10, time_points).reshape(
        time_points, 1, 1
    )

    # Linear decreasing trend
    linear_decreasing = np.linspace(10, 1, time_points).reshape(
        time_points, 1, 1
    )

    # Random data (no trend)
    np.random.seed(42)  # For reproducibility
    random_data = np.random.normal(5, 1, time_points).reshape(
        time_points, 1, 1
    )

    # Exponential trend
    exponential_trend = np.exp(np.linspace(0, 1, time_points)).reshape(
        time_points, 1, 1
    )

    # Create timeseries objects
    constant_ts = Timeseries(
        time_idx=time_idx,
        metric_idx=np.array([MetricAttributes(name="constant")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=constant_data,
    )

    increasing_ts = Timeseries(
        time_idx=time_idx,
        metric_idx=np.array([MetricAttributes(name="increasing")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=linear_increasing,
    )

    decreasing_ts = Timeseries(
        time_idx=time_idx,
        metric_idx=np.array([MetricAttributes(name="decreasing")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=linear_decreasing,
    )

    random_ts = Timeseries(
        time_idx=time_idx,
        metric_idx=np.array([MetricAttributes(name="random")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=random_data,
    )

    exponential_ts = Timeseries(
        time_idx=time_idx,
        metric_idx=np.array([MetricAttributes(name="exponential")]),
        entity_uid_idx=np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
        data=exponential_trend,
    )

    return {
        "constant": constant_ts,
        "increasing": increasing_ts,
        "decreasing": decreasing_ts,
        "random": random_ts,
        "exponential": exponential_ts,
    }


class TestTimeseries:
    """Comprehensive test suite for Timeseries class."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup common test variables."""
        self.reference_datetime = datetime(
            2024, 1, 1, hour=0, tzinfo=timezone.utc
        )
        self.test_period = Period(
            slice(
                self.reference_datetime,
                self.reference_datetime + timedelta(hours=1),
                "1h",
            )
        )
        self.test_instant = Instant(self.reference_datetime)
        self.test_entity = EntityUID(EntityType.VIRTUAL_MACHINE, 1)
        self.test_entities = [
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
            EntityUID(EntityType.VIRTUAL_MACHINE, 2),
        ]

    # Basic Operations Tests
    def test_properties(self, sample_timeseries):
        """Test basic properties of timeseries."""
        assert sample_timeseries.shape == (2, 3, 2)
        assert_metrics_equal(
            ["cpu", "memory", "network"], sample_timeseries.names
        )
        assert_entities_equal(
            [
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                EntityUID(EntityType.VIRTUAL_MACHINE, 2),
            ],
            sample_timeseries.entity_uids,
        )

    def test_single_metric_selection(self, sample_timeseries):
        """Test selecting a single metric from timeseries."""
        cpu_ts = sample_timeseries["cpu"]
        assert cpu_ts.shape == (2, 1, 2)
        assert_metrics_equal("cpu", cpu_ts._metric_idx.names)
        expected = np.array([[[1, 2]], [[7, 8]]])
        np.testing.assert_array_equal(cpu_ts.values, expected)

    def test_multiple_metrics_selection(self, sample_timeseries):
        """Test selecting multiple metrics from timeseries."""
        resources_ts = sample_timeseries[["cpu", "memory"]]
        assert resources_ts.shape == (2, 2, 2)
        assert_metrics_equal(["cpu", "memory"], resources_ts._metric_idx.names)
        expected = np.array([[[1, 2], [3, 4]], [[7, 8], [9, 10]]])
        np.testing.assert_array_equal(resources_ts.values, expected)

    # Single Dimension Slicing Tests
    def test_time_selection(self, large_timeseries):
        """Test time-based selection."""
        result = large_timeseries[self.test_period]
        assert result.shape[0] == 2  # Two time points
        assert result.shape[1:] == (8, 5)  # Same metrics and entities

    def test_metric_selection(self, large_timeseries):
        """Test metric-based selection."""
        result = large_timeseries["cpu"]
        assert result.shape == (24, 1, 5)  # 24 hours, 1 metric, 5 VMs
        assert_metrics_equal("cpu", result._metric_idx.names)

    def test_entity_selection(self, large_timeseries):
        """Test entity-based selection."""
        result = large_timeseries[self.test_entity]
        assert result.shape == (24, 8, 1)  # 24 hours, 8 metrics, 1 VM
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Two Dimension Slicing Tests
    def test_time_metric_selection(self, large_timeseries):
        """Test combined time and metric selection."""
        result = large_timeseries[self.test_period, ["cpu", "memory"]]
        assert result.shape == (2, 2, 5)  # 2 hours, 2 metrics, 5 VMs
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)

    def test_time_entity_selection(self, large_timeseries):
        """Test combined time and entity selection."""
        result = large_timeseries[self.test_period, self.test_entity]
        assert result.shape == (2, 8, 1)  # 2 hours, 8 metrics, 1 VM
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    def test_metric_entity_selection(self, large_timeseries):
        """Test combined metric and entity selection."""
        result = large_timeseries[["cpu", "memory"], self.test_entity]
        assert result.shape == (24, 2, 1)  # 24 hours, 2 metrics, 1 VM
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Three Dimension Slicing Tests
    def test_time_metric_entity_selection(self, large_timeseries):
        """Test selection on all three dimensions."""
        result = large_timeseries[
            self.test_period, ["cpu", "memory"], self.test_entity
        ]
        assert result.shape == (2, 2, 1)  # 2 hours, 2 metrics, 1 VM
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Mixed Selection Tests
    def test_instant_multiple_metrics(self, large_timeseries):
        """Test single time point with multiple metrics."""
        result = large_timeseries[self.test_instant, ["cpu", "memory"]]
        assert result.shape == (1, 2, 5)  # 1 hour, 2 metrics, 5 VMs
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)

    def test_period_single_metric(self, large_timeseries):
        """Test time period with single metric."""
        result = large_timeseries[self.test_period, "cpu"]
        assert result.shape == (2, 1, 5)  # 2 hours, 1 metric, 5 VMs
        assert_metrics_equal("cpu", result._metric_idx.names)

    def test_multiple_entities(self, large_timeseries):
        """Test selection of multiple entities."""
        result = large_timeseries[self.test_entities]
        assert result.shape == (24, 8, 2)  # 24 hours, 8 metrics, 2 VMs
        assert_entities_equal(self.test_entities, result._entity_idx.values)

    def test_different_dimension_order(self, large_timeseries):
        """Test different ordering of dimension selections."""
        result = large_timeseries[
            self.test_entity, ["cpu", "memory"], self.test_period
        ]
        assert result.shape == (2, 2, 1)  # 2 hours, 2 metrics, 1 VM
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Validation Tests
    def test_invalid_metric_selection(self, sample_timeseries):
        """Test selecting a non-existent metric raises KeyError."""
        with pytest.raises(KeyError, match="Metric 'nonexistent' not found"):
            _ = sample_timeseries["nonexistent"]

    def test_invalid_entity_selection(self, sample_timeseries):
        """Test selecting a non-existent entity raises KeyError."""
        invalid_entity = EntityUID(EntityType.VIRTUAL_MACHINE, 999)
        with pytest.raises(
            KeyError, match="Entity virtualmachine_999 not found"
        ):
            _ = sample_timeseries[invalid_entity]

    def test_non_monotonic_time_index(self):
        """Test that non-monotonic time values in Period are caught."""
        time_values = np.array(
            [
                "2024-01-01T02:00:00",
                "2024-01-01T00:00:00",
                "2024-01-01T01:00:00",
            ],
            dtype="datetime64[ns]",
        )

        period = Period(time_values)
        entities = np.array([self.test_entity])
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((3, 1, 1))

        with pytest.raises(
            ValueError,
            match="Time index must be strictly monotonic increasing",
        ):
            Timeseries(period, metrics, entities, data)

    def test_invalid_entity_type(self):
        """Test that non-EntityUID objects in entity index are caught."""
        period = Period(
            slice(
                "2024-01-01T00:00:00+00:00", "2024-01-01T01:00:00+00:00", "1h"
            )
        )

        entities = np.array(
            [
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                "invalid_entity",  # Wrong type
            ]
        )
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((2, 1, 2))

        with pytest.raises(
            ValueError,
            match="Entity index must be a numpy array of EntityUID.",
        ):
            Timeseries(period, metrics, entities, data)

    def test_data_shape_mismatch(self):
        """Test that data shape mismatches are caught."""
        period = Period(
            slice(
                "2024-01-01T00:00:00+00:00", "2024-01-01T01:00:00+00:00", "1h"
            )
        )

        entities = np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)])
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((3, 1, 1))

        with pytest.raises(
            ValueError, match="Dimension mismatch: got .* expected"
        ):
            Timeseries(period, metrics, entities, data)

    # Edge Cases Tests
    def test_single_element_lists(self, large_timeseries):
        """Test selections with single-element lists."""
        result = large_timeseries[
            self.test_period, ["cpu"], [self.test_entity]
        ]
        assert result.shape == (2, 1, 1)  # 2 hours, 1 metric, 1 VM
        assert_metrics_equal("cpu", result._metric_idx.names)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    def test_mixed_single_multiple_different_order(self, large_timeseries):
        """Test mixed single/multiple selections with different dimension order."""
        result = large_timeseries[self.test_entities, "cpu", self.test_instant]
        assert result.shape == (1, 1, 2)  # 1 hour, 1 metric, 2 VMs
        assert_metrics_equal("cpu", result._metric_idx.names)
        assert_entities_equal(self.test_entities, result._entity_idx.values)

    def test_multiple_selections_all_dimensions(self, large_timeseries):
        """Test multiple selections in all dimensions simultaneously."""
        result = large_timeseries[
            self.test_period,
            ["cpu", "memory"],
            self.test_entities,
        ]
        assert result.shape == (2, 2, 2)  # 2 hours, 2 metrics, 2 VMs
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.names)
        assert_entities_equal(self.test_entities, result._entity_idx.values)

    def test_invalid_dimension_order(self, large_timeseries):
        """Test that invalid dimension combinations raise appropriate errors."""
        with pytest.raises(TypeError, match="Unsupported key type"):
            _ = large_timeseries[
                "cpu", 123, self.test_entity
            ]  # Invalid time type

        with pytest.raises(TypeError, match="Unsupported key type"):
            _ = large_timeseries[
                {"invalid": "type"}
            ]  # Completely invalid type

    def test_out_of_bounds_time_selection(self, large_timeseries):
        """Test that out-of-bounds time selections raise appropriate errors."""
        # Future time selection
        future_instant = Instant(self.reference_datetime + timedelta(days=1))
        with pytest.raises(ValueError, match="Time selection out of bounds"):
            _ = large_timeseries[future_instant]

        # Future period
        future_period = Period(
            slice(
                self.reference_datetime + timedelta(days=1),
                self.reference_datetime + timedelta(days=2),
                "1h",
            )
        )
        with pytest.raises(ValueError, match="Time selection out of bounds"):
            _ = large_timeseries[future_period]

        # Past period
        past_period = Period(
            slice(
                self.reference_datetime - timedelta(days=1),
                self.reference_datetime - timedelta(hours=1),
                "1h",
            )
        )
        with pytest.raises(ValueError, match="Time selection out of bounds"):
            _ = large_timeseries[past_period]

        # Period partially out of bounds (future)
        partially_future_period = Period(
            slice(
                self.reference_datetime,
                self.reference_datetime + timedelta(days=2),
                "1h",
            )
        )
        with pytest.raises(ValueError, match="Time selection out of bounds"):
            _ = large_timeseries[partially_future_period]

        # Period partially out of bounds (past)
        partially_past_period = Period(
            slice(
                self.reference_datetime - timedelta(days=1),
                self.reference_datetime + timedelta(hours=1),
                "1h",
            )
        )
        with pytest.raises(ValueError, match="Time selection out of bounds"):
            _ = large_timeseries[partially_past_period]

    # Duplicate Handling Tests
    def test_duplicate_time_values(self):
        """Test that duplicate timestamps are caught during initialization."""
        time_values = np.array(
            [
                datetime(2024, 1, 1, hour=0, tzinfo=timezone.utc),
                datetime(2024, 1, 1, hour=0, tzinfo=timezone.utc),  # Duplicate
                datetime(2024, 1, 1, hour=1, tzinfo=timezone.utc),
            ]
        )
        period = Period(time_values)
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((3, 1, 1))
        entities = np.array([self.test_entity])

        with pytest.raises(
            ValueError, match="Time index contains duplicate timestamps"
        ):
            Timeseries(period, metrics, entities, data)

    def test_duplicate_entities(self):
        """Test that duplicate entities are caught during initialization."""
        entities = np.array(
            [
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),  # Same type and ID
            ]
        )
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((2, 1, 2))

        with pytest.raises(ValueError, match="Duplicate entities not allowed"):
            Timeseries(self.test_period, metrics, entities, data)

    def test_entities_with_same_id_different_types(self):
        """Test that entities with same ID but different types are allowed."""
        entities = np.array(
            [
                EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                EntityUID(EntityType.HOST, 1),  # Same ID but different type
            ]
        )
        metrics = np.array([MetricAttributes(name="cpu")])
        data = np.zeros((2, 1, 2))

        ts = Timeseries(self.test_period, metrics, entities, data)
        assert ts.shape == (2, 1, 2)

    # Metric Handling Tests
    def test_metric_case_sensitivity(self):
        """Test case-sensitive behavior of metric names."""
        # Test initialization with case-sensitive metrics
        metrics = np.array(
            [
                MetricAttributes(name="CPU"),
                MetricAttributes(name="cpu"),
                MetricAttributes(name="Memory"),
            ]
        )
        data = np.zeros((2, 3, 1))
        entities = np.array([self.test_entity])

        ts = Timeseries(self.test_period, metrics, entities, data)
        assert ts.shape == (2, 3, 1)

        # Test individual metric selection
        cpu_lower = ts["cpu"]
        assert_metrics_equal("cpu", cpu_lower._metric_idx.names)

        cpu_upper = ts["CPU"]
        assert_metrics_equal("CPU", cpu_upper._metric_idx.names)

        # Test multiple metric selection
        multi_ts = ts[["CPU", "Memory"]]
        assert_metrics_equal(["CPU", "Memory"], multi_ts._metric_idx.names)

    def test_metric_validation(self):
        """Test comprehensive metric validation including duplicates, empty lists, and invalid names."""
        metrics = np.array(
            [MetricAttributes(name="cpu"), MetricAttributes(name="memory")]
        )
        data = np.zeros((2, 2, 1))
        entities = np.array([self.test_entity])

        ts = Timeseries(self.test_period, metrics, entities, data)

        # Test duplicate metrics in initialization
        with pytest.raises(
            ValueError, match="Duplicate metric names not allowed"
        ):
            Timeseries(
                self.test_period,
                np.array(
                    [
                        MetricAttributes(name="cpu"),
                        MetricAttributes(name="memory"),
                        MetricAttributes(name="cpu"),
                    ]
                ),
                entities,
                np.zeros((2, 3, 1)),
            )

        # Test duplicate metrics in selection
        with pytest.raises(
            ValueError, match="Duplicate metric names not allowed"
        ):
            _ = ts[["cpu", "memory", "cpu"]]

        # Test empty selection list
        with pytest.raises(ValueError, match="Empty selection list"):
            _ = ts[[]]

        # Test non-existent metrics
        with pytest.raises(KeyError, match=r"Metric 'CPU' not found"):
            _ = ts["CPU"]  # Wrong case

        with pytest.raises(KeyError, match=r"Metric 'network' not found"):
            _ = ts["network"]  # Non-existent metric

        # Test invalid metric names
        with pytest.raises(KeyError, match=r"Metric 'cpu%' not found"):
            _ = ts["cpu%"]  # Special characters

        with pytest.raises(KeyError, match=r"Metric 'cpu usage' not found"):
            _ = ts["cpu usage"]  # Whitespace

        # Test mixed valid/invalid selections
        with pytest.raises(KeyError, match=r"Metric 'disk' not found"):
            _ = ts[["cpu", "disk"]]  # One valid, one invalid

    # NumPy Interface Tests
    def test_array_conversion(self, sample_timeseries):
        """Test conversion to NumPy array."""
        # Test basic conversion
        array = np.asarray(sample_timeseries)
        assert isinstance(array, np.ndarray)
        assert array.shape == sample_timeseries.shape
        np.testing.assert_array_equal(array, sample_timeseries.values)

        # Test with dtype conversion
        float_array = np.asarray(sample_timeseries, dtype=np.float64)
        assert float_array.dtype == np.float64
        np.testing.assert_array_equal(
            float_array, sample_timeseries.values.astype(np.float64)
        )

    def test_array_ufunc(self, sample_timeseries):
        """Test NumPy universal functions with Timeseries objects."""
        # Test unary ufuncs
        sin_ts = np.sin(sample_timeseries)
        assert isinstance(sin_ts, Timeseries)
        assert sin_ts.shape == sample_timeseries.shape
        np.testing.assert_array_almost_equal(
            sin_ts.values, np.sin(sample_timeseries.values)
        )

        # Test binary ufuncs with scalar
        add_ts = np.add(sample_timeseries, 5)
        assert isinstance(add_ts, Timeseries)
        assert add_ts.shape == sample_timeseries.shape
        np.testing.assert_array_equal(
            add_ts.values, sample_timeseries.values + 5
        )

        # Test binary ufuncs with another Timeseries
        cpu_ts = sample_timeseries["cpu"]
        memory_ts = sample_timeseries["memory"]
        add_ts = np.add(cpu_ts, memory_ts)
        assert isinstance(add_ts, Timeseries)
        assert add_ts.shape == cpu_ts.shape
        np.testing.assert_array_equal(
            add_ts.values, cpu_ts.values + memory_ts.values
        )

    def test_array_function(self, sample_timeseries):
        """Test NumPy functions with Timeseries objects."""
        # Test reduction functions without axis
        mean_all = np.mean(sample_timeseries)
        assert isinstance(mean_all, (float, np.number))
        assert np.isclose(mean_all, np.mean(sample_timeseries.values))

        # Test reduction along time axis (axis=0)
        mean_time = np.mean(sample_timeseries, axis=0)
        assert isinstance(mean_time, Timeseries)
        assert mean_time.shape[0] == 1  # Reduced time dimension
        np.testing.assert_array_almost_equal(
            mean_time.values.reshape(3, 2),
            np.mean(sample_timeseries.values, axis=0),
        )

        # Test reduction along metric axis (axis=1)
        mean_metrics = np.mean(sample_timeseries, axis=1)
        assert isinstance(mean_metrics, Timeseries)
        assert mean_metrics.shape[1] == 1  # Reduced metric dimension
        np.testing.assert_array_almost_equal(
            mean_metrics.values.reshape(2, 2),
            np.mean(sample_timeseries.values, axis=1),
        )

        # Test reduction along entity axis (axis=2)
        mean_entities = np.mean(sample_timeseries, axis=2)
        assert isinstance(mean_entities, Timeseries)
        assert mean_entities.shape[2] == 1  # Reduced entity dimension
        np.testing.assert_array_almost_equal(
            mean_entities.values.reshape(2, 3),
            np.mean(sample_timeseries.values, axis=2),
        )

        # Test other reduction functions
        min_ts = np.min(sample_timeseries, axis=0)
        assert isinstance(min_ts, Timeseries)
        np.testing.assert_array_almost_equal(
            min_ts.values.reshape(3, 2),
            np.min(sample_timeseries.values, axis=0),
        )

        max_ts = np.max(sample_timeseries, axis=1)
        assert isinstance(max_ts, Timeseries)
        np.testing.assert_array_almost_equal(
            max_ts.values.reshape(2, 2),
            np.max(sample_timeseries.values, axis=1),
        )

        sum_ts = np.sum(sample_timeseries, axis=2)
        assert isinstance(sum_ts, Timeseries)
        np.testing.assert_array_almost_equal(
            sum_ts.values.reshape(2, 3),
            np.sum(sample_timeseries.values, axis=2),
        )

    def test_statistical_methods(self, sample_timeseries):
        """Test direct statistical methods on Timeseries objects."""
        # Test min method
        # Overall minimum
        min_all = sample_timeseries.min()
        assert isinstance(min_all, (float, np.number))
        assert min_all == 1.0  # The minimum value in the sample data

        # Min along time axis
        min_time = sample_timeseries.min(axis=0)
        assert isinstance(min_time, Timeseries)
        assert min_time.shape == (1, 3, 2)
        np.testing.assert_array_equal(
            min_time.values[0], np.array([[1, 2], [3, 4], [5, 6]])
        )

        # Min along metric axis
        min_metrics = sample_timeseries.min(axis=1)
        assert isinstance(min_metrics, Timeseries)
        assert min_metrics.shape == (2, 1, 2)
        np.testing.assert_array_equal(
            min_metrics.values[:, 0, :], np.array([[1, 2], [7, 8]])
        )

        # Min along entity axis
        min_entities = sample_timeseries.min(axis=2)
        assert isinstance(min_entities, Timeseries)
        assert min_entities.shape == (2, 3, 1)
        np.testing.assert_array_equal(
            min_entities.values[:, :, 0], np.array([[1, 3, 5], [7, 9, 11]])
        )

        # Test max method
        # Overall maximum
        max_all = sample_timeseries.max()
        assert isinstance(max_all, (float, np.number))
        assert max_all == 12.0  # The maximum value in the sample data

        # Max along time axis
        max_time = sample_timeseries.max(axis=0)
        assert isinstance(max_time, Timeseries)
        assert max_time.shape == (1, 3, 2)
        np.testing.assert_array_equal(
            max_time.values[0], np.array([[7, 8], [9, 10], [11, 12]])
        )

        # Test mean method
        # Overall mean
        mean_all = sample_timeseries.mean()
        assert isinstance(mean_all, (float, np.number))
        assert np.isclose(
            mean_all, 6.5
        )  # The mean of all values in the sample data

        # Mean along time axis
        mean_time = sample_timeseries.mean(axis=0)
        assert isinstance(mean_time, Timeseries)
        assert mean_time.shape == (1, 3, 2)
        np.testing.assert_array_equal(
            mean_time.values[0], np.array([[4, 5], [6, 7], [8, 9]])
        )

        # Test sum method
        # Overall sum
        sum_all = sample_timeseries.sum()
        assert isinstance(sum_all, (float, np.number))
        assert sum_all == 78.0  # The sum of all values in the sample data

        # Sum along entity axis
        sum_entities = sample_timeseries.sum(axis=2)
        assert isinstance(sum_entities, Timeseries)
        assert sum_entities.shape == (2, 3, 1)
        np.testing.assert_array_equal(
            sum_entities.values[:, :, 0], np.array([[3, 7, 11], [15, 19, 23]])
        )

        # Test std method
        # Overall standard deviation
        std_all = sample_timeseries.std()
        assert isinstance(std_all, (float, np.number))
        assert np.isclose(
            std_all, 3.60555
        )  # The sample standard deviation of all values in the sample data

        # Std along metric axis
        std_metrics = sample_timeseries.std(axis=1)
        assert isinstance(std_metrics, Timeseries)
        assert std_metrics.shape == (2, 1, 2)
        expected_std = np.array([[2, 2], [2, 2]])
        np.testing.assert_array_almost_equal(
            std_metrics.values[:, 0, :], expected_std
        )

        # Test with keepdims=True
        min_time_keepdims = sample_timeseries.min(axis=0, keepdims=True)
        assert isinstance(min_time_keepdims, Timeseries)
        assert min_time_keepdims.shape == (1, 3, 2)
        np.testing.assert_array_equal(
            min_time_keepdims.values, min_time.values
        )

        # Test median method
        median_all = sample_timeseries.median()
        assert isinstance(median_all, (float, np.number))
        assert np.isclose(median_all, 6.5)

        # Test median with named axis
        median_time = sample_timeseries.median(axis="time")
        median_time_numeric = sample_timeseries.median(axis=0)
        np.testing.assert_array_equal(
            median_time.values, median_time_numeric.values
        )

        # Test variance method
        var_all = sample_timeseries.var()
        assert isinstance(var_all, (float, np.number))
        assert np.isclose(var_all, 13.0)

        # Test variance with named axis and ddof parameter
        var_metric = sample_timeseries.var(axis="metric", ddof=0)
        var_metric_numeric = sample_timeseries.var(axis=1, ddof=0)
        np.testing.assert_array_equal(
            var_metric.values, var_metric_numeric.values
        )

        # Test quantile method
        median_quantile = sample_timeseries.quantile(0.5)
        assert isinstance(median_quantile, (float, np.number))
        assert np.isclose(median_quantile, 6.5)

        # Test quantile with named axis
        q1_entity = sample_timeseries.quantile(0.25, axis="entity")
        q1_entity_numeric = sample_timeseries.quantile(0.25, axis=2)
        np.testing.assert_array_equal(
            q1_entity.values, q1_entity_numeric.values
        )

        # Test single quantile with named axis
        q50_time = sample_timeseries.quantile(0.5, axis="time")
        assert q50_time.shape == (
            1,
            3,
            2,
        )  # 1 time point (median), 3 metrics, 2 entities

    def test_subset_statistical_methods(self, sample_timeseries):
        """Test statistical methods on subsets of metrics and entities."""
        # Test on subset of metrics (similar to pandas df[['a', 'b']].max())
        cpu_memory_subset = sample_timeseries[["cpu", "memory"]]

        # Max on subset
        max_subset = cpu_memory_subset.max()
        assert isinstance(max_subset, (float, np.number))
        assert max_subset == 10.0  # Max value in cpu and memory metrics

        # Min on subset
        min_subset = cpu_memory_subset.min()
        assert isinstance(min_subset, (float, np.number))
        assert min_subset == 1.0  # Min value in cpu and memory metrics

        # Mean on subset
        mean_subset = cpu_memory_subset.mean()
        assert isinstance(mean_subset, (float, np.number))
        assert np.isclose(mean_subset, 5.5)  # Mean of cpu and memory values

        # Test on subset of metrics with axis reduction
        mean_subset_time = cpu_memory_subset.mean(axis=0)
        assert isinstance(mean_subset_time, Timeseries)
        assert mean_subset_time.shape[0] == 1  # Reduced time dimension
        assert mean_subset_time.shape[1] == 2  # Two metrics (cpu, memory)
        assert mean_subset_time.shape[2] == 2  # Two entities
        np.testing.assert_array_equal(
            mean_subset_time.values[0], np.array([[4, 5], [6, 7]])
        )

        # Test on subset of entities
        entity_subset = sample_timeseries[
            EntityUID(EntityType.VIRTUAL_MACHINE, 1)
        ]

        # Max on entity subset
        max_entity = entity_subset.max()
        assert isinstance(max_entity, (float, np.number))
        assert max_entity == 11.0  # Max value for VM1

        # Test on subset of both metrics and entities
        combined_subset = sample_timeseries[
            ["cpu", "memory"], EntityUID(EntityType.VIRTUAL_MACHINE, 1)
        ]

        # Sum on combined subset
        sum_combined = combined_subset.sum()
        assert isinstance(sum_combined, (float, np.number))
        assert sum_combined == 20.0  # Sum of cpu and memory for VM1
        # Mean on combined subset with axis
        mean_combined_metrics = combined_subset.mean(axis=1)
        assert isinstance(mean_combined_metrics, Timeseries)
        assert mean_combined_metrics.shape == (
            2,
            1,
            1,
        )  # 2 time points, 1 metric, 1 entity
        np.testing.assert_array_equal(
            mean_combined_metrics.values[:, 0, 0], np.array([2, 8])
        )

    def test_named_axis_functionality(self, sample_timeseries):
        """Test that named axes work correctly with statistical methods and NumPy functions."""
        from pyoneai.core.tsnumpy.timeseries import Axis

        # Test min with different axis specifications
        min_time_numeric = sample_timeseries.min(axis=Axis.TIME)
        min_time_named = sample_timeseries.min(axis="time")
        np.testing.assert_array_equal(
            min_time_numeric.values, min_time_named.values
        )

        min_metric_numeric = sample_timeseries.min(axis=Axis.METRIC)
        min_metric_named = sample_timeseries.min(axis="metric")
        np.testing.assert_array_equal(
            min_metric_numeric.values, min_metric_named.values
        )

        min_entity_numeric = sample_timeseries.min(axis=Axis.ENTITY)
        min_entity_named = sample_timeseries.min(axis="entity")
        np.testing.assert_array_equal(
            min_entity_numeric.values, min_entity_named.values
        )

        # Test with case insensitivity
        min_time_uppercase = sample_timeseries.min(axis="TIME")
        np.testing.assert_array_equal(
            min_time_numeric.values, min_time_uppercase.values
        )

        # Test with multiple axes using names
        min_time_metric_numeric = sample_timeseries.min(
            axis=(Axis.TIME, Axis.METRIC)
        )
        min_time_metric_named = sample_timeseries.min(axis=["time", "metric"])
        np.testing.assert_array_equal(
            min_time_metric_numeric.values, min_time_metric_named.values
        )

        # Test mixed numeric and named axes
        min_mixed = sample_timeseries.min(axis=["time", Axis.ENTITY])
        min_both_numeric = sample_timeseries.min(axis=(Axis.TIME, Axis.ENTITY))
        np.testing.assert_array_equal(
            min_mixed.values, min_both_numeric.values
        )

        # Test NumPy functions with named axes
        np_mean_time_numeric = np.mean(sample_timeseries, axis=Axis.TIME)
        np_mean_time_named = np.mean(sample_timeseries, axis="time")
        np.testing.assert_array_equal(
            np_mean_time_numeric.values, np_mean_time_named.values
        )

        # Test with invalid axis name
        with pytest.raises(ValueError, match="Invalid axis name"):
            sample_timeseries.min(axis="invalid_axis")

        # Test immutability of Axis enum
        with pytest.raises(AttributeError):
            Axis.TIME = 5

    def test_equal_timeindex(self, sample_timeseries):
        period = Period(
            slice(
                "2024-01-01T00:00:00+00:00", "2024-01-01T01:00:00+00:00", "1h"
            )
        )
        ts = Timeseries(
            time_idx=period,
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, -1)]
            ),
            data=np.array([[[10.0]], [[20.0]]]),
        )

        assert sample_timeseries._time_idx == ts._time_idx

        period_not_equal = Period(
            slice(
                "2024-01-01T00:00:00+00:00", "2024-01-01T02:00:00+00:00", "1h"
            )
        )
        ts_not_equal = Timeseries(
            time_idx=period_not_equal,
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, -1)]
            ),
            data=np.array([[[10.0]], [[20.0]], [[30.0]]]),
        )
        assert sample_timeseries._time_idx != ts_not_equal._time_idx

    def test_monotonic_increasing(self):
        index = TimeIndex(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ],
                dtype="datetime64[ns]",
            )
        )
        assert index.is_monotonic_increasing

    def test_is_monotonic_increasing_when_single_element(self):
        index = TimeIndex(
            np.array(["2024-01-01T00:00:00"], dtype="datetime64[ns]")
        )
        assert index.is_monotonic_increasing

    def test_is_monotonic_decreasing_when_single_element(self):
        index = TimeIndex(
            np.array(["2024-01-01T00:00:00"], dtype="datetime64[ns]")
        )
        assert index.is_monotonic_decreasing

    def test_non_monotonic_increasing(self):
        with pytest.raises(
            ValueError,
            match=r"Time index must be strictly monotonic increasing",
        ):
            _ = TimeIndex(
                np.array(
                    [
                        "2024-01-01T00:00:00",
                        "2024-01-01T02:00:00",
                        "2024-01-01T01:00:00",
                    ],
                    dtype="datetime64[ns]",
                )
            )

    @pytest.fixture
    def predicted_timeseries(self, sample_timeseries):
        """Create a predicted timeseries that is 2.0 higher than the sample timeseries."""
        return Timeseries(
            time_idx=sample_timeseries._time_idx.values,
            metric_idx=sample_timeseries._metric_idx.values,
            entity_uid_idx=sample_timeseries._entity_idx.values,
            data=sample_timeseries._data + 2.0,
        )

    def test_mae(self, sample_timeseries, predicted_timeseries):
        """Test mae with known inputs and expected outputs."""

        error = Timeseries.mae(predicted_timeseries, sample_timeseries)

        np.testing.assert_allclose(error, 2.0)

        predicted_ts = Timeseries(
            time_idx=Period(
                slice("2024-01-01T02:00:00", "2024-01-01T03:00:00", "1h")
            ),
            metric_idx=sample_timeseries._metric_idx.values,
            entity_uid_idx=sample_timeseries._entity_idx.values,
            data=sample_timeseries._data + 2.0,
        )
        with pytest.raises(
            ValueError,
            match="Cannot compute error between timeseries with different time indices",
        ):
            Timeseries.mae(predicted_ts, sample_timeseries)

    def test_mse(self, sample_timeseries, predicted_timeseries):
        """Test mse with known inputs and expected outputs."""
        error = Timeseries.mse(predicted_timeseries, sample_timeseries)
        np.testing.assert_allclose(error, 4.0)

    def test_mape(self, sample_timeseries, predicted_timeseries):
        """Test mape with known inputs and expected outputs."""
        error = Timeseries.mape(predicted_timeseries, sample_timeseries)
        np.testing.assert_allclose(error, 51.72018)

    def test_mape_with_zero_values(self):
        """Test MAPE calculation with zero values in the actual data."""

        time_idx = Period(
            slice("2023-01-01T00:00:00", "2023-01-01T02:00:00", "1h")
        )
        metric_idx = np.array([MetricAttributes(name="metric1")])
        entity_uid_idx = np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)])

        actual_data = np.array([[[10.0]], [[0.0]], [[5.0]]])
        actual_ts = Timeseries(
            time_idx, metric_idx, entity_uid_idx, actual_data
        )

        pred_data = np.array([[[12.0]], [[1.0]], [[4.0]]])
        pred_ts = Timeseries(time_idx, metric_idx, entity_uid_idx, pred_data)

        error = Timeseries.mape(pred_ts, actual_ts)
        error_custom = Timeseries.mape(pred_ts, actual_ts, epsilon=0.1)

        assert np.isfinite(error)
        assert np.isfinite(error_custom)

        # Verify that with larger epsilon, the error decreases
        assert error > error_custom

    def test_rmse(self, sample_timeseries, predicted_timeseries):
        """Test rmse with known inputs and expected outputs."""
        error = Timeseries.rmse(predicted_timeseries, sample_timeseries)
        np.testing.assert_allclose(error, 2.0)

    def test_merge_timeseries_by_metric(self):
        ts_1 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="cpu_usage")]),
            np.array(
                [
                    EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                    EntityUID(EntityType.VIRTUAL_MACHINE, 2),
                ]
            ),
            data=np.ones((3, 1, 2)),
        )
        ts_2 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="mem_usage")]),
            np.array(
                [
                    EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                    EntityUID(EntityType.VIRTUAL_MACHINE, 2),
                ]
            ),
            data=np.full((3, 1, 2), 2),
        )
        merged = Timeseries.merge(ts_1, ts_2)

        assert np.all(merged["mem_usage"]._data == 2)
        assert np.all(merged["cpu_usage"]._data == 1)
        assert merged.shape == (3, 2, 2)

    def test_merge_timeseries_by_metric_single_entity(self):
        ts_1 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="cpu_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
            data=np.ones((3, 1, 1)),
        )
        ts_2 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="mem_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
            data=np.full((3, 1, 1), 2),
        )
        merged = Timeseries.merge(ts_1, ts_2)
        assert np.all(merged["mem_usage"]._data == 2)
        assert np.all(merged["cpu_usage"]._data == 1)
        assert merged.shape == (3, 2, 1)

    def test_merge_timeseries_by_entity_single_entity(self):
        ts_1 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="cpu_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
            data=np.ones((3, 1, 1)),
        )
        ts_2 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="cpu_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 2)]),
            data=np.full((3, 1, 1), 2),
        )
        merged = Timeseries.merge(ts_1, ts_2)
        assert np.all(
            merged[EntityUID(EntityType.VIRTUAL_MACHINE, 2)]._data == 2.0
        )

    def test_merge_timeseries_if_unaligned(self):
        ts_1 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="cpu_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 1)]),
            data=np.ones((3, 1, 1)),
        )
        ts_2 = Timeseries(
            np.array(
                [
                    "2024-01-01T00:00:00",
                    "2024-01-01T01:00:00",
                    "2024-01-01T02:00:00",
                ]
            ),
            np.array([MetricAttributes(name="mem_usage")]),
            np.array([EntityUID(EntityType.VIRTUAL_MACHINE, 2)]),
            data=np.full((3, 1, 1), 2),
        )
        merged = Timeseries.merge(ts_1, ts_2)
        assert np.all(
            np.isnan(
                merged[
                    ("cpu_usage", EntityUID(EntityType.VIRTUAL_MACHINE, 2))
                ]._data
            )
        )
        assert np.all(
            np.isnan(
                merged[
                    ("mem_usage", EntityUID(EntityType.VIRTUAL_MACHINE, 1))
                ]._data
            )
        )

    def test_iter_over_variates_single_metric_single_entity(
        self, sample_timeseries
    ):
        ts = sample_timeseries[
            ("cpu", EntityUID(EntityType.VIRTUAL_MACHINE, 1))
        ]
        variates = list(ts.iter_over_variates())
        assert len(variates) == 1

    def test_iter_over_variates_multiple_metric_multiple_entity(
        self, sample_timeseries
    ):
        variates = list(sample_timeseries.iter_over_variates())
        assert len(variates) == 3 * 2

    def test_iter_over_variates_returns_correct_tuple(self, sample_timeseries):
        variates = list(sample_timeseries.iter_over_variates())
        for v in variates:
            assert isinstance(v, tuple)
            assert len(v) == 3
            assert isinstance(v[0], MetricAttributes)
            assert isinstance(v[1], EntityUID)
            assert isinstance(v[2], Timeseries)

    def test_fit_line_univariate_return_tuple_of_ndarray(
        self, sample_timeseries
    ):
        ts = sample_timeseries["cpu", EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
        trend = Timeseries.fit_line(ts)
        assert isinstance(trend, list) and isinstance(trend[0], np.poly1d)

        ts = sample_timeseries["cpu"]
        trend = Timeseries.fit_line(ts)
        assert isinstance(trend, list)
        for poly in trend:
            assert isinstance(poly, np.poly1d) and isinstance(
                trend[0], np.poly1d
            )

    def test_fit_line_return_tuple_of_correct_length(self, sample_timeseries):
        trend = sample_timeseries.fit_line()
        assert len(trend) == 6

    def test_fit_poly_return_correct_number_of_parameters(
        self, sample_timeseries
    ):
        trend = sample_timeseries.fit_poly(deg=6)
        for poly in trend:
            assert len(poly.c) == 7

    def test_has_trend_mann_kendall(self, trend_detection_timeseries):
        """Test the has_trend method with Mann-Kendall test."""
        # Test constant timeseries (no trend)
        assert not trend_detection_timeseries["constant"].has_trend

        # Test increasing timeseries (positive trend)
        assert trend_detection_timeseries["increasing"].has_trend

        # Test decreasing timeseries (negative trend)
        assert trend_detection_timeseries["decreasing"].has_trend

        # Test random data (should not have a trend)
        assert not trend_detection_timeseries["random"].has_trend

    def test_has_trend_multivariate(self):
        """Test the has_trend method with multivariate timeseries."""
        # Create a multivariate timeseries with one series having a trend and one without
        time_points = 50
        time_idx = np.array(
            [
                datetime(2023, 1, 1, 0, 0, 0) + timedelta(hours=i)
                for i in range(time_points)
            ]
        )
        time_idx = TimeIndex(time_idx)

        # Create data with two metrics
        data = np.zeros((time_points, 2, 1))
        data[:, 0, 0] = np.linspace(1, 10, time_points)  # Increasing trend
        data[:, 1, 0] = np.ones(time_points) * 5.0  # Constant (no trend)

        multivariate_ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [
                    MetricAttributes(name="increasing"),
                    MetricAttributes(name="constant"),
                ]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

        # The multivariate timeseries should have a trend because at least one of its
        # univariate components has a trend
        assert multivariate_ts.has_trend

    def test_compute_seasonality_returns_callable(
        self, sample_timeseries: Timeseries
    ):
        assert callable(sample_timeseries.compute_seasonality())

    def test_compute_seasonality_func_returns_timeseries(self):
        time_points = 50
        time_vals = np.array(
            [
                datetime(2023, 1, 1, 0, 0, 0) + timedelta(hours=i)
                for i in range(time_points)
            ]
        )
        time_idx = TimeIndex(time_vals)

        # Create data with two metrics
        data = np.zeros((time_points, 1, 1))
        data[:, 0, 0] = np.sin(np.linspace(1, 4 * np.pi, time_points))

        univariate_ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array([MetricAttributes(name="metric_name_1")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        seasonality = univariate_ts.compute_seasonality()
        res = seasonality(TimeIndex([time_vals[2]]))
        assert isinstance(res, Timeseries)

    def test_compute_seasonality_func_compute_multiple_values(self):
        time_points = 50
        time_vals = np.array(
            [
                datetime(2023, 1, 1, 0, 0, 0) + timedelta(hours=i)
                for i in range(time_points)
            ]
        )
        time_idx = TimeIndex(time_vals)

        data = np.zeros((time_points, 1, 1))
        data[:, 0, 0] = np.sin(np.linspace(1, 4 * np.pi, time_points))

        univariate_ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array([MetricAttributes(name="metric_name_1")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        seasonality = univariate_ts.compute_seasonality()
        query_time_idx = np.array(
            [time_vals[-1] + timedelta(hours=i) for i in range(time_points)]
        )
        res = seasonality(TimeIndex(query_time_idx))
        assert res.shape == (len(query_time_idx), 1, 1)

    def test_compute_seasonality_func_compute_multiple_values_multivariate(
        self,
    ):
        time_points = 50
        time_vals = np.array(
            [
                datetime(2023, 1, 1, 0, 0, 0) + timedelta(hours=i)
                for i in range(time_points)
            ]
        )
        time_idx = TimeIndex(time_vals)

        data = np.zeros((time_points, 2, 1))
        data[:, 0, 0] = np.sin(np.linspace(1, 4 * np.pi, time_points))
        data[:, 1, 0] = np.cos(np.linspace(1, 4 * np.pi, time_points))

        univariate_ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [
                    MetricAttributes(name="metric_name_1"),
                    MetricAttributes(name="metric_name_2"),
                ]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        seasonality = univariate_ts.compute_seasonality()
        query_time_idx = np.array(
            [time_vals[-1] + timedelta(hours=i) for i in range(time_points)]
        )
        res = seasonality(TimeIndex(query_time_idx))
        assert res.shape == (len(query_time_idx), 2, 1)

    def test_compute_seasonality_not_compute_trend(
        self, sample_timeseries: Timeseries, mocker
    ):
        ts = sample_timeseries[
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
            MetricAttributes(name="cpu"),
        ]
        trend_func = ts.compute_trend()
        compute_trend_mock = mocker.patch(
            "pyoneai.core.tsnumpy.Timeseries.compute_trend",
            wraps=ts.compute_trend,
        )
        ts.compute_seasonality(trend_func)
        compute_trend_mock.assert_not_called()

    def test_compute_seasonality_compute_trend_if_not_passed(
        self, sample_timeseries: Timeseries, mocker
    ):
        ts = sample_timeseries[
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
            MetricAttributes(name="cpu"),
        ]
        compute_trend_mock = mocker.patch(
            "pyoneai.core.tsnumpy.Timeseries.compute_trend",
            wraps=ts.compute_trend,
        )
        ts.compute_seasonality()
        compute_trend_mock.assert_called_once()

    def test_trend_method(self, trend_detection_timeseries):
        """Test that trend method correctly identifies best trend function and returns a proper transformer."""
        ts_increasing = trend_detection_timeseries["increasing"]

        trend_transformer = ts_increasing.compute_trend()
        assert callable(trend_transformer)

        # Test the transformer with different time specifications
        # Test with Period
        period = TimeIndex(
            Period(
                slice(
                    "2024-01-01T00:00:00+00:00",
                    "2024-01-10T00:00:00+00:00",
                    "1d",
                )
            ).values
        )
        period_trend = trend_transformer(
            period, ts_increasing._time_idx.origin
        )
        assert isinstance(period_trend, Timeseries)
        assert len(period_trend) == len(period)

        # Test with Instant
        instant = TimeIndex(Instant("2024-01-01T00:00:00+00:00").values)
        instant_trend = trend_transformer(
            instant, ts_increasing._time_idx.origin
        )
        assert isinstance(instant_trend, Timeseries)
        assert len(instant_trend) == 1

        # Test with TimeIndex
        time_idx = TimeIndex(
            np.array(
                [
                    "2024-01-01T00:00:00+00:00",
                    "2024-01-02T00:00:00+00:00",
                    "2024-01-03T00:00:00+00:00",
                ]
            )
        )
        timeindex_trend = trend_transformer(
            time_idx, ts_increasing._time_idx.origin
        )
        assert isinstance(timeindex_trend, Timeseries)
        assert len(timeindex_trend) == len(time_idx)

        # Test with numpy array of datetimes
        dates = TimeIndex(
            np.array(
                [
                    datetime(2024, 1, 1),
                    datetime(2024, 1, 2),
                    datetime(2024, 1, 3),
                ]
            )
        )
        numpy_trend = trend_transformer(dates, ts_increasing._time_idx.origin)
        assert isinstance(numpy_trend, Timeseries)
        assert len(numpy_trend) == len(dates)

        # Test with single datetime
        single_date = TimeIndex(np.array([datetime(2024, 1, 1)]))
        datetime_trend = trend_transformer(
            single_date, ts_increasing._time_idx.origin
        )
        assert isinstance(datetime_trend, Timeseries)
        assert len(datetime_trend) == 1

        # Test argument method as string
        trend_transformer_poly1 = ts_increasing.compute_trend(methods="poly1")
        trend_ts_poly1 = trend_transformer_poly1(
            time_idx, ts_increasing._time_idx.origin
        )
        assert isinstance(trend_ts_poly1, Timeseries)
        assert len(trend_ts_poly1) == len(time_idx)

        # Test error cases
        with pytest.raises(ValueError):
            # Test with too short timeseries
            short_ts = Timeseries(
                time_idx=ts_increasing.time_index[:1],
                metric_idx=ts_increasing.metrics,
                entity_uid_idx=ts_increasing.entity_uids,
                data=ts_increasing.values[:1],
            )
            short_ts.compute_trend()

        with pytest.raises(ValueError):
            # Test with invalid method
            ts_increasing.compute_trend(methods=["invalid_method"])

    def test_trend_constant(self, trend_detection_timeseries):
        ts_constant = trend_detection_timeseries["constant"]
        trend_transformer = ts_constant.compute_trend()
        assert callable(trend_transformer)
        trend_ts_constant = trend_transformer(
            ts_constant._time_idx, ts_constant._time_idx.origin
        )
        assert isinstance(trend_ts_constant, Timeseries)
        assert len(trend_ts_constant) == len(ts_constant)
        # If the TS is constant than there is no trend and the method returns the original TS filled with 0s
        assert np.all(trend_ts_constant.values == 0)

    @pytest.mark.skip(
        reason="With RANSAC based trend detection, the "
        "quadratic trend line is found"
    )
    def test_trend_exponential(self, trend_detection_timeseries):
        # Get a timeseries with exponential
        ts_exponential = trend_detection_timeseries["exponential"]
        trend_transformer = ts_exponential.compute_trend()
        assert callable(trend_transformer)

        # Generate the timeseries whose values have been transformed by the trend transformer using the best method for the trend
        trend_ts_exponential = trend_transformer(
            ts_exponential._time_idx, ts_exponential._time_idx.origin
        )
        assert isinstance(trend_ts_exponential, Timeseries)
        assert len(trend_ts_exponential) == len(ts_exponential)

        time_idx = TimeIndex(ts_exponential.time_index)
        trend_transformer_poly1 = ts_exponential.compute_trend(
            methods=["poly1"]
        )
        trend_ts_exponential_poly1 = trend_transformer_poly1(
            time_idx, ts_exponential._time_idx.origin
        )

        trend_transformer_poly2 = ts_exponential.compute_trend(
            methods=["poly2"]
        )
        trend_ts_exponential_poly2 = trend_transformer_poly2(
            time_idx, ts_exponential._time_idx.origin
        )

        mape_exp = Timeseries.mape(trend_ts_exponential, ts_exponential)
        mape_poly1 = Timeseries.mape(
            trend_ts_exponential_poly1, ts_exponential
        )
        mape_poly2 = Timeseries.mape(
            trend_ts_exponential_poly2, ts_exponential
        )
        assert mape_exp < mape_poly1 and mape_exp < mape_poly2

    def test_trend_linear(self, trend_detection_timeseries):
        ts_linear = trend_detection_timeseries["increasing"]
        trend_transformer = ts_linear.compute_trend()
        assert callable(trend_transformer)

        time_idx = TimeIndex(ts_linear.time_index)
        trend_ts_linear = trend_transformer(time_idx, time_idx.origin)
        assert isinstance(trend_ts_linear, Timeseries)
        assert len(trend_ts_linear) == len(ts_linear)
        assert np.all(trend_ts_linear.values != 0)

        trend_transformer_poly1 = ts_linear.compute_trend(methods=["poly1"])
        trend_ts_linear_poly1 = trend_transformer_poly1(
            time_idx, time_idx.origin
        )

        trend_transformer_poly2 = ts_linear.compute_trend(methods=["poly2"])
        trend_ts_linear_poly2 = trend_transformer_poly2(
            time_idx, time_idx.origin
        )

        trend_transformer_exp = ts_linear.compute_trend(methods=["exp"])
        trend_ts_linear_exp = trend_transformer_exp(time_idx, time_idx.origin)

        mape_linear = Timeseries.mape(trend_ts_linear, ts_linear)
        mape_poly1 = Timeseries.mape(trend_ts_linear_poly1, ts_linear)
        mape_poly2 = Timeseries.mape(trend_ts_linear_poly2, ts_linear)
        mape_exp = Timeseries.mape(trend_ts_linear_exp, ts_linear)
        assert (
            min(mape_linear, mape_poly1, mape_poly2, mape_exp) == mape_linear
        )

    def test_detrend(self, trend_detection_timeseries):
        """Test that the _detrend method correctly removes trends from timeseries."""
        ts_increasing = trend_detection_timeseries["increasing"]
        assert ts_increasing.has_trend

        detrended_ts = ts_increasing._detrend()
        assert isinstance(detrended_ts, Timeseries)
        assert len(detrended_ts) == len(ts_increasing)
        assert not detrended_ts.has_trend

        ts_exponential = trend_detection_timeseries["exponential"]
        assert ts_exponential.has_trend
        detrended_exponential = ts_exponential._detrend()
        assert isinstance(detrended_exponential, Timeseries)
        assert len(detrended_exponential) == len(ts_exponential)
        assert not detrended_exponential.has_trend

        ts_constant = trend_detection_timeseries["constant"]
        assert not ts_constant.has_trend

        detrended_constant = ts_constant._detrend()
        assert not detrended_constant.has_trend

        # For a constant timeseries, the detrended values should be the same as the original values
        # because the trend is zero
        np.testing.assert_allclose(
            detrended_constant.values, ts_constant.values, atol=1e-10
        )

    def test_select_by_metric_attributes(self, sample_timeseries):
        ts = sample_timeseries[MetricAttributes(name="cpu")]
        assert np.all(ts.names == "cpu")

    def test_fail_select_if_key_has_extra_attributes(self, sample_timeseries):
        with pytest.raises(
            KeyError,
            match=r"Metric MetricAttributes\(name=cpu, type=MetricType.GAUGE*",
        ):
            _ = sample_timeseries[
                MetricAttributes(name="cpu", type=MetricType.GAUGE)
            ]

    def test_clip_produces_new_timeseries(self):
        data = np.array([[[-15], [-12]], [[20], [0]]])
        m_attr_1 = MetricAttributes(name="cpu_usage")
        m_attr_2 = MetricAttributes(name="memory_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T00:00:00", "2025-01-02T00:00:00", "1d")
            ),
            metric_idx=np.array([m_attr_1, m_attr_2]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        assert ts is not ts.clip()

    def test_clip_lower_and_upper(self):
        data = np.array([[[-15], [4]], [[20], [30]]])
        m_attr_1 = MetricAttributes(name="cpu_usage", dtype=UInt(0, 1))
        m_attr_2 = MetricAttributes(name="memory_usage", dtype=UInt(5, 10))

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T00:00:00", "2025-01-02T00:00:00", "1d")
            ),
            metric_idx=np.array([m_attr_1, m_attr_2]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        clipped = ts.clip()
        assert np.array_equal(
            clipped[m_attr_1]._data.squeeze(), np.array([0, 1])
        )
        assert np.array_equal(
            clipped[m_attr_2]._data.squeeze(), np.array([5, 10])
        )

    def test_clip_if_one_inf(self):
        data = np.array([[[-15], [-12]], [[20], [0]]])
        m_attr_1 = MetricAttributes(name="cpu_usage", dtype=Float(-np.inf, 1))
        m_attr_2 = MetricAttributes(
            name="memory_usage", dtype=Float(-10, float("inf"))
        )

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T00:00:00", "2025-01-02T00:00:00", "1d")
            ),
            metric_idx=np.array([m_attr_1, m_attr_2]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        clipped = ts.clip()
        assert np.array_equal(
            clipped[m_attr_1]._data.squeeze(), np.array([-15, 1])
        )
        assert np.array_equal(
            clipped[m_attr_2]._data.squeeze(), np.array([-10, 0])
        )

    def test_clip_override_limits(self):
        data = np.array([[[-15], [-12]], [[20], [10]]])
        m_attr_1 = MetricAttributes(name="cpu_usage", dtype=Float(-np.inf, 1))
        m_attr_2 = MetricAttributes(name="memory_usage", dtype=Float(-10))

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T00:00:00", "2025-01-02T00:00:00", "1d")
            ),
            metric_idx=np.array([m_attr_1, m_attr_2]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        clipped = ts.clip(-1, 1)
        assert np.array_equal(
            clipped[m_attr_1]._data.squeeze(), np.array([-1, 1])
        )
        assert np.array_equal(
            clipped[m_attr_2]._data.squeeze(), np.array([-1, 1])
        )

    def test_clip_zero_bounds_float_metrics(self):
        """Test to verify that the zero is used as a lower or upper bound for float metrics."""
        data = np.array([[[-15], [-20]], [[200], [200]]])
        m_attr_1 = MetricAttributes(
            name="cpu_usage",
            type=MetricType.COUNTER,
            dtype=Float(0, 100),
            operator="rate",
        )
        m_attr_2 = MetricAttributes(
            name="memory_usage",
            type=MetricType.COUNTER,
            dtype=Float(-5, 0),
            operator="rate",
        )

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T00:00:00", "2025-01-02T00:00:00", "1d")
            ),
            metric_idx=np.array([m_attr_1, m_attr_2]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        clipped = ts.clip()
        assert np.array_equal(
            clipped[m_attr_1]._data.squeeze(), np.array([0, 100])
        )
        assert np.array_equal(
            clipped[m_attr_2]._data.squeeze(), np.array([-5, 0])
        )

    def test_interpolate_returns_timeseries(self, sample_timeseries):
        query_tidx = TimeIndex(
            np.array(
                [
                    datetime(2025, 1, 1, 0),
                ]
            )
        )
        assert isinstance(
            sample_timeseries.interpolate(query_tidx), Timeseries
        )

    def test_interpolate_returns_correct_timeindex(self, sample_timeseries):
        query_tidx = TimeIndex(
            np.array(
                [
                    datetime(2025, 1, 1, 0),
                    datetime(2025, 1, 1, 8),
                    datetime(2025, 1, 1, 16),
                ]
            )
        )
        assert (
            sample_timeseries.interpolate(query_tidx)._time_idx == query_tidx
        )

    def test_interpolate_for_same_time_index(self, sample_timeseries):
        new_ts = sample_timeseries.interpolate(sample_timeseries._time_idx)
        for m_attr, entity_uid, ts in sample_timeseries.iter_over_variates():
            assert np.array_equal(ts._data, new_ts[(m_attr, entity_uid)]._data)

    def test_interpolate_by_nearest(self, sample_timeseries):
        query_tidx = TimeIndex(
            np.array(
                [
                    sample_timeseries.time_index[-1],
                    sample_timeseries.time_index[-1] + timedelta(hours=8),
                    sample_timeseries.time_index[-1] + timedelta(hours=16),
                ]
            )
        )
        target_vals = sample_timeseries[
            Instant(sample_timeseries.time_index[-1])
        ].values.squeeze()
        new_ts = sample_timeseries.interpolate(
            query_tidx, "nearest"
        ).values.squeeze()
        assert np.all(new_ts == target_vals)

    def test_resample_correct_length_with_not_complete_periods(self):
        data = np.array([[[1]], [[2]], [[3]], [[4]], [[5]]])
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T12:00:00", "2025-01-03T12:00:00", "12h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        new_ts = ts.resample("1d", "max")
        assert new_ts.shape == (3, 1, 1)

    def test_resample_correct_aggregation(self):
        data = np.array([[[1]], [[2]], [[3]], [[4]], [[5]]])
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T12:00:00", "2025-01-03T12:00:00", "12h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        new_ts = ts.resample("1d", "sum")
        assert np.array_equal(new_ts._data.squeeze(), np.array([1, 5, 9]))

    def test_resample_neglect_time_remainder(self):
        data = np.array(
            [[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]
        )
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T09:15:00", "2025-01-01T16:26:00", "1h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        new_ts = ts.resample("3h", "sum")
        assert np.array_equal(
            new_ts.time_index,
            np.array(
                [
                    datetime(2025, 1, 1, 9, 15, tzinfo=timezone.utc),
                    datetime(2025, 1, 1, 12, 15, tzinfo=timezone.utc),
                    datetime(2025, 1, 1, 15, 15, tzinfo=timezone.utc),
                ]
            ),
        )

    def test_resample_with_timedelta_freq(self):
        data = np.array(
            [[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]
        )
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T09:15:00", "2025-01-01T16:26:00", "1h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        new_ts = ts.resample(timedelta(hours=3), "sum")
        assert np.array_equal(
            new_ts.time_index,
            np.array(
                [
                    datetime(2025, 1, 1, 9, 15, tzinfo=timezone.utc),
                    datetime(2025, 1, 1, 12, 15, tzinfo=timezone.utc),
                    datetime(2025, 1, 1, 15, 15, tzinfo=timezone.utc),
                ]
            ),
        )

    def test_resample_with_negative_timedelta(self):
        data = np.array(
            [[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]
        )
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T09:15:00", "2025-01-01T16:26:00", "1h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        with pytest.raises(
            ValueError, match=r"`freq` argument cannot be negative timedelta"
        ):
            _ = ts.resample(timedelta(hours=-3), "sum")

    def test_resample_raise_on_finer_freq(self):
        data = np.array(
            [[[1]], [[2]], [[3]], [[4]], [[5]], [[6]], [[7]], [[8]], [[9]]]
        )
        m_attr_1 = MetricAttributes(name="cpu_usage")

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T09:15:00", "2025-01-01T16:26:00", "1h")
            ),
            metric_idx=np.array([m_attr_1]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )
        with pytest.raises(
            ValueError, match=r"Timeseries can only be resampled to coarser*"
        ):
            new_ts = ts.resample("1m")

    def test_resample_with_multiple_metrics_and_one_day_period(self):
        data = np.array(
            [
                [[1, 10], [100, 1000]],
                [[2, 20], [200, 2000]],
                [[3, 30], [300, 3000]],
                [[4, 40], [400, 4000]],
            ]
        )

        ts = Timeseries(
            time_idx=Period(
                slice("2025-01-01T06:00:00", "2025-01-01T18:00:00", "4h")
            ),
            metric_idx=np.array(
                [
                    MetricAttributes(name="cpu_usage"),
                    MetricAttributes(name="memory_usage"),
                ]
            ),
            entity_uid_idx=np.array(
                [
                    EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                    EntityUID(EntityType.VIRTUAL_MACHINE, 2),
                ]
            ),
            data=data,
        )

        new_ts = ts.resample("1d", "sum")

        assert new_ts.shape == (1, 2, 2)
        assert new_ts.time_index[0] == datetime(
            2025, 1, 1, 6, 0, tzinfo=timezone.utc
        )

        expected = np.array([[[10, 100], [1000, 10000]]])

        assert np.array_equal(new_ts._data, expected)

    def test_rate_with_time_normalization(self, sample_timeseries):
        """Test rate calculation normalizes by time correctly."""

        rate_ts = sample_timeseries.rate()

        # 6 (difference between consecutive values) / 3600 seconds
        expected = np.array(
            [
                [
                    [0.001667, 0.001667],
                    [0.001667, 0.001667],
                    [0.001667, 0.001667],
                ]
            ]
        )
        np.testing.assert_array_almost_equal(rate_ts.values, expected)

    def test_rate_multimetric_selection(self, sample_timeseries):
        """Test rate calculation works with multiple selected metrics."""
        rate_ts = sample_timeseries.rate(["cpu", "network"])

        # Validate structure (time points, 2 metrics, entities)
        assert rate_ts.shape == (1, 2, 2)
        assert_metrics_equal(["cpu", "network"], rate_ts.names)

        expected = np.array(
            [
                [
                    [0.001667, 0.001667],
                    [0.001667, 0.001667],
                ]
            ]
        )
        np.testing.assert_array_almost_equal(rate_ts.values, expected)

    def test_rate_with_nan_values(self):
        """Test rate calculation with NaN values."""
        times = np.array(
            [
                datetime(2024, 1, 1, i, 0, 0, tzinfo=timezone.utc)
                for i in range(4)
            ]
        )

        data = np.array(
            [
                # t0
                [[10.0, 20.0], [30.0, np.nan]],
                # t1
                [[15.0, np.nan], [35.0, 60.0]],
                # t2
                [[20.0, 30.0], [np.nan, 70.0]],
                # t3
                [[25.0, 40.0], [45.0, 80.0]],
            ]
        )

        ts = Timeseries(
            time_idx=times,
            metric_idx=np.array(
                [
                    MetricAttributes(name="metric1"),
                    MetricAttributes(name="metric2"),
                ]
            ),
            entity_uid_idx=np.array(
                [
                    EntityUID(EntityType.VIRTUAL_MACHINE, 1),
                    EntityUID(EntityType.VIRTUAL_MACHINE, 2),
                ]
            ),
            data=data,
        )

        rate_ts = ts.rate()

        # Create expected rates (hourly change / 3600 seconds)
        # Each consecutive value changes by 5 units per hour (rate = 5/3600)
        expected = np.array(
            [
                # t0→t1 rates
                [[0.00138889, np.nan], [0.00138889, np.nan]],
                # t1→t2 rates
                [[0.00138889, np.nan], [np.nan, 0.00277778]],
                # t2→t3 rates
                [[0.00138889, 0.00277778], [np.nan, 0.00277778]],
            ]
        )

        # Test NaN values are in the same positions
        np.testing.assert_array_equal(
            np.isnan(rate_ts.values), np.isnan(expected)
        )

        # Test non-NaN values match expected with almost_equal for floating point comparison
        valid_mask = ~np.isnan(expected)
        np.testing.assert_array_almost_equal(
            rate_ts.values[valid_mask], expected[valid_mask]
        )

        # Test time index is correct
        assert len(rate_ts.time_index) == 3
        np.testing.assert_array_equal(rate_ts.time_index, times[1:])

    def test_rate_insufficient_data(self):
        """Test rate calculation with insufficient data points."""
        # Create a timeseries with only one time point
        single_time_ts = Timeseries(
            time_idx=np.array(["2024-01-01T00:00:00"]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.array([[[1.0]]]),
        )

        with pytest.raises(
            ValueError,
            match="Cannot calculate rate with fewer than 2 time points",
        ):
            single_time_ts.rate()

    def test_hampel_filter(self):
        """Test Hampel filter."""

        time_idx = np.arange(
            "2025-01-01T00", "2025-01-01T05", dtype="datetime64[h]"
        )
        n = time_idx.size
        metrics = [
            MetricAttributes(name="cpu"),
            MetricAttributes(name="memory"),
        ]
        entities = [
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
            EntityUID(EntityType.VIRTUAL_MACHINE, 2),
        ]
        data = np.empty(
            shape=(n, len(metrics), len(entities)), dtype=np.float64
        )
        vals = np.arange(n)
        data[:, 0, 0] = vals.copy()
        data[1, 0, 0] = 2000.0
        data[:, 0, 1] = 2 + 8 * vals
        data[2, 0, 1] = 1000.0
        data[:, 1, 0] = np.sin(vals)
        data[0, 1, 0] = 15.0
        data[:, 1, 1] = np.cos(vals)
        data[-1, 1, 1] = 25.0
        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(metrics),
            entity_uid_idx=np.array(entities),
            data=data.copy(),
        )

        result = ts.hampel_filter(inplace=False)
        assert np.allclose(ts._data, data)
        assert isinstance(result, Timeseries)
        assert result._data[1, 0, 0] == 2.5
        assert result._data[2, 0, 1] == 26.0
        assert round(result._data[0, 1, 0], 4) == 0.9093
        assert round(result._data[-1, 1, 1], 4) == -0.4161

        ts.hampel_filter(window_size=5, threshold=5)
        assert ts._data[1, 0, 0] == 2.5
        assert ts._data[2, 0, 1] == 26.0
        assert round(ts._data[0, 1, 0], 4) == 0.9093
        assert round(ts._data[-1, 1, 1], 4) == -0.4161

    def test_fill_gap(self):
        """Test gap filling."""

        # Regular timeseries.
        time_idx = np.arange(
            "2025-01-01T00", "2025-01-01T05", dtype="datetime64[h]"
        )
        n_t = time_idx.size
        metrics = [
            MetricAttributes(name="cpu_seconds", type=MetricType.COUNTER),
            MetricAttributes(name="memory", type=MetricType.GAUGE),
        ]
        n_m = len(metrics)
        entities = [
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
            EntityUID(EntityType.VIRTUAL_MACHINE, 2),
            EntityUID(EntityType.VIRTUAL_MACHINE, 3),
        ]
        n_e = len(entities)
        size = n_t * n_m * n_e
        vals = np.arange(size, dtype=np.float64).reshape(n_t, n_m, n_e)
        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(metrics),
            entity_uid_idx=np.array(entities),
            data=vals.copy(),
        )

        # Regular timeseries without missing values.
        result = ts.fill_gaps(frequency=3600)
        assert result is ts
        assert np.allclose(result._data, vals)

        # Regular timeseries with missing values.
        ts._data[0, 0, 1] = np.nan
        ts._data[2, 0, 1] = np.nan
        ts._data[-1, 1, 2] = np.nan
        ts._data[-1, 0, 2] = np.nan

        result = ts.fill_gaps(frequency=3600)
        assert result is not ts
        assert result._data[0, 0, 1] == 7
        assert result._data[2, 0, 1] == 7
        assert result._data[-1, 1, 2] == 0
        assert result._data[-1, 0, 2] == 20

        # Irregular timeseries.
        time_idx = np.array(
            [
                "2025-01-01T00:20",
                "2025-01-01T01:20",
                "2025-01-01T02:20",
                # Interuption.
                "2025-01-01T04:59",
                "2025-01-01T05:59",
                # Interuption.
                "2025-01-01T10:00",
                "2025-01-01T11:00",
            ],
            dtype="datetime64[s]",
        )
        n_t = time_idx.size
        size = n_t * n_m * n_e
        vals = np.arange(size, dtype=np.float64).reshape(n_t, n_m, n_e)
        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(metrics),
            entity_uid_idx=np.array(entities),
            data=vals.copy(),
        )

        result = ts.fill_gaps(frequency=3600, direction="forward")
        assert np.allclose(
            result._data[:, 0, 0],
            np.array([0, 6, 12, 12, 18, 24, 24, 24, 24, 30, 36]),
        )
        assert np.allclose(
            result._data[:, 1, 1],
            np.array([4, 10, 16, 0, 22, 28, 0, 0, 0, 34, 40]),
        )

        result = ts.fill_gaps(frequency=3600, direction="backward")
        assert np.allclose(
            result._data[:, 0, 0],
            np.array([0, 6, 12, 12, 12, 18, 24, 24, 24, 24, 30, 36]),
        )
        assert np.allclose(
            result._data[:, 1, 1],
            np.array([4, 10, 16, 0, 0, 22, 28, 0, 0, 0, 34, 40]),
        )

    def test_restore_same_values_as_saved_to_db(
        self, tmp_path, sample_timeseries
    ):
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        sample_timeseries.write_to_db(db_path)

        time = Period(
            slice(
                datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc),
                datetime(2024, 1, 1, 1, 0, tzinfo=timezone.utc),
                timedelta(hours=1),
            )
        )

        for m_attrs, entity_uid, _ in sample_timeseries.iter_over_variates():
            res = Timeseries.read_from_database(
                path=db_path,
                metric_attrs=m_attrs,
                entity_uid=entity_uid,
                time=time,
            )
            assert np.array_equal(
                res.values.squeeze(),
                sample_timeseries[m_attrs, entity_uid].values.squeeze(),
            )
            assert np.array_equal(
                res.time_index,
                sample_timeseries[m_attrs, entity_uid].time_index,
            )

        conn.close()

    def test_spearman_fail_on_length_mismatch(self):
        ts1 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )
        ts2 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 6)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 5).reshape(-1, 1, 1)
        )        
        with pytest.raises(
            ValueError,
            match=r"Timeseries must have the same length for Spearman's rank correlation",
        ):
            ts1.spearman(ts2)
            
    def test_write_to_db_with_suffix(self, tmp_path, sample_timeseries):
        """Test writing to DB with default and custom suffixes."""
        db_path = tmp_path / "test_suffix.db"
        custom_suffix = "custom_test"

        # 1. Write with custom suffix
        sample_timeseries.write_to_db(db_path, suffix=custom_suffix)

        # 2. Write again with default suffix to the same DB
        sample_timeseries.write_to_db(db_path)  # Uses default 'monitoring'

        # 3. Connect and verify table names
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = {row[0] for row in cursor.fetchall()}
        conn.close()

        # 4. Assert table names exist for both suffixes
        expected_tables = set()
        default_suffix = "monitoring"
        for m_attr, entity_uid, _ in sample_timeseries.iter_over_variates():
            table_name_custom = f"{entity_uid}_{m_attr.name}_{custom_suffix}"
            table_name_default = f"{entity_uid}_{m_attr.name}_{default_suffix}"
            expected_tables.add(table_name_custom)
            expected_tables.add(table_name_default)

        # Check if all expected tables are present in the actual tables set
        assert expected_tables.issubset(
            tables
        ), f"Missing tables. Expected subset: {expected_tables}, Found: {tables}"

    def test_spearman_fail_on_date_mismatch(self):
        ts1 = Timeseries(
            time_idx=np.array([datetime(2024, 2, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )
        ts2 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )        
        with pytest.raises(
            ValueError,
            match=r"Timeseries must have the same time index for Spearman's rank correlatio",
        ):
            ts1.spearman(ts2)        

    def test_spearman_perfect_positive_correlation(self):
        ts1 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )
        ts2 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )        
        assert np.allclose(ts1.spearman(ts2), 1.0)

    def test_spearman_perfect_negative_correlation(self):
        ts1 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )
        ts2 = Timeseries(
            time_idx=np.array([datetime(2024, 1, 1, i) for i in range(1, 11)]),
            metric_idx=np.array([MetricAttributes(name="cpu")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=-np.linspace(0, 10, 10).reshape(-1, 1, 1)
        )        
        assert np.allclose(ts1.spearman(ts2), -1.0)

    def test_autocorrelate_fail_on_negative_lag(self, sample_timeseries):
        with pytest.raises(
            ValueError,
            match=r"Lag must be greater than 0",
        ):
            sample_timeseries.autocorrelate(-1)

    def test_autocorrelate_fail_on_lag_greater_than_length(
        self, sample_timeseries
    ):
        lag = len(sample_timeseries) + 1
        with pytest.raises(
            ValueError,
            match=f"Lag {lag} is greater than the length",
        ):
            sample_timeseries.autocorrelate(lag)

    def test_autocorrelate_fail_on_lag_equal_to_length(
        self, sample_timeseries
    ):
        lag = len(sample_timeseries) + 1
        with pytest.raises(
            ValueError,
            match=f"Lag {lag} is greater than the length",
        ):
            sample_timeseries.autocorrelate(lag)

    def test_autocorrelate_returns_single_element_tuple(
        self, large_timeseries
    ):
        large_timeseries = large_timeseries[
            "cpu", EntityUID(EntityType.VIRTUAL_MACHINE, 1)
        ]
        lag = 1
        result = large_timeseries.autocorrelate(lag)
        assert isinstance(result, tuple)
        assert len(result) == 1
        assert isinstance(result[0], float)

    def test_autocorrelate_returns_tuple_for_all_variates(
        self, large_timeseries
    ):
        lag = 1
        result = large_timeseries.autocorrelate(lag)
        assert isinstance(result, tuple)
        assert len(result) == len(large_timeseries.metrics) * len(large_timeseries._entity_idx)

class TestMetricIndex:

    def test_get_metric_names(self):
        metric_idx = MetricIndex(
            np.array(
                [
                    MetricAttributes(name="cpu_usage", type=MetricType.GAUGE),
                    MetricAttributes(
                        name="memory_usage", type=MetricType.GAUGE
                    ),
                ]
            )
        )
        assert np.all(
            metric_idx.names == np.array(["cpu_usage", "memory_usage"])
        )

    def test_fail_on_duplicated_name(self):
        with pytest.raises(
            ValueError, match=r"Duplicate metric names not allowed*"
        ):
            _ = MetricIndex(
                np.array(
                    [
                        MetricAttributes(
                            name="cpu_usage", type=MetricType.GAUGE
                        ),
                        MetricAttributes(
                            name="cpu_usage", type=MetricType.GAUGE
                        ),
                    ]
                )
            )


class TestCleaning:

    @pytest.fixture(scope="module")
    def time_idx(self):
        """Time index for test timeseries."""
        return np.array(
            [
                "2024-01-01T00:00:00",
                "2024-01-01T01:00:00",
                "2024-01-01T02:00:00",
                "2024-01-01T03:00:00",
                "2024-01-01T04:00:00",
            ]
        )

    @pytest.fixture(scope="module")
    def nan_and_reset_ts(self, time_idx):
        """Timeseries with NaN value and reset."""

        data = np.zeros((5, 1, 1))
        data[:, 0, 0] = [10, np.nan, 30, 5, 15]

        return Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [MetricAttributes(name="packets", type=MetricType.COUNTER)]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

    @pytest.fixture(scope="module")
    def multivariate_ts(self, time_idx):
        """Multivariate timeseries with different monotonicity patterns."""
        data = np.zeros((5, 2, 1))

        # First metric: monotonic
        data[:, 0, 0] = [10, 20, 30, 40, 50]

        # Second metric: non-monotonic
        data[:, 1, 0] = [100, 200, 50, 100, 150]

        return Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [
                    MetricAttributes(
                        name="monotonic_metric", type=MetricType.COUNTER
                    ),
                    MetricAttributes(
                        name="non_monotonic_metric", type=MetricType.COUNTER
                    ),
                ]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

    @pytest.fixture(scope="module")
    def all_monotonic_ts(self, time_idx):
        """Multivariate timeseries with all metrics monotonic."""

        data = np.zeros((5, 2, 1))

        # First metric: monotonic
        data[:, 0, 0] = [10, 20, 30, 40, 50]

        # Second metric: also monotonic
        data[:, 1, 0] = [5, 10, 15, 20, 25]

        return Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [
                    MetricAttributes(name="metric1", type=MetricType.COUNTER),
                    MetricAttributes(name="metric2", type=MetricType.COUNTER),
                ]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

    @pytest.fixture(scope="module")
    def all_non_monotonic_ts(self, time_idx):
        """Multivariate timeseries with all metrics non-monotonic."""

        data = np.zeros((5, 2, 1))

        # First metric: non-monotonic
        data[:, 0, 0] = [10, 20, 5, 15, 25]

        # Second metric: also non-monotonic
        data[:, 1, 0] = [100, 200, 50, 150, 75]

        return Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [
                    MetricAttributes(name="metric1", type=MetricType.COUNTER),
                    MetricAttributes(name="metric2", type=MetricType.COUNTER),
                ]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

    def test_restore_counter_with_nan(self, nan_and_reset_ts):
        """Test restore_counter with NaN value and reset."""

        assert not nan_and_reset_ts.is_monotonic_increasing

        restored = nan_and_reset_ts.restore_counter()

        expected = np.array([10, np.nan, 30, 35, 45]).reshape(-1, 1, 1)

        np.testing.assert_array_equal(restored.values, expected)
        assert not restored.is_monotonic_increasing

    def test_is_monotonic_multivariate(
        self, multivariate_ts, all_monotonic_ts, all_non_monotonic_ts
    ):
        """Test is_monotonic_increasing with multivariate timeseries."""
        assert not multivariate_ts.is_monotonic_increasing

        assert all_monotonic_ts.is_monotonic_increasing

        assert not all_non_monotonic_ts.is_monotonic_increasing

    def test_restore_counter_single_reset(self):
        """Test restore_counter with a single reset in the data."""
        time_idx = np.array(
            [
                "2024-01-01T00:00:00",
                "2024-01-01T01:00:00",
                "2024-01-01T02:00:00",
                "2024-01-01T03:00:00",
                "2024-01-01T04:00:00",
            ]
        )
        data = np.array([10, 20, 30, 5, 15]).reshape(-1, 1, 1)

        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [MetricAttributes(name="packets", type=MetricType.COUNTER)]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

        assert not ts.is_monotonic_increasing

        restored = ts.restore_counter()
        expected = np.array([10, 20, 30, 35, 45]).reshape(-1, 1, 1)
        np.testing.assert_array_equal(restored.values, expected)

        assert restored.is_monotonic_increasing

    def test_restore_counter_multiple_resets(self):
        """Test restore_counter with multiple resets in the data."""
        time_idx = np.array(
            [
                "2024-01-01T00:00:00",
                "2024-01-01T01:00:00",
                "2024-01-01T02:00:00",
                "2024-01-01T03:00:00",
                "2024-01-01T04:00:00",
                "2024-01-01T05:00:00",
            ]
        )

        data = np.array([10, 20, 5, 15, 3, 8]).reshape(-1, 1, 1)

        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [MetricAttributes(name="packets", type=MetricType.COUNTER)]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

        assert not ts.is_monotonic_increasing

        restored = ts.restore_counter()
        # After first reset at t=2, add 20 to all subsequent values
        # After second reset at t=4, add 15 to all subsequent values
        expected = np.array([10, 20, 25, 35, 38, 43]).reshape(-1, 1, 1)
        np.testing.assert_array_equal(restored.values, expected)

        assert restored.is_monotonic_increasing

    def test_restore_counter_consecutive_resets(self):
        """Test restore_counter with consecutive resets in the data."""
        time_idx = np.array(
            [
                "2024-01-01T00:00:00",
                "2024-01-01T01:00:00",
                "2024-01-01T02:00:00",
                "2024-01-01T03:00:00",
                "2024-01-01T04:00:00",
            ]
        )
        # Consecutive resets at t=2 (20->5) and t=3 (5->2)
        data = np.array([10, 20, 5, 2, 10]).reshape(-1, 1, 1)

        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array(
                [MetricAttributes(name="packets", type=MetricType.COUNTER)]
            ),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=data,
        )

        assert not ts.is_monotonic_increasing

        restored = ts.restore_counter()
        # After first reset at t=2, add 20 to all subsequent values: [10, 20, 25, 22, 30]
        # After second reset at t=3, add 25 to all subsequent values: [10, 20, 25, 27, 35]
        expected = np.array([10, 20, 25, 27, 35]).reshape(-1, 1, 1)
        np.testing.assert_array_equal(restored.values, expected)

        assert restored.is_monotonic_increasing

    def test_restore_counter_multivariate(self, multivariate_ts):
        """Test restore_counter with multivariate timeseries."""

        restored = multivariate_ts.restore_counter()

        expected = np.zeros((5, 2, 1))
        expected[:, 0, 0] = [10, 20, 30, 40, 50]
        expected[:, 1, 0] = [100, 200, 250, 300, 350]

        np.testing.assert_array_equal(restored.values, expected)

        assert restored.is_monotonic_increasing


@pytest.mark.skipif(
    not importlib.util.find_spec("scipy"), reason="scipy not installed"
)
class TestRegression:

    def test_regress_returns_callable(self, univariate_sample_timeseries):
        regression = univariate_sample_timeseries.regress(
            univariate_sample_timeseries
        )
        assert callable(regression)

    def test_fail_on_wrong_type(self, univariate_sample_timeseries):
        with pytest.raises(
            TypeError, match=r"Expected 'other' to be a Timeseries, got*"
        ):
            univariate_sample_timeseries.regress("not_a_timeseries")

    def test_fail_on_time_index_mismatch(self, univariate_sample_timeseries):

        other_ts = Timeseries(
            time_idx=TimeIndex(
                np.array(
                    [
                        datetime(2025, 1, 1, 0),
                        datetime(2025, 1, 1, 1),
                    ]
                )
            ),
            metric_idx=univariate_sample_timeseries.metrics,
            entity_uid_idx=univariate_sample_timeseries.entity_uids,
            data=np.array([[[1]], [[2]]]),
        )
        with pytest.raises(
            ValueError,
            match=r"Timeseries must have the same time index for regression",
        ):
            univariate_sample_timeseries.regress(other_ts)

    def test_fail_for_multivariate_as_first(self, sample_timeseries):
        uni = sample_timeseries[
            MetricAttributes(name="cpu"),
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
        ]
        with pytest.raises(
            ValueError, match=r"Regression is only supported for 1D Timeseries"
        ):
            sample_timeseries.regress(uni)

    def test_fail_for_multivariate_as_second(
        self, sample_timeseries, univariate_sample_timeseries
    ):
        uni = sample_timeseries[
            MetricAttributes(name="cpu"),
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
        ]
        with pytest.raises(
            ValueError, match=r"Regression is only supported for 1D Timeseries"
        ):
            uni.regress(sample_timeseries)

    def test_regress_valid_timeseries(self, univariate_sample_timeseries):
        regression = univariate_sample_timeseries.regress(
            univariate_sample_timeseries
        )

        result = regression(univariate_sample_timeseries)
        assert isinstance(result, Timeseries)
        assert np.allclose(
            result.values.squeeze(),
            univariate_sample_timeseries.values.squeeze(),
            atol=1e-2,
        )
        assert np.array_equal(
            result.time_index, univariate_sample_timeseries.time_index
        )

    def test_regress_itself_valid_values(self, univariate_sample_timeseries):
        regression = univariate_sample_timeseries.regress(
            univariate_sample_timeseries
        )

        result = regression(univariate_sample_timeseries)
        assert np.array_equal(
            result.time_index, univariate_sample_timeseries.time_index
        )
        assert np.array_equal(
            result.metrics, univariate_sample_timeseries.metrics
        )
        assert np.array_equal(
            result.entity_uids, univariate_sample_timeseries.entity_uids
        )

        assert np.allclose(
            result.values.squeeze(),
            univariate_sample_timeseries.values.squeeze(),
            atol=1e-2,
        )

    def test_regress_fail_on_nans(self, univariate_sample_timeseries):
        univariate_sample_timeseries._data = (
            univariate_sample_timeseries._data.astype(float)
        )
        univariate_sample_timeseries._data[0, 0, 0] = np.nan

        with pytest.raises(RuntimeError):
            _ = univariate_sample_timeseries.regress(
                univariate_sample_timeseries
            )

    def test_regress_with_single_brekapoint(
        self, univariate_sample_timeseries
    ):
        regression = univariate_sample_timeseries.regress(
            univariate_sample_timeseries, n_breakpoints=1
        )

        result = regression(univariate_sample_timeseries)

    def test_regress_with_zero_breakpoints(self, univariate_sample_timeseries):
        regression = univariate_sample_timeseries.regress(
            univariate_sample_timeseries, n_breakpoints=0
        )

        _ = regression(univariate_sample_timeseries)

    def test_regress_compute_for_other_metric_valid_bounds(
        self, univariate_sample_timeseries
    ):
        other_ts = Timeseries(
            time_idx=univariate_sample_timeseries.time_index,
            metric_idx=np.array([MetricAttributes(name="memory")]),
            entity_uid_idx=univariate_sample_timeseries.entity_uids,
            data=np.linspace(
                100, 1_000, len(univariate_sample_timeseries.time_index)
            ).reshape(-1, 1, 1),
        )

        regression = univariate_sample_timeseries.regress(other_ts)
        result = regression(univariate_sample_timeseries)

    def test_find_correct_breakpoints(self):
        x = np.linspace(0, 10, 200)
        y_true = np.piecewise(
            x,
            [x < 3, (x >= 3) & (x < 6), x >= 6],
            [
                lambda x: 2 * x + 1,
                lambda x: -1 * x + 10,
                lambda x: 0.5 * x + 1,
            ],
        )

        ts = Timeseries(
            time_idx=np.array(
                [
                    datetime(2025, 1, 1, 0) + timedelta(seconds=i)
                    for i in range(200)
                ],
                dtype="datetime64[s]",
            ),
            metric_idx=np.array([MetricAttributes(name="y")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=y_true.reshape(-1, 1, 1),
        )
        ts2 = Timeseries(
            time_idx=ts.time_index,
            metric_idx=np.array([MetricAttributes(name="x")]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
            ),
            data=x.reshape(-1, 1, 1),
        )
        regression = ts2.regress(ts, n_breakpoints=2)
        result = regression(ts2)

        assert np.allclose(result.values, ts.values)

class TestNumPyProtocol:

    def test_1d_timeseries_to_numpy(self, sample_timeseries):
        ts_1d = sample_timeseries[MetricAttributes(name="cpu"), EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
        np.testing.assert_array_equal(
            np.array(ts_1d),
            ts_1d.values
        )

    def test_many_metrics_to_numpy(self, sample_timeseries):
        ts_2d = sample_timeseries[
            EntityUID(EntityType.VIRTUAL_MACHINE, 1),
        ]
        np.testing.assert_array_equal(
            np.array(ts_2d),
            ts_2d.values
        )

    def test_apply_ufunc_to_timeseries(self, sample_timeseries):
        ts_1d = sample_timeseries[MetricAttributes(name="cpu"), EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
        result = np.sqrt(ts_1d)
        expected = np.sqrt(ts_1d.values)

        np.testing.assert_array_equal(result.values, expected)
        np.testing.assert_equal(result.time_index, ts_1d.time_index)
        np.testing.assert_equal(result.metrics, ts_1d.metrics)
        np.testing.assert_equal(result.entity_uids, ts_1d.entity_uids)
