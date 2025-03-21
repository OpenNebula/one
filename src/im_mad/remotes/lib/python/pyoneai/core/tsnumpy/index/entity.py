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

"""Entity index module for timeseries data.

This module provides entity-specific indexing functionality for timeseries data,
handling EntityUID lookups and selections.
"""

from typing import List, Union

import numpy as np

from pyoneai.core.entity_uid import EntityUID

from .base import BaseIndex


class EntityIndex(BaseIndex[EntityUID]):
    """Entity-specific index handling for timeseries data.

    This class handles indexing of entities using EntityUID objects, ensuring
    uniqueness and proper type validation.

    Parameters
    ----------
    values : numpy.ndarray
        Array of EntityUID objects.

    Raises
    ------
    ValueError
        If invalid entity types are found or if there are duplicate entities.
    """

    def validate(self) -> None:
        """Validate entity UIDs are valid and unique.

        This method ensures that:
        1. All values are valid EntityUID objects
        2. No duplicate entities exist (based on type and ID)

        Raises
        ------
        ValueError
            If invalid entity types are found or if there are duplicate entities.
        """
        invalid = [
            i
            for i, e in enumerate(self.values)
            if not isinstance(e, EntityUID)
        ]
        if invalid:
            types = [type(self.values[i]).__name__ for i in invalid]
            raise ValueError(
                f"Invalid entity types at indices {invalid}: {types}"
            )

        if not self.is_unique:
            raise ValueError("Duplicate entities not allowed")

    def get_loc(
        self, key: Union[EntityUID, List[EntityUID]]
    ) -> Union[int, List[int]]:
        """Get location(s) for the given entity key(s).

        Parameters
        ----------
        key : Union[EntityUID, List[EntityUID]]
            Single EntityUID or list of EntityUIDs to locate.

        Returns
        -------
        Union[int, List[int]]
            Index or list of indices where the entity/entities are found.

        Raises
        ------
        KeyError
            If an entity is not found.

        Examples
        --------
        >>> entity_idx = EntityIndex([EntityUID('VM', 1), EntityUID('VM', 2)])
        >>> # Single entity
        >>> entity_idx.get_loc(EntityUID('VM', 1))
        0
        >>> # Multiple entities
        >>> entity_idx.get_loc([EntityUID('VM', 1), EntityUID('VM', 2)])
        [0, 1]
        """
        if isinstance(key, EntityUID):
            loc = [
                i
                for i, e in enumerate(self.values)
                if e.type == key.type and e.id == key.id
            ]
            if not loc:
                raise KeyError(f"Entity {key} not found")
            return loc[0]
        return [self.get_loc(k) for k in key]

    def get_sliced_index(
        self, selection: Union[int, slice, List[int], np.ndarray]
    ) -> np.ndarray:
        """Get a new entity index array based on the selection.

        Parameters
        ----------
        selection : Union[int, slice, List[int], np.ndarray]
            The selection to apply to the entity index.

        Returns
        -------
        numpy.ndarray
            Array of EntityUIDs for the selected entities.

        Examples
        --------
        >>> entity_idx = EntityIndex([EntityUID('VM', 1), EntityUID('VM', 2)])
        >>> # Single entity
        >>> entity_idx.get_sliced_index(0)
        array([EntityUID('VM', 1)], dtype=object)
        >>> # Multiple entities
        >>> entity_idx.get_sliced_index([0, 1])
        array([EntityUID('VM', 1), EntityUID('VM', 2)], dtype=object)
        """
        if isinstance(selection, int):
            return np.array([self.values[selection]])
        return self.values[selection]

    @property
    def is_unique(self) -> bool:
        """Check if the index contains unique entities."""
        entity_pairs = [(e.type, e.id) for e in self.values]
        return len(set(entity_pairs)) == len(entity_pairs)
