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
from datetime import datetime
from typing import Union

import numpy as np

from .time import Instant, Period
from .tsnumpy.index.time import TimeIndex


def _ensure_datetime_array(
    time_idx: Union[
        datetime, np.ndarray[datetime], Period, Instant, TimeIndex
    ],
) -> np.ndarray[datetime]:
    """
    Validate types and return numpy.array of datetime objects.
    """
    if isinstance(time_idx, datetime):
        time_idx = np.array([time_idx])
    elif isinstance(time_idx, (Instant, Period, TimeIndex)):
        time_idx = time_idx.values
    elif isinstance(time_idx, np.ndarray):
        if not all(isinstance(x, datetime) for x in time_idx):
            raise TypeError(
                "Items of np.ndarray needs to be of " "datetime type"
            )
    else:
        raise TypeError(
            "Expected object of type [datetime, "
            "np.ndarray[datetime], Period, Instant, TimIndex] but "
            f"got {type(time_idx).__name__}"
        )
    return time_idx
