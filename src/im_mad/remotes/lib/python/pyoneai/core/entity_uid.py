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

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any


class EntityType(Enum):
    HOST = "host"
    VIRTUAL_MACHINE = "virtualmachine"


@dataclass
class EntityUID:
    type: EntityType
    id: int

    def __str__(self) -> str:
        return f"{self.type.value}_{self.id}"

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, EntityUID):
            return False
        return self.type == other.type and self.id == other.id

    def __hash__(self):
        return hash((self.type, self.id))
