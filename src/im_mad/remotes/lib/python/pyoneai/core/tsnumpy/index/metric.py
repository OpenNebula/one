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
from __future__ import annotations

from typing import List, Union

import numpy as np

from pyoneai.core.metric_types import MetricAttributes

from .base import BaseIndex


class MetricIndex(BaseIndex[MetricAttributes]):
    """Metric-specific index handling for timeseries data.

    This class handles metric attributes indexing with case-sensitive matching.
    Metric names must be unique in a case-sensitive manner (e.g., 'cpu' and 'CPU'
    are considered different metrics).

    Parameters
    ----------
    values : numpy.ndarray
        Array of MetricAttributes.

    Raises
    ------
    ValueError
        If duplicate metric names are found (case-sensitive comparison).

    Examples
    --------
    >>> metric_idx = MetricIndex(np.array([
    ...     MetricAttributes('cpu', type=MetricType.GAUGE, dtype=MetricDType.FLOAT),
    ...     MetricAttributes('CPU', type=MetricType.GAUGE, dtype=MetricDType.FLOAT),
    ...     MetricAttributes('memory', type=MetricType.GAUGE, dtype=MetricDType.FLOAT),
    ... ]))
    >>> metric_idx.get_loc('cpu')  # Returns index for 'cpu'
    0
    >>> metric_idx.get_loc('CPU')  # Returns index for 'CPU'
    1
    >>> metric_idx.get_loc('Cpu')  # Raises KeyError - case sensitive match
    KeyError: "Metric 'Cpu' not found"
    """

    @property
    def names(self) -> np.ndarray[str]:
        """Array of metric names."""
        return np.sort(np.array(list(map(lambda x: x.name, self.values))))

    @property
    def is_unique(self) -> bool:
        """Check if the index contains unique MetricAttributes."""
        return len(set(self.values)) == len(self.values)

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
        self.values = np.array(self.values, ndmin=1)
        if not self.is_unique:
            raise ValueError(
                "Duplicate metric names not allowed (case-sensitive)"
            )

    def get_loc(
        self,
        key: Union[str, List[str], MetricAttributes, List[MetricAttributes]],
    ) -> Union[int, List[int]]:
        """Get location(s) for the given metric attributes or name(s).

        This method performs case-sensitive matching.
        For example, 'cpu' and 'CPU'
        are treated as different metrics.

        Parameters
        ----------
        key : Union[str, List[str], MetricAttributes, List[MetricAttributes]]
            Key to get the location.

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
        >>> metric_idx = MetricIndex(np.array([
        ...     MetricAttributes('cpu'),
        ...     MetricAttributes('memory'),
        ...     MetricAttributes('disk'),
        ... ]))
        >>> # Single metric
        >>> metric_idx.get_loc('cpu')
        0
        >>> metric_idx.get_loc(MetricAttributes('cpu'))
        0
        >>> # Multiple metrics
        >>> metric_idx.get_loc(['cpu', 'memory'])
        [0, 1]
        >>> # Case-sensitive matching
        >>> metric_idx.get_loc('Cpu')  # Raises KeyError
        KeyError: "Metric 'Cpu' not found"
        """
        if isinstance(key, MetricAttributes):
            loc = [i for i, e in enumerate(self.values) if e == key]
            if not loc:
                raise KeyError(f"Metric {key} not found")
            return loc[0]
        elif isinstance(key, str):
            loc = [i for i, e in enumerate(self.values) if e.name == key]
            if not loc:
                raise KeyError(f"Metric '{key}' not found")
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
            return np.array([selected])
        return np.array(selected)
