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

"""Base module for timeseries indexing.

This module provides the base class for all index types used in timeseries data handling.
"""

from abc import ABC, abstractmethod
from datetime import timedelta
from typing import Any, Generic, List, TypeVar, Union

import numpy as np

T = TypeVar("T")

NO_TIME_SHIFT: timedelta = timedelta(seconds=0)


class BaseIndex(ABC, Generic[T]):
    """Base class for all index types.

    This abstract base class defines the interface for all index implementations
    used in timeseries data handling.

    Parameters
    ----------
    values : numpy.ndarray
        Array of index values of type T.

    Attributes
    ----------
    values : numpy.ndarray
        The underlying array of index values.
    """

    __slots__ = ("values",)

    def __init__(self, values: np.ndarray):
        self.values = values
        self.validate()

    @abstractmethod
    def validate(self) -> None:
        """Validate index-specific integrity constraints.

        This method should be implemented by subclasses to perform
        validation specific to each index type.

        Raises
        ------
        ValueError
            If the index values do not meet the required constraints.
        """
        pass

    @abstractmethod
    def get_loc(self, key: Any) -> Union[int, slice, List[int]]:
        """Get location(s) for the given key.

        Parameters
        ----------
        key : Any
            The key to locate in the index. Type depends on the specific index implementation:
            - TimeIndex: Period or Instant
            - MetricIndex: str or List[str]
            - EntityIndex: EntityUID or List[EntityUID]

        Returns
        -------
        Union[int, slice, List[int]]
            The location(s) where the key was found:
            - int: for single element selections
            - slice: for range selections (TimeIndex only)
            - List[int]: for multiple element selections

        Raises
        ------
        KeyError
            If the key is not found in the index.
        TypeError
            If the key type is not supported by the index.
        """
        pass

    @abstractmethod
    def get_sliced_index(
        self, selection: Union[int, slice, List[int]]
    ) -> np.ndarray:
        """Get a new index array based on the selection.

        This method is used internally by the Timeseries class to maintain proper indexing
        when slicing operations are performed.

        Parameters
        ----------
        selection : Union[int, slice, List[int]]
            The selection to apply:
            - int: single element selection
            - slice: range selection
            - List[int]: multiple element selection

        Returns
        -------
        numpy.ndarray
            A new numpy array containing the selected index values. The type of the elements
            depends on the specific index implementation:
            - TimeIndex: np.datetime64
            - MetricIndex: str
            - EntityIndex: EntityUID
        """
        pass

    def __len__(self) -> int:
        """Get the length of the index.

        Returns
        -------
        int
            Number of elements in the index.
        """
        return len(self.values) if self.values is not None else 1

    @property
    def is_monotonic_increasing(self) -> bool:
        """Flag showing if index is monotonic increasing."""
        if len(self) > 1:
            return bool(np.all(np.diff(self.values) > NO_TIME_SHIFT))
        return True

    @property
    def is_monotonic_decreasing(self) -> bool:
        """Flag showing if index is monotonic decreasing."""
        if len(self) > 1:
            return bool(np.all(np.diff(self.values) < NO_TIME_SHIFT))
        return True

    @property
    def is_unique(self) -> bool:
        """Flag showing if the index values are unique."""
        return len(np.unique(self.values)) == len(self.values)
