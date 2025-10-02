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

"""Timeseries implementation for OpenNebula metrics.

This module provides the main Timeseries class for handling time-series data in OpenNebula.
"""

from __future__ import annotations

import importlib
import json
import math
from datetime import datetime, timedelta, timezone
from enum import IntEnum
import os
from pathlib import Path
from typing import (
    Any,
    Callable,
    ClassVar,
    Generator,
    List,
    Literal,
    Mapping,
    Optional,
    TypeVar,
    Union,
)

import numpy as np

from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.metric_types import MetricAttributes, MetricType
from pyoneai.core.time import Instant, Period, _parse_timedelta

from .index import EntityIndex, MetricIndex, TimeIndex


class Axis(IntEnum):
    """Enumeration of axis indices for Timeseries dimensions."""

    TIME = 0
    METRIC = 1
    ENTITY = 2


_TimeseriesT = TypeVar("_TimeseriesT", bound="Timeseries")


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
        Array of metric names as MetricAttribute.
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
    ...     metric_idx=np.array([
    ...         MetricAttribute(name="cpu", limits=(0, 100), dtype="int"),
    ...         MetricAttribute(name="memory", limits=(0, 100), dtype="int")]),
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

    _INTERNAL_DATA_DIMENSIONALITY: ClassVar[int] = 3
    _MIN_OBS_NEEDED_FOR_TREND_FIT: ClassVar[int] = 2
    __slots__ = ("_time_idx", "_data", "_metric_idx", "_entity_idx")

    def _convert_axis_param(
        self, axis: Union[str, int, tuple, list, None]
    ) -> Union[int, tuple, None]:
        """Convert string axis names to their numeric indices.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None]
            The axis parameter to convert. Can be:
            - str: A string name (e.g., 'time', 'metric', 'entity')
            - int: A numeric axis index
            - tuple/list: A collection of string names or numeric indices
            - None: No axis specified

        Returns
        -------
        Union[int, tuple, None]
            The converted numeric axis parameter.

        Raises
        ------
        ValueError
            If an invalid axis name is provided.
        """
        if axis is None:
            return None
        if isinstance(axis, (int, np.integer)):
            return int(axis)
        if isinstance(axis, Axis):
            return int(axis)
        if isinstance(axis, str):
            ax_upper = axis.upper()
            try:
                return int(Axis[ax_upper])
            except KeyError:
                axis_names = [a.name for a in Axis]
                raise ValueError(
                    f"Invalid axis name '{axis}'. Must be one of {axis_names}"
                )
        if isinstance(axis, (list, tuple)):
            return tuple(self._convert_axis_param(a) for a in axis)
        raise TypeError(f"Unsupported axis type: {type(axis)}")

    def __init__(
        self,
        time_idx: Union[Period, Instant, TimeIndex, np.ndarray],
        metric_idx: np.ndarray,
        entity_uid_idx: np.ndarray,
        data: np.ndarray,
    ) -> None:
        self._validate_data(data)
        self._validate_types(data, time_idx, metric_idx, entity_uid_idx)
        self._validate_dimensions(data, time_idx, metric_idx, entity_uid_idx)

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
        self._data = data

    def _validate_data(self, data: np.ndarray) -> None:
        if data.size == 0:
            raise ValueError("Data cannot be empty.")

    def _validate_types(
        self,
        data: np.ndarray,
        time_idx: Union[Period, Instant, TimeIndex, np.ndarray],
        metric_idx: np.ndarray,
        entity_uid_idx: np.ndarray,
    ) -> None:
        if not isinstance(data, np.ndarray):
            raise ValueError("Data must be a numpy array.")
        if not isinstance(time_idx, (Period, Instant, TimeIndex, np.ndarray)):
            raise ValueError(
                "Time index must be a Period, Instant, TimeIndex, "
                "or numpy array."
            )
        if not (
            isinstance(metric_idx, np.ndarray)
            and all(isinstance(mid, MetricAttributes) for mid in metric_idx)
        ):
            raise ValueError(
                "Metric index must be a numpy array of " "MetricAttributes."
            )
        if not (
            isinstance(entity_uid_idx, np.ndarray)
            and all(isinstance(uid, EntityUID) for uid in entity_uid_idx)
        ):
            raise ValueError(
                "Entity index must be a numpy array of EntityUID."
            )

    def _validate_dimensions(
        self,
        data: np.ndarray,
        time_idx: Union[Period, Instant, TimeIndex, np.ndarray],
        metric_idx: np.ndarray,
        entity_uid_idx: np.ndarray,
    ) -> None:
        metric_idx = np.array(metric_idx, ndmin=1)
        entity_uid_idx = np.array(entity_uid_idx, ndmin=1)
        indices_shape = (
            len(time_idx),
            len(metric_idx),
            len(entity_uid_idx),
        )
        if data.shape != indices_shape:
            raise ValueError(
                f"Dimension mismatch: got {data.shape}, "
                f"expected {indices_shape} "
                f"(time × metrics × entities)"
            )

    def __len__(self) -> int:
        """Length of the timeseries."""
        return len(self.time_index)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Timeseries):
            return False
        return np.array_equal(
            self._data, other._data, equal_nan=True
        ) and np.array_equal(
            self.time_index, other.time_index
        ) and np.array_equal(
            self.metrics, other.metrics
        ), np.array_equal(
            self.entity_uids, other.entity_uids
        )

    @property
    def metrics(self) -> np.ndarray:
        """Available metrics."""
        return self._metric_idx.values

    @property
    def names(self) -> np.ndarray:
        """Available metric names."""
        return self._metric_idx.names

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
        return len(self.metrics)

    @property
    def values(self) -> np.ndarray:
        """Raw data array (view)."""
        return self._data.view()

    @property
    def time_index(self) -> np.ndarray:
        """Time index of the series."""
        if len(self._time_idx) >= 1:
            return self._time_idx.values
        return np.array([])

    @property
    def is_univariate(self) -> bool:
        return (self.ndim == 1) and (self.entity_uids.size == 1)

    @property
    def has_trend(self) -> bool:
        """
        Determine if the timeseries has a statistically significant trend.

        Returns
        -------
        bool
            True if a significant trend is detected, False otherwise
        """
        if self.ndim > 1:
            # TODO: Check what is the right definition of trend for multivariate timeseries
            for _, _, ts in self.iter_over_variates():
                if ts._mann_kendall_test()["trend_detected"]:
                    return True
            return False
        else:
            return self._mann_kendall_test()["trend_detected"]

    @property
    def is_monotonic_increasing(self) -> bool:
        """Check if the timeseries is monotonically increasing.

        Returns
        -------
        bool
            True if all metrics are monotonically increasing, False otherwise.
        """
        if len(self) <= 1:
            return True

        for _, _, ts in self.iter_over_variates():
            values = ts.values.squeeze()
            if not np.all(np.diff(values) >= 0):
                return False
        return True

    def rename(
        self, names: Mapping[str, str], copy: bool = True
    ) -> Timeseries:
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
            "time": self.time_index,
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

    def __getitem__(self, key: Union[Any, tuple]) -> Timeseries:
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
        processed_index: np.ndarray = np.empty(
            self._INTERNAL_DATA_DIMENSIONALITY, dtype=object
        )
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

        if new_data.ndim != self._INTERNAL_DATA_DIMENSIONALITY:
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
        selections = np.array(
            [slice(None)] * self._INTERNAL_DATA_DIMENSIONALITY, dtype=object
        )
        time_key = None

        # Convert single key to tuple and process in one pass
        keys = (key,) if not isinstance(key, tuple) else key

        # Check for empty lists before any processing
        for k in keys:
            if isinstance(k, list) and len(k) == 0:
                raise ValueError("Empty selection list")

        # Pre-allocate arrays for type checking to avoid multiple isinstance calls
        is_time = np.array([isinstance(k, (Period, Instant)) for k in keys])

        # NOTE: enable selecting metrics by names of entire MetricAttributes
        is_metric = np.array(
            [
                isinstance(k, (str, list))
                and (isinstance(k, str) or all(isinstance(x, str) for x in k))
                for k in keys
            ]
        )
        is_metric |= np.array(
            [
                isinstance(k, (MetricAttributes, list))
                and (
                    isinstance(k, MetricAttributes)
                    or all(isinstance(x, MetricAttributes) for x in k)
                )
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
    
    def write_to_db(
            self, 
            path: Union[str, os.PathLike, Path], 
            retention: timedelta | None = None, 
            suffix: str = "monitoring"
        ) -> None:
        """Write timeseries data to a SQLite database file.

        Creates/opens the database at `path`. Data for each metric-entity
        variate is stored in a separate table named:
        `{entity_uid}_{metric_name}_{suffix}`.

        Parameters
        ----------
        path : Union[str, os.PathLike, Path]
            Path to the SQLite database file (created if it doesn't exist).
        retention : timedelta, optional
            If set, automatically deletes rows older than this duration
            relative to the latest timestamp in each table upon insertion.
            Defaults to None (no deletion).
        suffix : str, optional
            Suffix for table names. Defaults to "monitoring".

        Returns
        -------
        None
        """
        from .io import SQLEngine

        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        SQLEngine(path, suffix=suffix).insert_data(self, retention)


    @classmethod
    def read_from_database(
        cls,
        path: Union[str, os.PathLike, Path],
        metric_attrs: MetricAttributes,
        entity_uid: EntityUID,
        time: Union[Period, Instant],
    ) -> Timeseries:
        """
        Read timeseries data from a database.

        Parameters
        ----------
        path : Union[str, os.PathLike, Path]
            The path to the database file.
        metric_attrs : MetricAttributes
            The metric attributes to query.
        entity_uid : EntityUID
            The entity UID to query.
        time : Union[Period, Instant]
            The time range to query.

        Returns
        -------
        Timeseries
            A new timeseries containing the queried data
        """
        from .io import SQLEngine

        engine = SQLEngine(path, suffix="monitoring")
        return engine.read_data(metric_attrs, entity_uid, time)


    @classmethod
    def merge(cls, *timeseries: Timeseries) -> Timeseries:
        """
        Merge collection of time series.
        If indices are not aligned, NaN values will be used for
        non-existing indices.
        Parameters
        ----------
        timeseries : tuple of Timeseries
            Timeserieses to be merged
        Returns
        -------
        Timeseries
            The merged Timeseries
        Raises
        ------
        ValueError
            If no timeseries is passed or if any passed object is not
            of Timeseries type
        """
        if not timeseries:
            raise ValueError("At least one argument must be provided.")
        if not all(isinstance(ts, Timeseries) for ts in timeseries):
            raise ValueError("All arguments must be of type Timeseries.")

        time_idx = np.array(
            np.sort(
                np.unique(
                    np.concatenate(
                        [ts.time_index for ts in timeseries], axis=0
                    )
                )
            ),
            ndmin=1,
        )
        # Preserve ordering for metrics and entities using lists
        metric_idx = []
        entity_idx = []

        for ts in timeseries:
            for metric in ts.metrics:
                if metric not in metric_idx:
                    metric_idx.append(metric)
            for entity in ts.entity_uids:
                if entity not in entity_idx:
                    entity_idx.append(entity)

        metric_idx = np.array(metric_idx, ndmin=1)
        entity_idx = np.array(entity_idx, ndmin=1)

        data = np.full(
            (len(time_idx), len(metric_idx), len(entity_idx)), np.nan
        )
        # NOTE: we do not support sparse time series, hance simple
        # stacking data and indices will not work at the moment
        # TODO: to consider increasing efficiency
        for ts in timeseries:
            for i, ti in enumerate(ts.time_index):
                for j, mi in enumerate(ts.metrics):
                    for k, ei in enumerate(ts.entity_uids):
                        merged_time_idx = np.where(time_idx == ti)[0][0]
                        merged_metric_idx = np.where(metric_idx == mi)[0][0]
                        merged_entity_idx = np.where(entity_idx == ei)[0][0]
                        data[
                            merged_time_idx,
                            merged_metric_idx,
                            merged_entity_idx,
                        ] = ts._data[i, j, k]

        return cls(
            time_idx=time_idx,
            metric_idx=metric_idx,
            entity_uid_idx=entity_idx,
            data=data,
        )

    def iter_over_variates(
        self,
    ) -> Generator[tuple[MetricAttributes, EntityUID, Timeseries], None, None]:
        """
        Iterate over all variates of the timeseries.

        Yields
        ------
        tuple[str, EntityUID, Timeseries]
            A tuple containing the metric name, entity UID, and timeseries.
        """
        for metric in self.metrics:
            for entity in self.entity_uids:
                yield (metric, entity, self[(metric, entity)])

    def resample(self, freq: str | timedelta, agg: str = "mean") -> Timeseries:
        """
        Resample timeseries to the requested frequency.

        Parameters
        ----------
        freq : string or timedelta
            If str it should be of the form <digit><unit> with the
            following supported units:
            - d - day,
            - h - hour,
            - m - minute,
            - s - second.
        agg : string
            Aggregation function, one out of ["mean", "max", "min", "sum"]

        Examples
        --------
        >>> ts.resample("1d", "sum")
        """

        if not isinstance(freq, (str, timedelta)):
            raise TypeError(
                "`freq` argument must be of str or timedelta type"
                f", but found {type(freq).__name__}."
            )
        if isinstance(freq, str):
            freq = _parse_timedelta(freq)
        if freq < timedelta(seconds=0):
            raise ValueError("`freq` argument cannot be negative timedelta")
        t_pref = f"{int(freq.total_seconds())}s"
        if agg not in {"mean", "min", "max", "sum"}:
            raise ValueError("Unsupported aggregation function")

        if freq < self._time_idx.frequency:
            raise ValueError(
                "Timeseries can only be resampled to coarser "
                "frequency. To produce more fine-grained timeseries "
                "use `interpolate` method."
            )
        # NOTE: we align resampled time instants with the original
        # ones as numpy.datetime64 truncates time
        dates = self.time_index.astype(np.datetime64)
        resampled_dates = dates.astype(f"datetime64[{t_pref}]")
        offset = dates[0] - resampled_dates[0]
        new_time_values = resampled_dates + offset
        unique_dates, _, unique_indx = np.unique(
            new_time_values,
            return_index=True,
            return_inverse=True,
        )
        # NOTE: as we use t_pref in seconds, above instruction always
        # returns object with time defined (not only date)
        start_date = unique_dates[0].astype(datetime)
        end_date = unique_dates[-1].astype(datetime)
        start_date = start_date.replace(tzinfo=self.time_index[0].tzinfo)
        end_date = end_date.replace(tzinfo=self.time_index[0].tzinfo)

        # A Period object is not handling the case where start_date == end_date
        if start_date != end_date:
            target_period = Period(slice(start_date, end_date, freq))
        else:
            target_period = Instant(start_date)

        variates = []
        for _, _, ts in self.iter_over_variates():
            data = ts._data.squeeze()
            resampled_data = np.array(
                [
                    getattr(data[np.where(unique_indx == i)[0]], agg)()
                    for i in range(len(unique_dates))
                ]
            ).reshape(-1, 1, 1)
            variates.append(
                Timeseries(
                    target_period, ts.metrics, ts.entity_uids, resampled_data
                )
            )
        return Timeseries.merge(*variates)

    def interpolate(
        self,
        time_idx: TimeIndex,
        kind: Literal["linear", "nearest"] = "linear",
    ) -> Timeseries:
        """
        Interpolate for the provided time index.

        Parameters
        ----------
        time_idx : TimeIndex
            The time for which interpolation should be computed
        kind : str
            The kind of interpolation. At the moment supported are:
            1. `linear` (piece-wise linear)
            2. `nearest`

        Returns
        -------
        Timeseries
            Interpolated Timeseries
        """
        if not isinstance(time_idx, TimeIndex):
            raise TypeError(
                "The `time_idx` argument must be of `TimeIndex` " "type."
            )
        if kind not in {"linear", "nearest"}:
            raise ValueError(
                "At the moment only following interpolation methods "
                "are supported: ['linear', 'nearest']."
            )
        variates = []
        for _, _, ts in self.iter_over_variates():
            query_vals = time_idx.as_timestamp()
            current_vals = ts._time_idx.as_timestamp()
            if kind == "nearest":
                idx = np.searchsorted(current_vals, query_vals)
                idx = np.clip(idx, 1, len(current_vals) - 1)
                left_neighbour = current_vals[idx - 1]
                right_neighbour = current_vals[idx]
                data = ts._data.squeeze()
                interp_data = np.where(
                    np.abs(query_vals - left_neighbour)
                    <= np.abs(query_vals - right_neighbour),
                    data[idx - 1],
                    data[idx],
                ).reshape(-1, 1, 1)
            elif kind == "linear":
                interp_data = np.interp(
                    query_vals, current_vals, np.atleast_1d(ts._data.squeeze())
                ).reshape(-1, 1, 1)
            variates.append(
                Timeseries(
                    time_idx.values, ts.metrics, ts.entity_uids, interp_data
                )
            )
        return Timeseries.merge(*variates)
    #
    # Cleaning
    #
    def clip(
        self,
        min_val: Union[float, None] = None,
        max_val: Union[float, None] = None,
    ) -> Timeseries:
        """Clip values of the Timeseries to the predefined limits."""
        tss = []
        for m_attr, _, ts in self.iter_over_variates():
            lower_limit, upper_limit = m_attr.dtype.limits
            lower_limit = min_val if min_val is not None else lower_limit
            upper_limit = max_val if max_val is not None else upper_limit

            data = np.clip(ts._data, a_min=lower_limit, a_max=upper_limit)
            tss.append(
                Timeseries(
                    time_idx=ts.time_index,
                    metric_idx=ts.metrics,
                    entity_uid_idx=ts.entity_uids,
                    data=data,
                )
            )
        return Timeseries.merge(*tss)

    def restore_counter(self) -> Timeseries:
        """Restore counter metrics that have been reset.

        This method detects resets in counter metrics (where values suddenly decrease)
        and adjusts the values to maintain monotonically increasing behavior by adding
        the last value before the reset.

        Returns
        -------
        Timeseries
            A new timeseries with restored counter values.
        """
        if len(self) <= 1:
            return self

        # Create output array with same shape as input
        restored_data = self._data.copy()

        # Process each metric-entity combination using iter_over_variates
        for metric, entity, ts in self.iter_over_variates():

            if metric.type != MetricType.COUNTER:
                continue

            if ts.is_monotonic_increasing:
                continue

            # Get metric and entity indices for updating the restored_data array
            metric_idx = np.where(self.metrics == metric)[0][0]
            entity_idx = np.where(self.entity_uids == entity)[0][0]

            # Extract values and restore them
            values = ts.values.squeeze()
            restored_values = self._restore_counter_values(values)

            # Update the restored data array
            restored_data[:, metric_idx, entity_idx] = restored_values

        return Timeseries(
            time_idx=self._time_idx,
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=restored_data,
        )

    def _restore_counter_values(self, values: np.ndarray) -> np.ndarray:
        """Restore monotonicity to counter values by detecting and fixing resets.

        Parameters
        ----------
        values : np.ndarray
            1D array of counter values that may contain resets

        Returns
        -------
        np.ndarray
            1D array with resets corrected to maintain monotonicity
        """
        # Make a copy to avoid modifying the input
        restored = values.copy()

        # Find where values decrease (potential resets)
        decreases = np.diff(values) < 0
        reset_indices = np.where(decreases)[0] + 1

        # If no resets detected, return the original values
        if len(reset_indices) == 0:
            return restored

        # Calculate cumulative corrections for each reset point
        corrections = np.zeros_like(values)
        for reset_idx in reset_indices:
            correction = values[reset_idx - 1]
            corrections[reset_idx:] += correction

        # Apply corrections
        restored = values + corrections

        return restored

    #
    # Trend Analysis
    #

    def fit_poly(self, deg: int = 1) -> List[np.poly1d]:
        """
        Fit a polynomial to the timeseries.

        Parameters
        ----------
        deg : int, optional
            The degree of the polynomial to fit, by default 1

        Returns
        -------
        List[np.poly1d]
            A list of polynomial functions, one for each variate
        """

        return [
            np.poly1d(
                np.polyfit(range(len(self)), ts.values.squeeze(), deg=deg)
            )
            for *_, ts in self.iter_over_variates()
        ]

    def fit_line(self) -> List[np.poly1d]:
        """
        Fit a line to the timeseries.

        Returns a tuple of np.ndarray (containing a slope and an intercept).

        Returns
        -------
        tuple[np.ndarray]
            The slope and intercept of the fitted line.
        """
        return self.fit_poly(1)

    def fit_exp(self) -> List[np.poly1d]:
        """
        Fit an exponential function to the timeseries and transform it to a polynomial form.
        The returned polynomial p(x) represents log(y + 1), so y = exp(p(x)) - 1.

        Returns
        -------
        List[np.poly1d]
            A list of fitted polynomials for the log-transformed data, one for each variate

        Raises
        ------
        ValueError
            If timeseries is not univariate or contains non-positive values
        """
        results = []
        x = self._time_idx.get_time_deltas_from_origin(
            self._time_idx.origin, self.time_index
        )
        for *_, ts in self.iter_over_variates():
            data = ts.values.squeeze()
            coeffs = np.polyfit(x, np.log(data + 1), deg=1)
            results.append(np.poly1d(coeffs))

        return results
    
    def spearman(self, other: Timeseries) -> float:
        """
        Calculate Spearman's rank correlation for the timeseries.

        Returns
        -------
        float
            Spearman's rank correlation coefficient.
        """
        if self.ndim > 1 or other.ndim > 1:
            raise ValueError(
                "Spearman's rank correlation requires univariate timeseries"
            )

        data = self.values.squeeze()
        if np.isnan(data).any():
            raise ValueError(
                "Spearman's rank correlation cannot handle NaN values in the timeseries"
            )
        
        if len(data) != len(other):
            raise ValueError(
                "Timeseries must have the same length for Spearman's rank correlation"
            )
        if not np.all(self.time_index == other.time_index):
            raise ValueError(
                "Timeseries must have the same time index for Spearman's rank correlation"
            )
        
        # Step 1: Compute ranks of self
        rank_a = self.values.squeeze().argsort().argsort()
        unique, inverse = np.unique(rank_a, return_inverse=True)

        unique_rank_sum = np.zeros_like(unique)
        np.add.at(unique_rank_sum, inverse, rank_a)

        unique_count = np.zeros_like(unique)
        np.add.at(unique_count, inverse, 1)

        unique_rank_mean = unique_rank_sum.astype(float) / unique_count
        rank_mean_a = unique_rank_mean[inverse]

        # Step 2: Compute ranks of other
        rank_b = other.values.squeeze().argsort().argsort()
        unique, inverse = np.unique(rank_b, return_inverse=True)

        unique_rank_sum = np.zeros_like(unique)
        np.add.at(unique_rank_sum, inverse, rank_b)

        unique_count = np.zeros_like(unique)
        np.add.at(unique_count, inverse, 1)

        unique_rank_mean = unique_rank_sum.astype(float) / unique_count
        rank_mean_b = unique_rank_mean[inverse]        

        spearman_corr = np.corrcoef(rank_mean_a, rank_mean_b)[0, 1]
        return spearman_corr

    def _mann_kendall_test(self, alpha: float = 0.05) -> dict[str, float]:
        """
        Perform Mann-Kendall trend test on the timeseries.

        This is a non-parametric test for monotonic trends in time series data.
        A positive value of the test statistic indicates an increasing trend,
        while a negative value indicates a decreasing trend.

        Parameters
        ----------
        alpha : float, optional
            Significance level, by default 0.05

        Returns
        -------
        dict[str, float]
            A dictionary containing:
            - "trend_detected": bool: True if trend is detected, False otherwise
            - "s": float: The Mann-Kendall test statistic (S)
            - "p_value": float: The p-value of the test
        """
        if self.ndim > 1:
            raise ValueError(
                "Mann-Kendall test requires univariate timeseries"
            )

        # Handle NaN values
        data = self.values.squeeze()
        if np.isnan(data).any():
            raise ValueError(
                "Mann-Kendall test cannot handle NaN values in the timeseries"
            )

        n = len(data)
        if n <= 2:
            return {"trend_detected": False, "s": 0.0, "p_value": 1.0}

        # Vectorized S calculation
        j, i = np.meshgrid(np.arange(n), np.arange(n))

        mask = i < j
        signs = np.sign(data[j[mask]] - data[i[mask]]).astype(np.float64)
        s = np.sum(signs)

        # Vectorized tie calculation
        _, counts = np.unique(data, return_counts=True)
        ties = np.sum(counts * (counts - 1) * (2 * counts + 5))

        var_s = (n * (n - 1) * (2 * n + 5) - ties) / 18

        if s > 0:
            Z = (s - 1) / np.sqrt(var_s)
        elif s < 0:
            Z = (s + 1) / np.sqrt(var_s)
        else:
            Z = 0

        p_value = 2 * (1 - 0.5 * (1 + math.erf(abs(Z) / np.sqrt(2))))

        trend_detected = p_value < alpha

        return {"trend_detected": trend_detected, "s": s, "p_value": p_value}

    def compute_trend(
        self, methods: Union[list[str], str] = None
    ) -> Callable[[TimeIndex, datetime], Timeseries]:
        """
        Find the best trend function for the timeseries by comparing 
        different methods using RANSAC metaalgorithm. Return a callable 
        that given a time specification (Period, Instant, or TimeIndex)
        returns a Timeseries with the transformed values.

        The best method is selected based on root mean square error
        value.

        Parameters
        ----------
        methods : list[str], optional
            List of methods to try for trend fitting.
            If None, defaults to using 'poly1' (linear trend).

        Returns
        -------
        Callable[[TimeIndex, datetime], Timeseries]
            A function that takes a time index of forecasted values 
            and the origin of the fitted trend model and returns 
            a Timeseries with the transformed values.

        Raises
        ------
        ValueError
            If the timeseries is not univariate or too short for trend 
            analysis or in case of invalid method.
        """
        from pyoneai.ml.ransac_model import RANSACPredictionModel
        from pyoneai.ml import ModelConfig

        if self.ndim > 1:
            raise ValueError(
                "Trend function finder requires univariate timeseries"
            )

        if len(self) < self._MIN_OBS_NEEDED_FOR_TREND_FIT:
            raise ValueError(
                "Timeseries too short for trend analysis, the minimum number "
                f"of observations is {self._MIN_OBS_NEEDED_FOR_TREND_FIT}"
            )

        if not self.has_trend:
            return lambda input_time, fitted_origin=None: Timeseries(
                time_idx=input_time,
                metric_idx=self.metrics,
                entity_uid_idx=self.entity_uids,
                data=np.zeros((len(input_time), 1, 1)),
            )
        trend_regression_models = {
            "poly1": "pyoneai.ml.ransac_model.LinearModel",
            "poly2": "pyoneai.ml.ransac_model.QuadraticModel",
            "exp": "pyoneai.ml.ransac_model.ExponentialModel",
        }        

        if methods is None:
            selected_methods = trend_regression_models.values()
        elif isinstance(methods, str):
            selected_methods = [trend_regression_models[methods]]
        elif isinstance(methods, list):
            if not all([method in trend_regression_models.keys() for method in methods]):
                raise ValueError(
                    "Invalid method to fit trend, must be one of: "
                    + ", ".join(trend_regression_models.keys())
                )
            selected_methods = [trend_regression_models[method] for method in methods]
        else:
            raise TypeError(
                "Invalid type of the 'method' argument."
            )

        variate_best_models = RANSACPredictionModel(
            ModelConfig("", 0, compute_ci=False, hyper_params={
                "regression_models": selected_methods,
                "criterion": "mape"
            })
        ).fit(self).variates_best_model
        # TODO: we take just the first one as computing trend is
        # now supported only for univariate timeseries
        trend_func = next(iter(variate_best_models.values()))        

        return lambda input_time, fitted_origin: self._predict_trend(
            input_time, fitted_origin, trend_func
        )
    
    def _predict_trend(
        self,
        input_time: TimeIndex,
        fitted_origin: datetime,
        best_trend_func: List[np.poly1d],
    ) -> Timeseries:
        """Forecast timeseries values by applying the fitted trend model.

        Parameters
        ----------
        input_time : TimeIndex
            The time points to forecast the trend values for
        fitted_origin : datetime
            The origin of the fitted trend model
        best_trend_func : List[np.poly1d]
            The fitted trend model

        Returns
        -------
        Timeseries
            A new timeseries containing the forecasted trend values for the specified time points
        """

        x = input_time.get_time_deltas_from_origin(
            origin=fitted_origin, time_points=input_time.values
        )

        # Apply transformation based on the best method
        y_pred = best_trend_func(x)

        return Timeseries(
            time_idx=input_time,
            metric_idx=self.metrics,
            entity_uid_idx=self.entity_uids,
            data=y_pred.reshape(-1, 1, 1),
        )

    def _detrend(self, trend_func: Optional[Callable[[TimeIndex, datetime], Timeseries]] = None) -> Timeseries:
        """
        Detrend the timeseries by subtracting the trend values.

        Parameters
        ----------
        trend_func : Optional[Callable[[TimeIndex, datetime], Timeseries]], optional
            The trend function to be subtracted from the timeseries, by default None
            resulting in running compute_trend()

        Returns
        -------
        Timeseries
            A new timeseries with the trend values subtracted.
        """
        if trend_func is not None:
            trend_transformer = trend_func
        else:
            trend_transformer = self.compute_trend()

        trend_ts = trend_transformer(
            input_time=self._time_idx, fitted_origin=self._time_idx.origin
        )
        detrended_ts = self - trend_ts

        return detrended_ts

    def _compute_freqs_to_keep_mask(
        self, fft: np.ndarray
    ) -> np.array[np.bool_]:
        """
        Compute the mask of only relevant frequencies based on magnitude.

        Zeros out signals whose magnitude in Fourier spectrum falls
        below 95th percentile.
        """
        _SCREENING_QUANTILE: float = 95.0

        magnitude = np.abs(fft)
        return magnitude > np.percentile(magnitude, _SCREENING_QUANTILE)

    def compute_seasonality(
        self, trend_func : Optional[Callable[[TimeIndex, datetime], Timeseries]] = None
    ) -> Callable[
        [TimeIndex],
        Timeseries,
    ]:
        def _predict_seasonality(
            time_idx: TimeIndex,
        ) -> Timeseries:
            if not isinstance(time_idx, TimeIndex):
                raise TypeError(
                    "Expected object of type TimeIndex but "
                    f"got {type(time_idx).__name__}"
                )
            time_idx_values = time_idx.values
            metric_idx = []
            entity_uid_idx = []
            data = []
            for (
                metric_name,
                entity_uid,
            ), seasonal_seq in _predicted_vals.items():
                if metric_name not in metric_idx:
                    metric_idx.append(metric_name)
                if entity_uid not in entity_uid_idx:
                    entity_uid_idx.append(entity_uid)
                variate_data = []
                for tv in time_idx_values:
                    seq_idx = int(
                        round(
                            (tv - self.time_index[-1])
                            / self._time_idx.frequency
                        )
                    ) % len(seasonal_seq)
                    variate_data.append(seasonal_seq[seq_idx])
                data.append(np.array(variate_data, ndmin=1))
            data = np.array(data).reshape(
                -1, len(metric_idx), len(entity_uid_idx)
            )
            assert data.shape == (
                len(time_idx),
                len(metric_idx),
                len(entity_uid_idx),
            )
            return Timeseries(
                time_idx=time_idx,
                metric_idx=np.array(metric_idx, ndmin=1),
                entity_uid_idx=np.array(entity_uid_idx, ndmin=1),
                data=data,
            )

        _predicted_vals = {}
        for metric_name, entity_uid, ts in self.iter_over_variates():
            detrend = ts._detrend(trend_func)
            fft = np.fft.fft(detrend.values.squeeze())
            freqs_mask = self._compute_freqs_to_keep_mask(fft)
            fft_filtered = np.zeros(len(fft), dtype=np.complex128)
            fft_filtered[freqs_mask] = fft[freqs_mask]
            _predicted_vals[(metric_name, entity_uid)] = np.fft.ifft(
                fft_filtered
            ).real

        return _predict_seasonality

    def autocorrelate(self, lag: int = 1) -> tuple[float]:
        """
        Perform autocorrelation on the timeseries.

        The autocorrelation is computed as Spearman rank
        correlation coefficient between the timeseries and its version 
        lagged by `lag`.
        
        Parameters
        ----------
        lag : int, optional
            The number of lags (greater than 0, 
            smaller than timeseries length) to compute, by default 1

        Returns
        -------
        tu ple[float]
            The autocorrelation value for the specified lag.
        If the timeseries is multivariate, a tuple of values is returned.
        For univariate timeseries, a single-element tuple is returned.

        Raises
        ------
        ValueError
            If lag is not greater than 0 or greater than the 
            length of the timeseries
        """
        if lag <= 0:
            raise ValueError("Lag must be greater than 0")
        if lag > len(self) - 1:
            raise ValueError(
                f"Lag {lag} is greater than the length "
                f"of the timeseries {len(self)} minus one"
            )
        spearman_corr = []
        for _, _, ts in self.iter_over_variates():
            trimmed_ts = Timeseries(
                ts.time_index[:-lag],
                ts.metrics,
                ts.entity_uids,
                data=ts.values[:-lag],
            )
            # NOTE: time index is the same as above, but the data is lagged
            # Spearman correlation requires time indices to be the same
            lagged_ts = Timeseries(
                time_idx=ts.time_index[:-lag],
                metric_idx=ts.metrics,
                entity_uid_idx=ts.entity_uids,
                data=ts.values[lag:],
            )
            spearman_corr.append(
                trimmed_ts.spearman(lagged_ts)
            )
        if len(spearman_corr) == 1:
            return (spearman_corr[0],)
        return tuple(spearman_corr)

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
            if not np.array_equal(self.metrics, other.metrics):
                raise ValueError(
                    "Cannot add timeseries with different metric names"
                )

            # Find union of time indices and sort them
            all_times = np.unique(
                np.concatenate([self._time_idx.values, other._time_idx.values])
            )

            # Create result array filled with NaN
            result_data = np.full(
                (len(all_times), len(self.metrics), len(self._entity_idx)),
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

    def __sub__(self, other: Union[Timeseries, float, int]) -> Timeseries:
        """Subtract another timeseries or a scalar from this timeseries.

        Parameters
        ----------
        other : Union[Timeseries, float, int]
            The timeseries or scalar to subtract.

        Returns
        -------
        Timeseries
            A new timeseries containing the difference.

        Notes
        -----
        When subtracting two timeseries:
        - Time indices are aligned using their union
        - Missing values are filled with NaN
        - Metrics must match between the two timeseries
        """
        if isinstance(other, (float, int)):
            # For scalar subtraction, simply subtract from all values
            return Timeseries(
                time_idx=self._time_idx,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=self._data - other,
            )
        else:
            # Validate metric names match
            if not np.array_equal(self.metrics, other.metrics):
                raise ValueError(
                    "Cannot subtract timeseries with different metric names"
                )

            # Find union of time indices and sort them
            all_times = np.unique(
                np.concatenate([self._time_idx.values, other._time_idx.values])
            )

            # Create result array filled with NaN
            result_data = np.full(
                (len(all_times), len(self.metrics), len(self._entity_idx)),
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
            result_data[other_time_indices] -= other._data

            return Timeseries(
                time_idx=all_times,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=result_data,
            )

    def append(self, other: Timeseries) -> Timeseries:
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
        if not np.array_equal(self.metrics, other.metrics):
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
        time_ms = np.array([int(t.timestamp()) for t in self._time_idx.values])

        # Create dictionary for each metric
        result = {}
        for i, metric_name in enumerate(self.metrics):
            # Get values for this metric (assuming single entity for now)
            values = self._data[:, i, 0]
            # Create timestamp:value mapping
            result[metric_name] = {
                int(t): round(float(v), 2) for t, v in zip(time_ms, values)
            }

        return json.dumps(result, separators=(",", ":"))

    #
    # NumPy Array Interface
    #

    def __array__(self, dtype=None) -> np.ndarray:
        """Convert timeseries to numpy array.

        This method enables NumPy array conversion via np.asarray(timeseries).

        Parameters
        ----------
        dtype : numpy.dtype, optional
            The dtype to cast the data to. If None, keeps original dtype.

        Returns
        -------
        numpy.ndarray
            The timeseries data as a numpy array.
        """
        return self.to_array(dtype=dtype)

    def __array_ufunc__(self, ufunc, method, *inputs, **kwargs):
        """Handle NumPy universal functions.

        This method enables NumPy ufuncs like np.sin, np.exp, etc. to work with Timeseries objects.

        Parameters
        ----------
        ufunc : numpy.ufunc
            The ufunc object that was called.
        method : str
            The method of the ufunc that was called.
        *inputs : tuple
            The input arguments to the ufunc.
        **kwargs : dict
            The keyword arguments to the ufunc.

        Returns
        -------
        Timeseries
            A new timeseries with the ufunc applied to the data.
        """
        if method != "__call__":
            return NotImplemented

        # Convert all inputs to arrays
        arrays = []
        for input_arg in inputs:
            if isinstance(input_arg, Timeseries):
                arrays.append(input_arg.values)
            else:
                arrays.append(input_arg)

        # Apply the ufunc to the arrays (element-wise)
        result = ufunc(*arrays, **kwargs)

        # Return a new Timeseries with the result
        return Timeseries(
            time_idx=self._time_idx,
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=result,
        )

    def __array_function__(self, func, types, args, kwargs):
        """Support for NumPy functions operating on Timeseries objects.

        Parameters
        ----------
        func : callable
            The NumPy function that was called.
        types : tuple
            The types of the arguments.
        args : tuple
            The positional arguments passed to the function.
        kwargs : dict
            The keyword arguments passed to the function.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the function applied to the data, or a scalar if the function
            reduces all dimensions.
        """
        # List of supported NumPy functions
        HANDLED_FUNCTIONS = {
            np.mean,
            np.min,
            np.max,
            np.sum,
            np.std,
            np.var,
            np.median,
            np.percentile,
            np.quantile,
        }

        if func not in HANDLED_FUNCTIONS:
            return NotImplemented

        # Convert Timeseries objects to arrays and handle axis parameter
        array_args = [
            arg.values if isinstance(arg, Timeseries) else arg for arg in args
        ]

        if "axis" in kwargs:
            kwargs["axis"] = self._convert_axis_param(kwargs["axis"])

        # Apply the function to the array data
        result_array = func(*array_args, **kwargs)

        # Return scalar results directly
        if np.isscalar(result_array) or (
            isinstance(result_array, np.ndarray) and result_array.ndim == 0
        ):
            return result_array

        # Get information about which axes were reduced
        axis = kwargs.get("axis", None)
        reduced_axes = self._get_reduced_axes(axis)

        # Create new indices based on reduction
        indices = self._create_indices_for_reduced_result(reduced_axes)

        # Get expected shape based on the new indices
        expected_shape = tuple(len(idx) for idx in indices.values())

        # Reshape the result to match the expected dimensions
        if result_array.ndim != len(expected_shape):
            result_array = self._reshape_array(
                result_array, reduced_axes, expected_shape
            )

        # Return a new Timeseries with the result
        return Timeseries(
            time_idx=indices[Axis.TIME],
            metric_idx=indices[Axis.METRIC].values,
            entity_uid_idx=indices[Axis.ENTITY].values,
            data=result_array,
        )

    def _create_indices_for_reduced_result(self, reduced_axes):
        """Create appropriate indices for a reduced array.

        Parameters
        ----------
        reduced_axes : set
            The set of axes that were reduced

        Returns
        -------
        dict
            A dictionary mapping axis indices to their corresponding index objects
        """
        # Define the dimensions and their corresponding indices
        dimension_indices = {
            Axis.TIME: self._time_idx,
            Axis.METRIC: self._metric_idx,
            Axis.ENTITY: self._entity_idx,
        }

        # Create new indices based on whether each dimension was reduced
        result_indices = {}

        for axis, index in dimension_indices.items():
            if axis in reduced_axes:
                # For reduced dimensions, use a single-element index
                if isinstance(index, TimeIndex):
                    result_indices[axis] = TimeIndex(
                        np.array([index.values[0]])
                    )
                elif isinstance(index, MetricIndex):
                    result_indices[axis] = MetricIndex(
                        np.array([index.values[0]])
                    )
                elif isinstance(index, EntityIndex):
                    result_indices[axis] = EntityIndex(
                        np.array([index.values[0]])
                    )
            else:
                # For preserved dimensions, keep the original index
                result_indices[axis] = index

        return result_indices

    def _reshape_array(self, array, reduced_axes, target_shape):
        """Reshape an array based on which axes were reduced.

        Parameters
        ----------
        array : numpy.ndarray
            The array to reshape
        reduced_axes : set
            The set of axes that were reduced
        target_shape : tuple
            The target shape for all dimensions

        Returns
        -------
        numpy.ndarray
            The reshaped array matching the target shape
        """
        # If array already has the correct number of dimensions, return it
        if array.ndim == len(target_shape):
            return array

        # For arrays with one less dimension than target
        if array.ndim == len(target_shape) - 1:
            # Find which dimension was reduced
            for i, axis in enumerate(sorted(reduced_axes)):
                if i < len(target_shape):
                    # Insert dimension of size 1 at the reduced axis position
                    shape_list = list(array.shape)
                    shape_list.insert(axis, 1)
                    return array.reshape(tuple(shape_list))

        # For arrays with fewer dimensions
        preserved_axes = {i for i in range(len(target_shape))} - reduced_axes

        if len(preserved_axes) == array.ndim:
            # Create a new shape with size 1 for reduced dimensions
            new_shape = [1] * len(target_shape)

            # Map the preserved dimensions to their positions in the result
            for i, preserved_axis in enumerate(sorted(preserved_axes)):
                if i < array.ndim:
                    new_shape[preserved_axis] = array.shape[i]

            return array.reshape(tuple(new_shape))

        # Fallback: reshape to target shape directly
        return array.reshape(target_shape)

    def rate(
        self, metric_name: Union[str, list[str], None] = None
    ) -> Timeseries:
        """Calculate the rate of change between consecutive values, normalized by time.

        The rate is calculated as (value₂ - value₁) / (time₂ - time₁) for each consecutive pair
        of measurements, giving the change per unit time.

        Parameters
        ----------
        metric_name : Union[str, list[str], None], optional
            The name of the metric to calculate the rate for. If None, the rate will be calculated for all metrics.

        Returns
        -------
        Timeseries
            A timeseries with the rate values (change per unit time).

        Examples
        --------
        >>> # Calculate CPU usage rate from CPU time in seconds
        >>> cpu_seconds_ts = Timeseries(...)
        >>> cpu_rate_ts = cpu_seconds_ts.rate("cpu")  # Returns CPU usage per second
        """
        if len(self) < 2:
            raise ValueError(
                "Cannot calculate rate with fewer than 2 time points"
            )

        ts = self[metric_name] if metric_name is not None else self

        time_delta_seconds = ts._time_idx.frequency.total_seconds()

        diff_ts = ts.diff()
        diff_ts._data = diff_ts.values / time_delta_seconds

        return diff_ts

    #
    # Statistical & Numpy Methods
    #

    def diff(self):
        """Calculate the difference between consecutive values along the specified axis.

        Returns
        -------
        Timeseries
            A new timeseries with the difference values.
        """

        # Calculate the differences
        diff_values = np.diff(self.values, axis=0)

        new_time_idx = self.time_index[1:]

        return Timeseries(
            time_idx=new_time_idx,
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=diff_values,
        )

    def min(self, axis=None, keepdims=False):
        """Calculate the minimum value along the specified axis.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None], optional
            Axis or axes along which to operate. By default, flattened input is used.
            Can be specified as:
            - 'time' or Axis.TIME (0): Time axis
            - 'metric' or Axis.METRIC (1): Metric axis
            - 'entity' or Axis.ENTITY (2): Entity axis
            - A tuple/list of the above
        keepdims : bool, optional
            If True, the reduced axes are left in the result as dimensions with size one.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the minimum values, or a scalar if axis=None and keepdims=False.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Minimum across all dimensions
        >>> min_value = ts.min()
        >>> # Minimum across time dimension
        >>> min_over_time = ts.min(axis='time')  # or ts.min(axis=Axis.TIME)
        >>> # Minimum across metric dimension
        >>> min_over_metrics = ts.min(axis='metric')  # or ts.min(axis=Axis.METRIC)
        >>> # Minimum across entity dimension
        >>> min_over_entities = ts.min(axis='entity')  # or ts.min(axis=Axis.ENTITY)
        >>> # Minimum across multiple dimensions
        >>> min_time_metric = ts.min(axis=['time', 'metric'])  # or ts.min(axis=(Axis.TIME, Axis.METRIC))
        """
        axis = self._convert_axis_param(axis)
        return np.min(self, axis=axis, keepdims=keepdims)

    def max(self, axis=None, keepdims=False):
        """Calculate the maximum value along the specified axis.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None], optional
            Axis or axes along which to operate. By default, flattened input is used.
            Can be specified as:
            - 'time' or Axis.TIME (0): Time axis
            - 'metric' or Axis.METRIC (1): Metric axis
            - 'entity' or Axis.ENTITY (2): Entity axis
            - A tuple/list of the above
        keepdims : bool, optional
            If True, the reduced axes are left in the result as dimensions with size one.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the maximum values, or a scalar if axis=None and keepdims=False.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Maximum across all dimensions
        >>> max_value = ts.max()
        >>> # Maximum across time dimension
        >>> max_over_time = ts.max(axis='time')  # or ts.max(axis=Axis.TIME)
        >>> # Maximum across metric dimension
        >>> max_over_metrics = ts.max(axis='metric')  # or ts.max(axis=Axis.METRIC)
        >>> # Maximum across entity dimension
        >>> max_over_entities = ts.max(axis='entity')  # or ts.max(axis=Axis.ENTITY)
        >>> # Maximum across multiple dimensions
        >>> max_time_metric = ts.max(axis=['time', 'metric'])  # or ts.max(axis=(Axis.TIME, Axis.METRIC))
        """
        axis = self._convert_axis_param(axis)
        return np.max(self, axis=axis, keepdims=keepdims)

    def abs(self):
        """Calculate the absolute value of the timeseries.

        Returns
        -------
        Timeseries
            A new timeseries with the absolute values.
        """

        return np.abs(self)

    def mean(self, axis=None, keepdims=False):
        """Calculate the mean value along the specified axis.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None], optional
            Axis or axes along which to operate. By default, flattened input is used.
            Can be specified as:
            - 'time' or Axis.TIME (0): Time axis
            - 'metric' or Axis.METRIC (1): Metric axis
            - 'entity' or Axis.ENTITY (2): Entity axis
            - A tuple/list of the above
        keepdims : bool, optional
            If True, the reduced axes are left in the result as dimensions with size one.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the mean values, or a scalar if axis=None and keepdims=False.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Mean across all dimensions
        >>> mean_value = ts.mean()
        >>> # Mean across time dimension
        >>> mean_over_time = ts.mean(axis='time')  # or ts.mean(axis=Axis.TIME)
        >>> # Mean across metric dimension
        >>> mean_over_metrics = ts.mean(axis='metric')  # or ts.mean(axis=Axis.METRIC)
        >>> # Mean across entity dimension
        >>> mean_over_entities = ts.mean(axis='entity')  # or ts.mean(axis=Axis.ENTITY)
        >>> # Mean across multiple dimensions
        >>> mean_time_metric = ts.mean(axis=['time', 'metric'])  # or ts.mean(axis=(Axis.TIME, Axis.METRIC))
        """
        axis = self._convert_axis_param(axis)
        return np.mean(self, axis=axis, keepdims=keepdims)

    def sum(self, axis=None, keepdims=False):
        """Calculate the sum along the specified axis.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None], optional
            Axis or axes along which to operate. By default, flattened input is used.
            Can be specified as:
            - 'time' or Axis.TIME (0): Time axis
            - 'metric' or Axis.METRIC (1): Metric axis
            - 'entity' or Axis.ENTITY (2): Entity axis
            - A tuple/list of the above
        keepdims : bool, optional
            If True, the reduced axes are left in the result as dimensions with size one.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the sum values, or a scalar if axis=None and keepdims=False.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Sum across all dimensions
        >>> sum_value = ts.sum()
        >>> # Sum across time dimension
        >>> sum_over_time = ts.sum(axis='time')  # or ts.sum(axis=Axis.TIME)
        >>> # Sum across metric dimension
        >>> sum_over_metrics = ts.sum(axis='metric')  # or ts.sum(axis=Axis.METRIC)
        >>> # Sum across entity dimension
        >>> sum_over_entities = ts.sum(axis='entity')  # or ts.sum(axis=Axis.ENTITY)
        >>> # Sum across multiple dimensions
        >>> sum_time_metric = ts.sum(axis=['time', 'metric'])  # or ts.sum(axis=(Axis.TIME, Axis.METRIC))
        """
        axis = self._convert_axis_param(axis)
        return np.sum(self, axis=axis, keepdims=keepdims)

    def sqrt(self):
        """Calculate the square root of the timeseries.

        Returns
        -------
        Timeseries
            A new timeseries with the square root values.
        """
        return np.sqrt(self)

    def std(self, axis=None, keepdims=False, ddof=1):
        """Calculate the standard deviation along the specified axis.

        Parameters
        ----------
        axis : Union[str, int, tuple, list, None], optional
            Axis or axes along which to operate. By default, flattened input is used.
            Can be specified as:
            - 'time' or Axis.TIME (0): Time axis
            - 'metric' or Axis.METRIC (1): Metric axis
            - 'entity' or Axis.ENTITY (2): Entity axis
            - A tuple/list of the above
        keepdims : bool, optional
            If True, the reduced axes are left in the result as dimensions with size one.
        ddof : int, optional
            Means Delta Degrees of Freedom. The divisor used in calculations is N - ddof,
            where N represents the number of elements. By default ddof is 1.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the standard deviation values, or a scalar if axis=None and keepdims=False.

        Examples
        --------
        >>> ts = Timeseries(...)
        >>> # Standard deviation across all dimensions
        >>> std_value = ts.std()
        >>> # Standard deviation across time dimension
        >>> std_over_time = ts.std(axis='time')  # or ts.std(axis=Axis.TIME)
        >>> # Standard deviation across metric dimension
        >>> std_over_metrics = ts.std(axis='metric')  # or ts.std(axis=Axis.METRIC)
        >>> # Standard deviation across entity dimension
        >>> std_over_entities = ts.std(axis='entity')  # or ts.std(axis=Axis.ENTITY)
        >>> # Standard deviation across multiple dimensions
        >>> std_time_metric = ts.std(axis=['time', 'metric'])  # or ts.std(axis=(Axis.TIME, Axis.METRIC))
        """
        axis = self._convert_axis_param(axis)
        return np.std(self, axis=axis, keepdims=keepdims, ddof=ddof)

    def median(self, axis=None, keepdims=False):
        """Calculate the median along the specified axis.

        Parameters
        ----------
        axis : int, str, tuple, None, optional
            Axis along which to operate. Can be 'time'/Axis.TIME, 'metric'/Axis.METRIC, 'entity'/Axis.ENTITY.
        keepdims : bool, optional
            If True, reduced axes are kept with size one.

        Returns
        -------
        Timeseries or scalar
            A new timeseries with the median values, or a scalar if axis=None and keepdims=False.
        """
        axis = self._convert_axis_param(axis)
        return np.median(self, axis=axis, keepdims=keepdims)

    @classmethod
    def _validate_timeseries_for_error(
        cls, predicted: Timeseries, actual: Timeseries
    ) -> tuple:
        """Validate timeseries for error calculation.

        Parameters
        ----------
        predicted : Timeseries
            Predicted/forecasted timeseries
        actual : Timeseries
            Ground truth timeseries

        Returns
        -------
        tuple
            Tuple containing (pred_data, actual_data)

        Raises
        ------
        ValueError
            If validation fails due to different metric names or time indices
        """
        # Validate metric names match
        if not np.array_equal(predicted.metrics, actual.metrics):
            raise ValueError(
                "Cannot compute error between timeseries with different metric names"
            )

        if predicted._time_idx == actual._time_idx:
            return predicted._data, actual._data
        else:
            # Time indices are not equal, raise an error
            raise ValueError(
                "Cannot compute error between timeseries with different time indices"
            )

    @classmethod
    def mae(cls, predicted: Timeseries, actual: Timeseries) -> float:
        """Calculate Mean Absolute Error between predicted and actual timeseries.

        Parameters
        ----------
        predicted : Timeseries
            Predicted/forecasted timeseries
        actual : Timeseries
            Ground truth timeseries

        Returns
        -------
        float
            Mean Absolute Error value
        """
        pred_data, actual_data = cls._validate_timeseries_for_error(
            predicted, actual
        )

        # Calculate difference
        diff = pred_data - actual_data

        # Calculate absolute values
        abs_diff = cls.abs(diff)

        # Calculate mean using the class method
        return float(abs_diff.mean())

    @classmethod
    def mse(cls, predicted: Timeseries, actual: Timeseries) -> float:
        """Calculate Mean Squared Error between predicted and actual timeseries.

        Parameters
        ----------
        predicted : Timeseries
            Predicted/forecasted timeseries
        actual : Timeseries
            Ground truth timeseries

        Returns
        -------
        float
            Mean Squared Error value
        """
        pred_data, actual_data = cls._validate_timeseries_for_error(
            predicted, actual
        )

        diff = pred_data - actual_data

        squared_diff = diff * diff

        return float(squared_diff.mean())

    @classmethod
    def mape(
        cls, predicted: Timeseries, actual: Timeseries, epsilon: float = 1e-6
    ) -> float:
        """Calculate Mean Absolute Percentage Error between predicted and actual timeseries.

        Parameters
        ----------
        predicted : Timeseries
            Predicted/forecasted timeseries
        actual : Timeseries
            Ground truth timeseries
        epsilon : float, optional
            Small constant to add to zero values in actual data to avoid division by zero,
            by default 1e-6

        Returns
        -------
        float
            Mean Absolute Percentage Error value as a percentage (0-100)
        """
        pred_data, actual_data = cls._validate_timeseries_for_error(
            predicted, actual
        )

        zero_mask = actual_data == 0
        if zero_mask.any():
            # Create a copy to avoid modifying the original data
            actual_data = actual_data.copy()
            actual_data[zero_mask] = epsilon

        percentage_errors = cls.abs((actual_data - pred_data) / actual_data)

        return float(percentage_errors.mean() * 100)

    @classmethod
    def rmse(cls, predicted: Timeseries, actual: Timeseries) -> float:
        """Calculate Root Mean Squared Error between predicted and actual timeseries.

        Parameters
        ----------
        predicted : Timeseries
            Predicted/forecasted timeseries
        actual : Timeseries
            Ground truth timeseries

        Returns
        -------
        float
            Root Mean Squared Error value
        """

        mse = cls.mse(predicted, actual)

        return cls.sqrt(mse)

    def var(self, axis=None, keepdims=False, ddof=1):
        """Calculate the variance along the specified axis.

        Parameters
        ----------
        axis : int, str, tuple, None, optional
            Axis along which to operate. Can be 'time'/Axis.TIME, 'metric'/Axis.METRIC, 'entity'/Axis.ENTITY.
        keepdims : bool, optional
            If True, reduced axes are kept with size one.
        ddof : int, optional
            Delta degrees of freedom. Default is 1.

        Returns
        -------
        Timeseries or scalar
            Variance values along the specified axis.

        Examples
        --------
        >>> ts.var()  # Overall variance
        >>> ts.var(axis='metric')  # Variance across metrics
        """
        axis = self._convert_axis_param(axis)
        return np.var(self, axis=axis, keepdims=keepdims, ddof=ddof)

    def quantile(self, q, axis=None, keepdims=False, method="linear"):
        """Compute the q-th quantile along the specified axis.

        Parameters
        ----------
        q : float or array-like
            Quantile(s) to compute, between 0 and 1 inclusive.
        axis : int, str, tuple, None, optional
            Axis along which to operate. Can be 'time'/Axis.TIME, 'metric'/Axis.METRIC, 'entity'/Axis.ENTITY.
        keepdims : bool, optional
            If True, reduced axes are kept with size one.
        method : str, optional
            Interpolation method. Default is 'linear'.

        Returns
        -------
        Timeseries or scalar
            Quantile values along the specified axis.

        Examples
        --------
        >>> ts.quantile(0.5)  # Median (50th percentile)
        >>> ts.quantile([0.25, 0.5, 0.75], axis='time')  # Quartiles over time
        """
        axis = self._convert_axis_param(axis)
        return np.quantile(
            self, q, axis=axis, keepdims=keepdims, method=method
        )

    def _create_reduced_indices(self, axis, result_shape):
        """Create appropriate indices for a reduced array.

        Parameters
        ----------
        axis : int or tuple or None
            The axis or axes along which the reduction was performed.
        result_shape : tuple
            The shape of the resulting array after reduction.

        Returns
        -------
        tuple
            A tuple of (time_idx, metric_idx, entity_idx) for the reduced array.
        """
        # Convert axis to a set of reduced axes for easier handling
        reduced_axes = self._get_reduced_axes(axis)

        # Create dimension indices based on result shape and reduced axes
        indices = []

        # Define the dimensions and their corresponding indices
        dimensions = [
            (Axis.TIME, self._time_idx.values, TimeIndex),
            (Axis.METRIC, self._metric_idx.values, MetricIndex),
            (Axis.ENTITY, self._entity_idx.values, EntityIndex),
        ]

        # Process each dimension
        for i, (dim_axis, values, index_class) in enumerate(dimensions):
            # For dimensions that exist in the result shape
            if i < len(result_shape):
                # If dimension is reduced to size 1, use first value
                if result_shape[i] == 1 and dim_axis in reduced_axes:
                    new_values = np.array([values[0]])
                else:
                    new_values = values
            # For dimensions that don't exist in result shape (fully reduced)
            else:
                new_values = np.array([values[0]])

            # Create the appropriate index object
            indices.append(index_class(new_values))

        return tuple(indices)

    def _get_reduced_axes(self, axis):
        """Get reduced axes based on the input axis.

        Parameters
        ----------
        axis : int or tuple or None
            The axis or axes along which the reduction was performed.

        Returns
        -------
        set
            A set of reduced axes.
        """
        # Get all available axes
        all_axes = {member for member in Axis}

        if axis is None:
            # All axes reduced
            return all_axes
        elif isinstance(axis, tuple):
            # Multiple axes reduced
            return set(axis)
        else:
            # Single axis reduced
            return {axis}

    def plot(
        self,
        *,
        ax=None,
        title: str = "",
        legend: bool = True,
        figsize: tuple[int, int] = (10, 5),
    ):
        """
        Plot the timeseries.

        Parameters
        ----------
        ax : matplotlib.axes.Axes, optional
            The axis to plot on.
        title : str, optional
            The title of the plot.
        legend : bool, optional
            Whether to show the legend.
        figsize : tuple[int, int], optional
            The size of the figure.

        Returns
        -------
        matplotlib.axes.Axes
            The axis on which the plot is drawn."""
        try:
            import matplotlib.pyplot as plt
        except ImportError:
            raise RuntimeError(
                "For plotting, matplotlib must be installed. "
                "Run `pip install pyoneai[plot]`."
            )
        if ax is None:
            _, ax = plt.subplots(figsize=figsize)

        for m_attr, entity_uid, ts in self.iter_over_variates():
            _ = ax.plot(
                self.time_index,
                ts.values.squeeze(),
                label=f"{entity_uid} {m_attr.name}",
            )

        ax.set_title(title)
        ax.grid()
        if fig := ax.get_figure():
            fig.tight_layout()
        if legend:
            ax.legend()
        return ax

    @staticmethod
    def _sliding_window_view_alt(
        array: np.ndarray, window_size: int
    ) -> np.ndarray:
        # NOTE: This is an alternative to
        # numpy.lib.stride_tricks.sliding_window_view, which is not
        # available for `numpy<1.20`.
        stride = array.strides[0]
        strides = (stride, stride)
        shape = (array.size - window_size + 1, window_size)
        return np.lib.stride_tricks.as_strided(
            array, shape=shape, strides=strides, subok=False, writeable=False
        )

    if np.__version__ < '1.20':
        _sliding_window_view = _sliding_window_view_alt
    else:
        _sliding_window_view = np.lib.stride_tricks.sliding_window_view

    # Applies the Hampel Filter for outlier detection and smooths data
    # in place.
    @staticmethod
    def _hampel_filter(
        data: np.ndarray, window_size: int, threshold: float
    ) -> None:
        n_vals = int(window_size)
        n_pads = n_vals // 2
        padded_data = np.pad(
            data,
            pad_width=[n_pads, n_pads],
            mode='constant',
            # TODO: Reconsider the values on the padded positions, i.e.
            # consider using zero or NaN.
            # constant_values=data[[0, -1]]
            constant_values=np.nan
        )
        windows = Timeseries._sliding_window_view(padded_data, n_vals)
        median = np.nanmedian(windows, axis=-1)
        diff = np.abs(data - median)
        # Median absolute deviation.
        # See: https://en.wikipedia.org/wiki/Median_absolute_deviation.
        mad = np.nanmedian(np.abs(windows - median.reshape(-1, 1)), axis=-1)
        bound = 1.4826 * float(threshold) * mad
        mask = (diff > bound) & (mad != 0)
        data[mask] = median[mask]

    def hampel_filter(
        self: _TimeseriesT,
        window_size: int = 5,
        threshold: Union[int, float] = 3.5,
        inplace: bool = True
    ) -> _TimeseriesT:
        full_data = self._data if inplace else self._data.copy()
        _, n_metrics, n_entities = full_data.shape
        for metric_idx in range(n_metrics):
            for entity_idx in range(n_entities):
                data = full_data[:, metric_idx, entity_idx]
                self._hampel_filter(data, window_size, threshold)

        if inplace:
            return self
        return type(self)(
            time_idx=self._time_idx,
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=full_data
        )

    @staticmethod
    def _forward_fill(
        array: np.ndarray, start: Optional[float] = None, inplace: bool = True
    ) -> np.ndarray:
        # NOTE: This method applies backward fill on the NaN values at
        # the beginning of the array and forward fill on the other NaN
        # values.
        nan_mask = np.isnan(array)
        if nan_mask.all() or not nan_mask.any():
            return array if inplace else array.copy()
        not_nan_mask = ~nan_mask

        # The case when the first element of `array` is NaN.
        if nan_mask[0]:
            if start is None:
                start_idx = not_nan_mask.nonzero()[0][0]
                start = array[start_idx]
            if not inplace:
                array = array.copy()
            array[0] = start
            if not_nan_mask[1:].all():
                return array

        idx = np.where(not_nan_mask, np.arange(array.size), 0)
        np.maximum.accumulate(idx, out=idx)
        if not inplace:
            return array[idx]
        array[nan_mask] = array[idx[nan_mask]]
        return array

    def fill_gaps(
        self: _TimeseriesT,
        frequency: int,
        direction: Literal['backward', 'forward'] = 'backward'
    ) -> _TimeseriesT:
        freq = timedelta(seconds=frequency)
        data = self._data
        time_idx = self._time_idx.values
        calc_freq = np.unique(np.diff(time_idx))

        # Regular timeseries.
        if calc_freq.shape == (1,) and calc_freq[0] == freq:
            nan_mask = np.isnan(data)

            # Regular timeseries without missing values.
            if not nan_mask.any():
                return self

            # Regular timeseries with missing values.
            data = data.copy()
            n_entities = self._entity_idx.values.size
            for i, metric_idx in enumerate(self._metric_idx.values.flat):
                if metric_idx.type is MetricType.COUNTER:
                    for j in range(n_entities):
                        # TODO: Make `self._forward_fill` work with 2D
                        # data.
                        self._forward_fill(data[:, i, j])
                elif metric_idx.type is MetricType.GAUGE:
                    data[:, i, :][nan_mask[:, i, :]] = 0.0
                else:
                    raise NotImplementedError()
            return type(self)(
                time_idx=self._time_idx.values,
                metric_idx=self._metric_idx.values,
                entity_uid_idx=self._entity_idx.values,
                data=data
            )

        # Irregular timeseries.
        if direction == 'backward':
            idx = np.arange(
                time_idx[-1], time_idx[0] - freq, -freq, dtype=object
            )
            idx = idx[::-1]
            half_freq = freq / 2
            if time_idx[0] - idx[0] >= half_freq and time_idx.size < idx.size:
                idx = idx[1:]
            idx = idx.reshape(-1, 1)
            # TODO: Check the case when the values are exactly in the
            # middle of an interval.
            mask = (time_idx > idx - half_freq) & (time_idx <= idx + half_freq)
        elif direction == 'forward':
            idx = np.arange(
                time_idx[0], time_idx[-1] + freq, freq, dtype=object
            )
            # Preventing the possibility to have past data with a future
            # timestamp.
            if idx[-1] > time_idx[-1]:
                idx = idx[:-1]
            idx = idx.reshape(-1, 1)
            mask = (time_idx >= idx) & (time_idx < idx + freq)
        else:
            raise ValueError("'direction' must be 'backward' or 'forward'")
        match_idx = mask.argmax(axis=0)
        other_idx = np.setdiff1d(np.arange(idx.size), match_idx)

        all_metric_idxs = self._metric_idx.values
        n_metrics = all_metric_idxs.size
        n_entities = self._entity_idx.values.size
        shape = (idx.size, n_metrics, n_entities)
        result = np.empty(shape=shape, dtype=data.dtype)
        for i, metric_idx in enumerate(all_metric_idxs.flat):
            if metric_idx.type is MetricType.COUNTER:
                result[match_idx, i, :] = data[:, i, :]
                result[other_idx, i, :] = np.nan
                for j in range(n_entities):
                    # TODO: Make `self._forward_fill` work with 2D data.
                    self._forward_fill(result[:, i, j])
            elif metric_idx.type is MetricType.GAUGE:
                result[match_idx, i, :] = data[:, i, :]
                result[other_idx, i, :] = 0.0
            else:
                raise NotImplementedError()

        return type(self)(
            time_idx=TimeIndex(idx.reshape(-1)),
            metric_idx=self._metric_idx.values,
            entity_uid_idx=self._entity_idx.values,
            data=result
        )

    def regress(
        self, other: Timeseries, n_breakpoints: int = 3
    ) -> Callable[[Timeseries], Timeseries]:
        """Perform piecewise linear regression.

        This method fits a piecewise linear regression model
        to the timeseries data.

        Parameters
        ----------
        other : Timeseries
            The timeseries to regress against.
        n_breakpoints : int, optional
            The number of breakpoints to use in the regression model.
            Default is 3.

        Returns
        -------
        Callable[[Timeseries], Timeseries]
            A function that takes a Timeseries and returns the regression result.

        Raises
        ------
        TypeError
            If 'other' is not a Timeseries.
        ValueError
            If the time indices of the two timeseries do not match,
            or if either timeseries has more than one dimension.
        ImportError
            If scipy is not installed, as it is required for regression.
        RuntimeError
            If the optimization fails during regression fitting.
        """
        if not isinstance(other, Timeseries):
            raise TypeError(
                f"Expected 'other' to be a Timeseries, got {type(other)}"
            )
        if not np.array_equal(self._time_idx.values, other._time_idx.values):
            raise ValueError(
                "Timeseries must have the same time index for regression"
            )
        if self.ndim > 1 or other.ndim > 1:
            raise ValueError("Regression is only supported for 1D Timeseries")
        return Timeseries._piecewise_linear_regression(
            self, other, n_breakpoints
        )

    @staticmethod
    def _piecewise_linear_regression(
        t1: Timeseries, t2: Timeseries, n_breakpoints: int
    ) -> Callable[[Timeseries], Timeseries]:
        if importlib.util.find_spec("scipy") is None:
            raise ImportError(
                "For regression, scipy must be installed. "
                "Run `pip install scipy`."
            )
        from scipy.optimize import minimize

        def _plr_eval(x, x_breaks, y_breaks):
            x = np.asarray(x)
            y = np.zeros_like(x, dtype=float)
            for i in range(len(x_breaks) - 1):
                x0, x1 = x_breaks[i], x_breaks[i + 1]
                y0, y1 = y_breaks[i], y_breaks[i + 1]
                mask = (x >= x0) & (x < x1) if i < len(x_breaks) - 2 else (x >= x0) & (x <= x1)
                slope = (y1 - y0) / (x1 - x0)
                y[mask] = y0 + slope * (x[mask] - x0)
            return y

        def _compute_loss(params, x, y, n_knots):
            x_breaks = params[:n_knots]
            y_breaks = params[n_knots:]
            if np.any(np.diff(x_breaks) <= 0):
                return np.inf
            y_pred = _plr_eval(x, x_breaks, y_breaks)
            return np.sum((y - y_pred) ** 2)

        metric_attrs = t1._metric_idx.values
        entity_uid = t1._entity_idx.values
        x = t1.values.squeeze()
        y = t2.values.squeeze()
        sort_idx = np.argsort(x)
        x = x[sort_idx]
        y = y[sort_idx]
        x_min, x_max = np.min(x), np.max(x)
        init_x_breaks = np.linspace(
            x_min + 1e-7, x_max - 1e-7, n_breakpoints + 2
        )
        init_y_breaks = np.interp(init_x_breaks, x, y)
        init_params = np.concatenate([init_x_breaks, init_y_breaks])
        n_knots = n_breakpoints + 2
        result = minimize(
            _compute_loss,
            init_params,
            args=(x, y, n_knots),
            method="Powell",
        )

        if not result.success:
            raise RuntimeError("Optimization failed: " + result.message)

        opt_params = result.x

        def _regress(input: Timeseries) -> Timeseries:
            if not isinstance(input, Timeseries):
                raise TypeError(
                    f"Expected input to be a Timeseries, got {type(input)}"
                )
            if not np.array_equal(
                input.metrics, metric_attrs
            ) or not np.array_equal(input.entity_uids, entity_uid):
                raise ValueError(
                    "Regression was computed for different metrics or entities"
                    " than those in the input timeseries"
                )
            if input.ndim > 1:
                raise ValueError(
                    "Regression is only supported for 1D Timeseries"
                )
            x = input.values.squeeze()
            y_pred = _plr_eval(
                x, opt_params[:n_knots], 
                opt_params[n_knots:]
            )
            return Timeseries(
                time_idx=input._time_idx.values,
                metric_idx=metric_attrs,
                entity_uid_idx=entity_uid,
                data=y_pred.reshape(-1, 1, 1),
            )

        return _regress
