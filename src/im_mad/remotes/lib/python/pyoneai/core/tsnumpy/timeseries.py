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

"""Timeseries implementation for OpenNebula metrics.

This module provides the main Timeseries class for handling time-series data in OpenNebula.
"""

from __future__ import annotations

import json
from datetime import timedelta
from typing import Any, Mapping, Tuple, Union

import numpy as np

from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.time import Instant, Period

from .index import EntityIndex, MetricIndex, TimeIndex


class Timeseries:
    """A class representing time-series data for OpenNebula entities.

    This class provides a 3-dimensional view of metric data organized by time,
    metrics, and entities. The data is stored in a numpy array with shape
    (time_points, metrics, entities).

    Parameters
    ----------
    time_idx : Union[Period, Instant, TimeIndex]
        Time points of the series. Can be a Period, Instant, or TimeIndex object.
    metric_idx : numpy.ndarray
        Array of metric names as strings.
    entity_uid_idx : numpy.ndarray
        Array of EntityUID objects identifying the entities.
    data : numpy.ndarray
        3D array of metric values with shape (time_points, metrics, entities).

    Attributes
    ----------
    metric_names : numpy.ndarray
        Available metric names.
    entity_uids : numpy.ndarray
        Entity identifiers.
    shape : tuple
        Data shape as (timestamps, metrics, entities).
    values : numpy.ndarray
        Raw data array (view).
    time_index : Union[Period, Instant]
        Time index of the series.

    Examples
    --------
    >>> ts = Timeseries(
    ...     time_idx=Period(...),
    ...     metric_idx=np.array(["cpu", "memory"]),
    ...     entity_uid_idx=np.array([
    ...         EntityUID(EntityType.VIRTUAL_MACHINE, 1),
    ...         EntityUID(EntityType.VIRTUAL_MACHINE, 2)
    ...     ]),
    ...     data=np.array([...])  # Shape: (time_points, 2, 2)
    ... )
    >>> cpu_ts = ts["cpu"]  # Select CPU metric
    >>> vm1_ts = ts[EntityUID(EntityType.VIRTUAL_MACHINE, 1)]  # Select VM
    >>> instant_ts = ts[Instant("2024-01-01T00:00:00+00:00")]  # Select time

    Raises
    ------
    ValueError
        If data is empty or dimensions don't match the indices.
    """

    __slots__ = ("_time_idx", "_data", "_metric_idx", "_entity_idx")

    def __init__(
        self,
        time_idx: Union[Period, Instant, TimeIndex, np.ndarray],
        metric_idx: np.ndarray[str],
        entity_uid_idx: np.ndarray[EntityUID],
        data: np.ndarray,
    ) -> None:
        # Handle empty data case
        if isinstance(data, np.ndarray) and data.size == 0:
            # Create minimal shape array (0, 1, 1) for empty timeseries
            data = np.array([]).reshape(
                (0, len(metric_idx), len(entity_uid_idx))
            )

        # Create index objects (validation is handled by the index classes)
        self._time_idx = (
            time_idx
            if isinstance(time_idx, TimeIndex)
            else TimeIndex(
                time_idx.values
                if isinstance(time_idx, Period)
                else (
                    np.array([time_idx.value])
                    if isinstance(time_idx, Instant)
                    else time_idx
                )
            )
        )
        self._metric_idx = MetricIndex(metric_idx)
        self._entity_idx = EntityIndex(entity_uid_idx)

        # Validate dimensions match
        expected_shape = (
            len(self._time_idx),
            len(self._metric_idx),
            len(self._entity_idx),
        )
        if data.shape != expected_shape or len(data.shape) != 3:
            raise ValueError(
                f"Dimension mismatch: got {data.shape}, expected {expected_shape} "
                f"(time × metrics × entities)"
            )

        self._data = data

    def __len__(self) -> int:
        """Length of the timeseries."""
        return len(self.time_index)

    @property
    def names(self) -> np.ndarray:
        """Available metric names."""
        return self._metric_idx.values

    @property
    def entity_uids(self) -> np.ndarray:
        """Entity identifiers."""
        return self._entity_idx.values

    @property
    def shape(self) -> tuple:
        """Data shape as (timestamps, metrics, entities)."""
        return self._data.shape

    @property
    def ndim(self) -> int:
        """Number of metrics in the timeseries.

        Returns
        -------
        int
            The number of metrics in the timeseries.
        """
        return len(self.names)

    @property
    def values(self) -> np.ndarray:
        """Raw data array (view)."""
        return self._data.view()

    @property
    def time_index(self) -> Union[Period, Instant, np.ndarray]:
        """Time index of the series."""
        len_index = len(self._time_idx)
        if len_index > 1:
            return Period(self._time_idx.values)
        elif len_index == 1:
            return Instant(self._time_idx.values[0])
        else:
            return np.array([])

    def rename(
        self, names: Mapping[str, str], copy: bool = True
    ) -> "Timeseries":
        """Rename metrics in the timeseries.

        Parameters
        ----------
        names : Mapping[str, str]
            Dictionary mapping old metric names to new ones.
            Example: {"cpu": "cpu_usage", "memory": "mem_usage"}
        copy : bool, optional
            If True, return a new timeseries. If False, modify in-place.
            Defaults to True.

        Returns
        -------
        Timeseries
            Timeseries with renamed metrics.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Create new timeseries with renamed metrics
        >>> renamed_ts = ts.rename({"cpu": "cpu_usage"})
        >>>
        >>> # Rename metrics in-place
        >>> ts.rename({"memory": "mem_usage"}, copy=False)
        """
        # Get current metric names
        current_names = self.names
        renamed_names = current_names.copy()

        # Update metric names that need to be renamed
        for old_name, new_name in names.items():
            if old_name in current_names:
                renamed_names[current_names == old_name] = new_name

        if copy:
            # Create new timeseries with renamed metrics
            return Timeseries(
                time_idx=TimeIndex(self._time_idx.values),
                metric_idx=renamed_names,
                entity_uid_idx=self._entity_idx.values,
                data=self._data.copy(),
            )
        else:
            # Modify metric names in-place
            self._metric_idx = MetricIndex(renamed_names)
            return self

    def to_dict(self) -> dict:
        """Convert timeseries data to a dictionary.
        Can be then converted to a pandas DataFrame or polars Series if needed.

        Returns
        -------
        dict
            A dictionary containing the timeseries data.
        """
        return {
            "time": self.time_index.values,
            "metric_name": self.names,
            "entity_uid": self.entity_uids,
            "data": self.values,
        }

    def to_array(
        self, dtype: Union[np.dtype, None] = None, copy: bool = False
    ) -> np.ndarray:
        """Convert timeseries data to numpy array.

        Parameters
        ----------
        dtype : numpy.dtype, optional
            The dtype to cast the data to. If None, keeps original dtype.
        copy : bool, optional
            Whether to return a copy of the data. If False, returns a view when possible.

        Returns
        -------
        numpy.ndarray
            The timeseries data as a numpy array.
        """
        data = self._data.copy() if copy else self._data.view()
        return data.astype(dtype) if dtype is not None else data

    def __getitem__(self, key: Union[Any, tuple]) -> "Timeseries":
        """Get subset of timeseries by metric name(s), entity uid(s), or time selection.

        Parameters
        ----------
        key : Union[str, List[str], Period, Instant, EntityUID, List[EntityUID], tuple]
            Selection criteria:
            - str: Single metric name
            - List[str]: Multiple metric names
            - Period: Time range selection
            - Instant: Single time point
            - EntityUID: Single entity
            - List[EntityUID]: Multiple entities
            - tuple: Combination of above types for multi-dimensional selection

        Returns
        -------
        Timeseries
            New timeseries with selected data.

        Raises
        ------
        KeyError
            If metric name or entity not found.
        ValueError
            If time selection is invalid or selection list is empty.
        TypeError
            If key type is not supported.

        Examples
        --------
        >>> # Select single metric
        >>> cpu_ts = ts["cpu"]
        >>> # Select multiple metrics
        >>> resources_ts = ts[["cpu", "memory"]]
        >>> # Select time range
        >>> period_ts = ts[Period("2024-01-01", "2024-01-02")]
        >>> # Select single entity
        >>> vm_ts = ts[EntityUID(EntityType.VIRTUAL_MACHINE, 1)]
        """
        # Process key into index arrays and new indices
        index_arrays = self._process_key(key)
        return self.isel(*index_arrays)

    def isel(
        self,
        time_idx: Union[int, list[int], slice, np.ndarray] = slice(None),
        metric_idx: Union[int, list[int], slice, np.ndarray] = slice(None),
        entity_idx: Union[int, list[int], slice, np.ndarray] = slice(None),
    ) -> Timeseries:
        processed_index: np.ndarray = np.empty(3, dtype=object)
        for i, sel in enumerate([time_idx, metric_idx, entity_idx]):
            if isinstance(sel, (int, np.integer, list, np.ndarray)):
                processed_index[i] = np.array([sel], dtype=np.intp).flatten()
            elif isinstance(sel, slice):
                # NOTE: to consider direct usage of slice for
                # selection. Using collection of IDs makes
                # copy of data (of underlying NumPy ndarray)
                _slice_values = sel.indices(self._data.shape[i])
                processed_index[i] = np.arange(*_slice_values)
            else:
                raise TypeError(f"Index type {type(sel)} is not supported.")
        new_data = self._data[np.ix_(*processed_index)]

        if len(new_data.shape) != 3:
            raise ValueError(
                f"Internal error: array must be 3D after processing, "
                f"got shape {new_data.shape}"
            )
        new_time_index = self._time_idx.get_sliced_index(time_idx)
        new_metric_index = self._metric_idx.get_sliced_index(metric_idx)
        new_entity_index = self._entity_idx.get_sliced_index(entity_idx)

        return Timeseries(
            new_time_index, new_metric_index, new_entity_index, new_data
        )

    def _process_key(self, key: Union[Any, tuple]) -> tuple:
        """Process selection key and return selections tuple and new indices.

        Parameters
        ----------
        key : Union[Any, tuple]
            Selection key which can be a single value or tuple of selections.

        Returns
        -------
        tuple
            A tuple containing:
            - tuple of numpy indexing arrays (ready for array indexing)
            - new time index
            - new metric index
            - new entity index

        Raises
        ------
        ValueError
            If an empty list is provided for any dimension.
        TypeError
            If an unsupported key type is provided.
        """
        # Initialize selections with default slices
        selections = np.array([slice(None)] * 3, dtype=object)
        time_key = None

        # Convert single key to tuple and process in one pass
        keys = (key,) if not isinstance(key, tuple) else key

        # Check for empty lists before any processing
        for k in keys:
            if isinstance(k, list) and len(k) == 0:
                raise ValueError("Empty selection list")

        # Pre-allocate arrays for type checking to avoid multiple isinstance calls
        is_time = np.array([isinstance(k, (Period, Instant)) for k in keys])
        is_metric = np.array(
            [
                isinstance(k, (str, list))
                and (isinstance(k, str) or all(isinstance(x, str) for x in k))
                for k in keys
            ]
        )
        is_entity = np.array(
            [
                isinstance(k, (EntityUID, list))
                and (
                    isinstance(k, EntityUID)
                    or all(isinstance(x, EntityUID) for x in k)
                )
                for k in keys
            ]
        )

        # Get time key if present (needed for return value)
        if np.any(is_time):
            time_key = keys[np.argmax(is_time)]
            selections[0] = self._time_idx.get_loc(time_key)

        # Process metric and entity selections
        if np.any(is_metric):
            selections[1] = self._metric_idx.get_loc(
                keys[np.argmax(is_metric)]
            )
        if np.any(is_entity):
            selections[2] = self._entity_idx.get_loc(
                keys[np.argmax(is_entity)]
            )

        # Validate no unknown types
        if not np.all(is_time | is_metric | is_entity):
            invalid_idx = np.where(~(is_time | is_metric | is_entity))[0][0]
            raise TypeError(f"Unsupported key type: {type(keys[invalid_idx])}")

        # STEP 1: Convert all selection types to numpy arrays
        # This ensures consistent handling regardless of input type (slice, list, int, etc.)
        return tuple(selections)

    @classmethod
    def read_from_database(
        cls,
        connection: Any,
        table_name: str,
        metric_name: str,
        timestamp_col: str,
        value_col: str,
        time: Union[Period, Instant],
        tolerance: timedelta,
        interpolate: bool = True,
    ) -> "Timeseries":
        """Read timeseries data from a database.

        Parameters
        ----------
        connection : Any
            Database connection object that supports cursor() and execute()
        table_name : str
            Name of the table to query
        metric_name : str
            Name of the metric being queried
        timestamp_col : str
            Name of the timestamp column
        value_col : str
            Name of the value column
        time : Union[Period, Instant]
            Time range or instant to query
        tolerance : timedelta
            Time tolerance to add/subtract from query bounds
        interpolate : bool, optional
            Whether to interpolate missing values, by default True

        Returns
        -------
        Timeseries
            A new timeseries containing the queried data
        """
        # Prepare query time bounds
        if isinstance(time, Period):
            start = (time.start - tolerance).timestamp()
            end = (time.end + tolerance).timestamp()
            time_index = time.values
        elif isinstance(time, Instant):
            start = (time.value - tolerance).timestamp()
            end = (time.value + tolerance).timestamp()
            time_index = np.array([time.value])
        else:
            raise TypeError(
                "Invalid time parameter. Must be of type Instant or Period."
            )

        # Construct and execute query
        query = f"""
        SELECT {timestamp_col}, {value_col}
        FROM {table_name}
        WHERE {timestamp_col} BETWEEN '{start}' AND '{end}'
        ORDER BY {timestamp_col} ASC;
        """

        try:
            cursor = connection.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
        finally:
            cursor.close()

        if not rows:
            # Return empty timeseries with NaN values
            return cls(
                time_idx=time_index,
                metric_idx=np.array([metric_name]),
                entity_uid_idx=np.array(
                    [EntityUID(EntityType.VIRTUAL_MACHINE, -1)]
                ),
                data=np.full((len(time_index), 1, 1), np.nan),
            )

        # Convert timestamps and check for duplicates
        try:
            from datetime import datetime, timezone

            db_timestamps = np.array(
                [datetime.fromtimestamp(row[0], timezone.utc) for row in rows],
                dtype="object",
            )
        except ValueError as e:
            raise ValueError(f"Invalid timestamp format in database: {e}")

        # Check for duplicate timestamps
        _, counts = np.unique(db_timestamps, return_counts=True)
        if np.any(counts > 1):
            raise ValueError("Duplicate timestamps found in database results")

        # Convert values to numpy array
        db_values = []
        for row in rows:
            value = row[1]
            if value is None:
                db_values.append(np.nan)
            else:
                try:
                    db_values.append(float(value))
                except (ValueError, TypeError):
                    raise TypeError(f"Cannot convert value '{value}' to float")
        db_values = np.array(db_values, dtype=np.float32)

        # Convert time_index to numpy datetime for comparison
        time_idx_np = np.array(time_index, dtype="object")

        # Create unified sorted time index
        all_times = np.unique(np.concatenate([time_idx_np, db_timestamps]))

        # Create result array filled with NaN
        result_data = np.full((len(all_times), 1, 1), np.nan, dtype=np.float32)

        # Find indices for time alignment
        db_indices = np.searchsorted(all_times, db_timestamps)

        # Fill data at correct time positions
        result_data[db_indices, 0, 0] = db_values

        if interpolate:
            # TODO: Use the TSQuality framework to interpolate missing values and decide what interpolation method to use
            valid_mask = ~np.isnan(result_data[:, 0, 0])
            x = np.arange(len(all_times))
            if np.any(valid_mask):
                x_valid = x[valid_mask]
                y_valid = result_data[valid_mask, 0, 0]
                result_data[:, 0, 0] = np.interp(x, x_valid, y_valid)

        # Get final values at requested times
        final_indices = np.searchsorted(all_times, time_idx_np)
        final_data = result_data[final_indices]

        return cls(
            time_idx=time_index,
            metric_idx=np.array([metric_name]),
            entity_uid_idx=np.array(
                [EntityUID(EntityType.VIRTUAL_MACHINE, -1)]
            ),
            data=final_data,
        )

    #
    # Mathematical Operations (TODO)
    #

    def __add__(self, other: Union[Timeseries, float, int]) -> Timeseries:
        """Add two timeseries or add a scalar to a timeseries.

        Parameters
        ----------
        other : Union[Timeseries, float, int]
            The timeseries or scalar to add.

        Returns
        -------
        Timeseries
            A new timeseries containing the sum.

        Notes
        -----
        When adding two timeseries:
        - Time indices are aligned using their union
        - Missing values are filled with NaN
        - Metrics must match between the two timeseries
        """
        if isinstance(other, (float, int)):
            # For scalar addition, simply add to all values
            return Timeseries(
                time_idx=self._time_idx,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=self._data + other,
            )
        elif isinstance(other, Timeseries):
            # Validate metric names match
            if not np.array_equal(self.names, other.names):
                raise ValueError(
                    "Cannot add timeseries with different metric names"
                )

            # Find union of time indices and sort them
            all_times = np.unique(
                np.concatenate([self._time_idx.values, other._time_idx.values])
            )

            # Create result array filled with NaN
            result_data = np.full(
                (len(all_times), len(self.names), len(self._entity_idx)),
                np.nan,
                dtype=np.float32,
            )

            # Find indices for time alignment
            self_time_indices = np.searchsorted(
                all_times, self._time_idx.values
            )
            other_time_indices = np.searchsorted(
                all_times, other._time_idx.values
            )

            # Fill data from both timeseries
            result_data[self_time_indices] = self._data
            result_data[other_time_indices] += other._data

            return Timeseries(
                time_idx=all_times,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=result_data,
            )
        else:
            return NotImplemented

    def __radd__(self, other: Union[float, int]) -> Timeseries:
        """Implement reverse addition."""
        return self.__add__(other)

    def append(self, other: "Timeseries") -> "Timeseries":
        """Append another timeseries to this one.

        Parameters
        ----------
        other : Timeseries
            The timeseries to append

        Returns
        -------
        Timeseries
            A new timeseries containing the concatenated data

        Notes
        -----
        - The timeseries must have the same metrics
        - The timestamps must not overlap
        - The result will be sorted by time
        """
        # Handle empty cases
        if len(other._time_idx) == 0:
            return Timeseries(
                time_idx=self._time_idx,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=self._data.copy(),
            )
        if len(self._time_idx) == 0:
            return Timeseries(
                time_idx=other._time_idx,
                metric_idx=other._metric_idx.values,
                entity_uid_idx=other._entity_idx.values,
                data=other._data.copy(),
            )

        # Verify metrics match
        if not np.array_equal(self.names, other.names):
            raise ValueError("Cannot append timeseries with different metrics")

        # Get time indices and check for overlaps
        all_times = np.concatenate(
            [self._time_idx.values, other._time_idx.values]
        )
        unique_times = np.unique(all_times)
        if len(unique_times) != len(all_times):
            raise ValueError(
                "Cannot append timeseries with overlapping timestamps."
            )

        # Sort by time
        sort_idx = np.argsort(all_times)
        all_times = all_times[sort_idx]

        # Create new data array by concatenating and sorting
        new_data = np.concatenate([self._data, other._data], axis=0)[sort_idx]

        return Timeseries(
            time_idx=all_times,
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=new_data,
        )

    def to_json(self) -> str:
        """Convert timeseries data to JSON string.

        Returns
        -------
        str
            JSON string representation of the timeseries data.
            Format: {"metric_name": {timestamp_ms: value, ...}, ...}
            where timestamp_ms is Unix timestamp in milliseconds.
        """
        # Convert timestamps to epoch in seconds
        time_ms = np.array(
            [int(t.timestamp()) for t in self._time_idx.values]
        )

        # Create dictionary for each metric
        result = {}
        for i, metric_name in enumerate(self.names):
            # Get values for this metric (assuming single entity for now)
            values = self._data[:, i, 0]
            # Create timestamp:value mapping
            result[metric_name] = {
                int(t): round(float(v), 2) for t, v in zip(time_ms, values)
            }

        return json.dumps(result, separators=(",", ":"))
