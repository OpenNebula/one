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

"""Time index module for timeseries data.

This module provides time-specific indexing functionality for timeseries data,
handling UTC datetime conversions and time range selections.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Union

import numpy as np

from pyoneai.core.time import Instant, Period

from .base import BaseIndex

_DEFAULT_FREQ_SEC = 60


def _to_utc_datetime(dt: Union[str, datetime, np.datetime64]) -> datetime:
    """Convert a datetime or string to UTC datetime.

    Parameters
    ----------
    dt : Union[str, datetime, np.datetime64]
        Input datetime, either as string, datetime object, or numpy.datetime64.
        For strings, both ISO format and basic format are supported.
        If no timezone is specified, UTC is assumed.

    Returns
    -------
    datetime
        UTC datetime with timezone information.

    Examples
    --------
    >>> _to_utc_datetime("2024-01-01T00:00:00Z")
    datetime.datetime(2024, 1, 1, 0, 0, tzinfo=datetime.timezone.utc)
    >>> _to_utc_datetime("2024-01-01T00:00:00+01:00")
    datetime.datetime(2023, 12, 31, 23, 0, tzinfo=datetime.timezone.utc)
    """
    if isinstance(dt, np.datetime64):
        # Convert numpy.datetime64 to datetime with UTC timezone
        return datetime.fromtimestamp(
            dt.astype("datetime64[s]").astype("int"), timezone.utc
        )

    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    if isinstance(dt, str):
        # Parse string to datetime, assuming UTC if no timezone
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except ValueError:
            # If fromisoformat fails, try basic parsing assuming UTC
            dt = datetime.strptime(dt, "%Y-%m-%dT%H:%M:%S").replace(
                tzinfo=timezone.utc
            )

    return dt.astimezone(timezone.utc)


class TimeIndex(BaseIndex):
    """Time-specific index handling for timeseries data.

    This class provides functionality for indexing timeseries data by time,
    supporting both single timestamps and time ranges.

    Parameters
    ----------
    values : numpy.ndarray
        Array of datetime values representing timestamps.

    Raises
    ------
    ValueError
        If the time index contains duplicate timestamps or is not strictly monotonic increasing.
    """

    def __eq__(self, other) -> bool:
        """Check if this TimeIndex is equal to another TimeIndex.

        Two TimeIndex objects are considered equal if they have the same length
        and all their timestamp values are equal.

        Parameters
        ----------
        other : Any
            The object to compare with.

        Returns
        -------
        bool
            True if the TimeIndex objects are equal, False otherwise.
        """
        if not isinstance(other, TimeIndex) or len(self) != len(other):
            return False
            
        if len(self) == 0 and len(other) == 0:
            return True
            
        return np.array_equal(self.values, other.values)

    @property
    def origin(self) -> datetime:
        """Get the origin of the time index.

        Returns
        -------
        datetime
            The origin of the time index.
        """
        return self.get_sliced_index(0)
    
    @property
    def tz(self) -> str:
        """Get the timezone of the time index.

        Returns
        -------
        str
            The timezone of the time index.
        """
        return str(timezone.utc)

    @property
    def frequency(self) -> timedelta:
        """Get the frequency (time difference) between consecutive timestamps.

        Returns
        -------
        timedelta
            The time difference between consecutive timestamps.
            Returns default frequency if the timeseries has 1 or fewer points.
            Returns None if the differences are not constant.
        """
        default_freq = timedelta(seconds=_DEFAULT_FREQ_SEC)
        if len(self.values) <= 1:
            return default_freq

        # Calculate differences between consecutive timestamps
        time_diffs = np.array(
            [t2 - t1 for t1, t2 in zip(self.values[:-1], self.values[1:])]
        )

        # Check if all differences are within 10% of the first difference
        first_diff = time_diffs[0]
        tolerance = first_diff*0.1
        if not np.all([(first_diff - tolerance) <= td <= (first_diff + tolerance) for td in time_diffs]):
            return default_freq

        return first_diff
    
    def as_timestamp(self) -> np.ndarray:
        """Get TimeIndex values as timestamps."""
        return np.array([int(t.timestamp()) for t in self.values])

    def validate(self) -> None:
        """Validate time index has no duplicates and is ordered.

        This method ensures that:
        1. All timestamps are converted to UTC datetime objects
        2. There are no duplicate timestamps
        3. Timestamps are strictly monotonic increasing

        Raises
        ------
        ValueError
            If validation fails due to duplicates or incorrect ordering.
        """

        # The Timeseries time index can be empty
        if len(self.values) == 0:
            return

        # Convert values to UTC datetime if they aren't already
        if not isinstance(self.values[0], datetime):
            self.values = np.array([_to_utc_datetime(t) for t in self.values])

        if not self.is_unique:
            raise ValueError("Time index contains duplicate timestamps")

        if not self.is_monotonic_increasing:
            raise ValueError(
                "Time index must be strictly monotonic increasing"
            )

    def get_loc(self, key: Union[Period, Instant]) -> Union[slice, List[int]]:
        """Get location(s) for the given time key.

        Parameters
        ----------
        key : Union[Period, Instant]
            The time selection:
            - Period: A time range with start and end timestamps
            - Instant: A single timestamp

        Returns
        -------
        Union[slice, List[int]]
            - For Period: slice object representing the time range
            - For Instant: List[int] with indices where the timestamp is found

        Raises
        ------
        ValueError
            If the time selection is out of bounds (before first or after last timestamp).

        Examples
        --------
        >>> idx = TimeIndex(np.array(['2024-01-01', '2024-01-02', '2024-01-03']))
        >>> # Select single timestamp
        >>> idx.get_loc(Instant('2024-01-01'))
        [0]
        >>> # Select time range
        >>> idx.get_loc(Period('2024-01-01', '2024-01-02'))
        [0, 1]
        """
        if isinstance(key, Instant):
            key_val = _to_utc_datetime(key.value)
            # Check if instant is within bounds
            if key_val < self.values[0] or key_val > self.values[-1]:
                raise ValueError("Time selection out of bounds")
            return np.where(self.values == key_val)[0]
        else:
            start_val = _to_utc_datetime(key.start)
            end_val = _to_utc_datetime(key.end)

            # Check if period is within bounds
            if start_val < self.values[0] or end_val > self.values[-1]:
                raise ValueError("Time selection out of bounds")

            mask = (self.values >= start_val) & (self.values <= end_val)
            return np.where(mask)[0]  # Return indices where mask is True

    def get_sliced_index(
        self, selection: Union[int, slice, List[int], np.ndarray]
    ) -> np.ndarray:
        """Get a new time index array based on the selection.

        Parameters
        ----------
        selection : Union[int, slice, List[int], np.ndarray]
            The selection to apply to the time index.

        Returns
        -------
        numpy.ndarray
            Array of datetime64 values for the selected timestamps.

        Examples
        --------
        >>> idx = TimeIndex(np.array(['2024-01-01', '2024-01-02', '2024-01-03']))
        >>> idx.get_sliced_index([0, 1])
        array(['2024-01-01', '2024-01-02'], dtype='datetime64[ns]')
        """
        return self.values[selection]

    def get_time_deltas_from_origin(self, origin: datetime, time_points: np.ndarray) -> np.ndarray:
        """
        Converts datetime arrays to time deltas from a reference origin.

        Parameters
        ----------
        origin : datetime
            The origin of the time index.
        time_points : numpy.ndarray[datetime]
            Array of datetime values.

        Returns
        -------
        numpy.ndarray[np.float64]
            Array of time deltas in seconds from the origin.
        """
        return np.array(list(map(lambda x: x.timestamp() - origin.timestamp(), time_points)))
