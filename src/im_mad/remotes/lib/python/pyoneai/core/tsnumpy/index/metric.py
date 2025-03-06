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

"""Metric index module for timeseries data.

This module provides metric-specific indexing functionality for timeseries data,
handling case-sensitive metric name lookups and selections.
"""

from typing import List, Union

import numpy as np

from .base import BaseIndex


class MetricIndex(BaseIndex[str]):
    """Metric-specific index handling for timeseries data.

    This class handles metric name indexing with case-sensitive matching.
    Metric names must be unique in a case-sensitive manner (e.g., 'cpu' and 'CPU'
    are considered different metrics).

    Parameters
    ----------
    values : numpy.ndarray
        Array of metric names as strings.

    Raises
    ------
    ValueError
        If duplicate metric names are found (case-sensitive comparison).

    Examples
    --------
    >>> metric_idx = MetricIndex(np.array(['cpu', 'CPU', 'memory']))
    >>> metric_idx.get_loc('cpu')  # Returns index for 'cpu'
    0
    >>> metric_idx.get_loc('CPU')  # Returns index for 'CPU'
    1
    >>> metric_idx.get_loc('Cpu')  # Raises KeyError - case sensitive match
    KeyError: "Metric 'Cpu' not found"
    """

    def validate(self) -> None:
        """Validate metric names are unique in a case-sensitive manner.

        This method ensures that:
        1. All values are converted to numpy array of strings
        2. No duplicate metric names exist (case-sensitive comparison)

        Raises
        ------
        ValueError
            If duplicate metric names are found.
        """
        # Ensure we have a numpy array
        if not isinstance(self.values, np.ndarray):
            self.values = np.array(self.values, dtype=str)
        elif isinstance(self.values, np.str_):
            # Handle single string value
            self.values = np.array([str(self.values)], dtype=str)

        # Check for duplicates
        if len(self.values.shape) == 0:
            # Single value case
            self.values = np.array([str(self.values)], dtype=str)
        elif not self.is_unique:
            raise ValueError(
                "Duplicate metric names not allowed (case-sensitive)"
            )

    def get_loc(self, key: Union[str, List[str]]) -> Union[int, List[int]]:
        """Get location(s) for the given metric name(s).

        This method performs case-sensitive matching. For example, 'cpu' and 'CPU'
        are treated as different metrics.

        Parameters
        ----------
        key : Union[str, List[str]]
            Single metric name or list of metric names to locate.

        Returns
        -------
        Union[int, List[int]]
            Index or list of indices where the metric(s) are found.

        Raises
        ------
        KeyError
            If a metric name is not found (case-sensitive match).

        Examples
        --------
        >>> metric_idx = MetricIndex(np.array(['cpu', 'memory', 'disk']))
        >>> # Single metric
        >>> metric_idx.get_loc('cpu')
        0
        >>> # Multiple metrics
        >>> metric_idx.get_loc(['cpu', 'memory'])
        [0, 1]
        >>> # Case-sensitive matching
        >>> metric_idx.get_loc('Cpu')  # Raises KeyError
        KeyError: "Metric 'Cpu' not found"
        """
        if isinstance(key, str):
            # Case-sensitive exact match
            loc = np.where(self.values == key)[0]
            if len(loc) == 0:
                available = "', '".join(self.values)
                raise KeyError(
                    f"Metric '{key}' not found. Available metrics (case-sensitive): '{available}'"
                )
            return loc[0]
        return [self.get_loc(k) for k in key]

    def get_sliced_index(
        self, selection: Union[int, slice, List[int], np.ndarray]
    ) -> np.ndarray:
        """Get a new metric index array based on the selection.

        Parameters
        ----------
        selection : Union[int, slice, List[int], np.ndarray]
            The selection to apply to the metric index.

        Returns
        -------
        numpy.ndarray
            Array of metric names for the selected metrics.

        Examples
        --------
        >>> metric_idx = MetricIndex(np.array(['cpu', 'memory', 'disk']))
        >>> # Single metric
        >>> metric_idx.get_sliced_index(0)
        array(['cpu'], dtype='<U6')
        >>> # Multiple metrics
        >>> metric_idx.get_sliced_index([0, 1])
        array(['cpu', 'memory'], dtype='<U6')
        """
        selected = self.values[selection]
        # Ensure we return a numpy array
        if isinstance(selection, int):
            return np.array([selected], dtype=str)
        return np.array(selected, dtype=str)
