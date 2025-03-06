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

"""Index classes for timeseries data.

This module provides the index classes used for organizing and accessing timeseries data
along different dimensions:
- TimeIndex: For time-based indexing
- MetricIndex: For metric name indexing
- EntityIndex: For entity-based indexing
"""

from .entity import EntityIndex
from .metric import MetricIndex
from .time import TimeIndex

__all__ = ["time", "metric", "entity"]
