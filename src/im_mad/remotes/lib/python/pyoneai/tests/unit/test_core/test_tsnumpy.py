from datetime import datetime, timedelta, timezone
from typing import Union

import numpy as np
import pytest

from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.time import Instant, Period
from pyoneai.core.tsnumpy.index import TimeIndex
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

    metrics = np.array(["cpu", "memory", "network"])

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
            "cpu",
            "memory",
            "disk_read",
            "disk_write",
            "net_rx",
            "net_tx",
            "iops",
            "load",
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
        assert_metrics_equal("cpu", cpu_ts._metric_idx.values)
        expected = np.array([[[1, 2]], [[7, 8]]])
        np.testing.assert_array_equal(cpu_ts.values, expected)

    def test_multiple_metrics_selection(self, sample_timeseries):
        """Test selecting multiple metrics from timeseries."""
        resources_ts = sample_timeseries[["cpu", "memory"]]
        assert resources_ts.shape == (2, 2, 2)
        assert_metrics_equal(
            ["cpu", "memory"], resources_ts._metric_idx.values
        )
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
        assert_metrics_equal("cpu", result._metric_idx.values)

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
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)

    def test_time_entity_selection(self, large_timeseries):
        """Test combined time and entity selection."""
        result = large_timeseries[self.test_period, self.test_entity]
        assert result.shape == (2, 8, 1)  # 2 hours, 8 metrics, 1 VM
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    def test_metric_entity_selection(self, large_timeseries):
        """Test combined metric and entity selection."""
        result = large_timeseries[["cpu", "memory"], self.test_entity]
        assert result.shape == (24, 2, 1)  # 24 hours, 2 metrics, 1 VM
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Three Dimension Slicing Tests
    def test_time_metric_entity_selection(self, large_timeseries):
        """Test selection on all three dimensions."""
        result = large_timeseries[
            self.test_period, ["cpu", "memory"], self.test_entity
        ]
        assert result.shape == (2, 2, 1)  # 2 hours, 2 metrics, 1 VM
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    # Mixed Selection Tests
    def test_instant_multiple_metrics(self, large_timeseries):
        """Test single time point with multiple metrics."""
        result = large_timeseries[self.test_instant, ["cpu", "memory"]]
        assert result.shape == (1, 2, 5)  # 1 hour, 2 metrics, 5 VMs
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)

    def test_period_single_metric(self, large_timeseries):
        """Test time period with single metric."""
        result = large_timeseries[self.test_period, "cpu"]
        assert result.shape == (2, 1, 5)  # 2 hours, 1 metric, 5 VMs
        assert_metrics_equal("cpu", result._metric_idx.values)

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
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)
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
        metrics = np.array(["cpu"])
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
        metrics = np.array(["cpu"])
        data = np.zeros((2, 1, 2))

        with pytest.raises(
            ValueError, match="Invalid entity types at indices"
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
        metrics = np.array(["cpu"])
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
        assert_metrics_equal("cpu", result._metric_idx.values)
        assert_entities_equal(self.test_entity, result._entity_idx.values)

    def test_mixed_single_multiple_different_order(self, large_timeseries):
        """Test mixed single/multiple selections with different dimension order."""
        result = large_timeseries[self.test_entities, "cpu", self.test_instant]
        assert result.shape == (1, 1, 2)  # 1 hour, 1 metric, 2 VMs
        assert_metrics_equal("cpu", result._metric_idx.values)
        assert_entities_equal(self.test_entities, result._entity_idx.values)

    def test_multiple_selections_all_dimensions(self, large_timeseries):
        """Test multiple selections in all dimensions simultaneously."""
        result = large_timeseries[
            self.test_period,
            ["cpu", "memory"],
            self.test_entities,
        ]
        assert result.shape == (2, 2, 2)  # 2 hours, 2 metrics, 2 VMs
        assert_metrics_equal(["cpu", "memory"], result._metric_idx.values)
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
        metrics = np.array(["cpu"])
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
        metrics = np.array(["cpu"])
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
        metrics = np.array(["cpu"])
        data = np.zeros((2, 1, 2))

        ts = Timeseries(self.test_period, metrics, entities, data)
        assert ts.shape == (2, 1, 2)

    # Metric Handling Tests
    def test_metric_case_sensitivity(self):
        """Test case-sensitive behavior of metric names."""
        # Test initialization with case-sensitive metrics
        metrics = np.array(["CPU", "cpu", "Memory"])
        data = np.zeros((2, 3, 1))
        entities = np.array([self.test_entity])

        ts = Timeseries(self.test_period, metrics, entities, data)
        assert ts.shape == (2, 3, 1)

        # Test individual metric selection
        cpu_lower = ts["cpu"]
        assert_metrics_equal("cpu", cpu_lower._metric_idx.values)

        cpu_upper = ts["CPU"]
        assert_metrics_equal("CPU", cpu_upper._metric_idx.values)

        # Test multiple metric selection
        multi_ts = ts[["CPU", "Memory"]]
        assert_metrics_equal(["CPU", "Memory"], multi_ts._metric_idx.values)

    def test_metric_validation(self):
        """Test comprehensive metric validation including duplicates, empty lists, and invalid names."""
        metrics = np.array(["cpu", "memory"])
        data = np.zeros((2, 2, 1))
        entities = np.array([self.test_entity])

        ts = Timeseries(self.test_period, metrics, entities, data)

        # Test duplicate metrics in initialization
        with pytest.raises(
            ValueError, match="Duplicate metric names not allowed"
        ):
            Timeseries(
                self.test_period,
                np.array(["cpu", "memory", "cpu"]),
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
        with pytest.raises(
            KeyError, match="Available metrics.*: 'cpu', 'memory'"
        ):
            _ = ts["CPU"]  # Wrong case

        with pytest.raises(
            KeyError, match="Available metrics.*: 'cpu', 'memory'"
        ):
            _ = ts["network"]  # Non-existent metric

        # Test invalid metric names
        with pytest.raises(
            KeyError, match="Available metrics.*: 'cpu', 'memory'"
        ):
            _ = ts["cpu%"]  # Special characters

        with pytest.raises(
            KeyError, match="Available metrics.*: 'cpu', 'memory'"
        ):
            _ = ts["cpu usage"]  # Whitespace

        # Test mixed valid/invalid selections
        with pytest.raises(
            KeyError, match="Available metrics.*: 'cpu', 'memory'"
        ):
            _ = ts[["cpu", "disk"]]  # One valid, one invalid


class TestTimeIndex:

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
