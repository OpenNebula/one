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

__all__ = ["Instant", "Period"]

from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Union

import numpy as np

_DatetimeT = Union[str, datetime, np.datetime64]
_TimeDeltaT = Union[str, timedelta, np.timedelta64]

_DATE_TIME_END = frozenset(map(str, range(10))) | {"Z", "z"}
_TIME_DELTA_END = frozenset({"W", "w", "D", "d", "h", "m", "s"})


class Instant:
    __slots__ = ("_origin", "_value", "_tz")

    def __init__(
        self,
        value: Union[_DatetimeT, _TimeDeltaT, None] = "0",
        origin: datetime | None = None,
    ) -> None:
        self._origin = _set_origin(origin)
        self._value = _time_stamp(value, self._origin)
        self._tz = timezone.utc

    @property
    def value(self) -> datetime:
        return self._value

    @property
    def origin(self) -> datetime:
        return self._origin

    @property
    def duration(self) -> timedelta:
        return abs(self._value - self._origin)

    @property
    def is_past(self) -> bool:
        return self._value <= self._origin

    @property
    def is_future(self) -> bool:
        return self._value > self._origin

    @property
    def tz(self) -> timezone:
        return self._tz

    @property
    def is_monotonic_increasing(self) -> bool:
        return True

    @property
    def is_unique(self) -> bool:
        return True

    @property
    def values(self) -> np.ndarray:
        return np.array(
            [_time_stamp(self.value, self._origin)], dtype="object"
        )

    def __len__(self) -> int:
        return 1

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Instant):
            return False
        return self.value == other.value


class Period:
    __slots__ = (
        "_origin",
        "_time_index",
        "_start",
        "_end",
        "_resolution",
        "_tz",
    )

    def __init__(
        self, value: slice | np.ndarray, origin: datetime | None = None
    ) -> None:
        self._origin = _set_origin(origin)
        self._tz = timezone.utc
        if isinstance(value, np.ndarray):
            size = len(value)
            if size == 0 or size == 1:
                raise ValueError(
                    "'value' must be a Series representing a time period"
                )
            elif size == 2:
                if value[1] - value[0] == 0:
                    raise ValueError(
                        "'value' for Period should represent a time interval, not"
                        " a single point"
                    )

            self._start, self._end = value[0], value[-1]
            self._resolution = value[1] - value[0]
            self._time_index = value

        elif isinstance(value, slice):
            if value.start is None or value.stop is None or value.step is None:
                raise ValueError(
                    "slice 'value' must have a start, stop, and step"
                )
            self._start = _time_stamp(value.start, self._origin)
            self._end = _time_stamp(value.stop, self._origin)
            if self._start > self._end:
                raise ValueError(
                    "'value' specifies an invalid time range (start > end)"
                )
            if self._start == self._end:
                raise ValueError(
                    "'value' for Period should represent a time interval, not"
                    " a single point"
                )
            if isinstance(value.step, str):
                self._resolution = _parse_timedelta(value.step)
            elif isinstance(value.step, timedelta):
                self._resolution = value.step
            else:
                raise TypeError(f"{value.step} should be string or timedelta")
            self._time_index = np.arange(
                self._start,
                self._end + self._resolution,
                self._resolution,
                dtype="object",
            )
        else:
            raise TypeError(
                "'value' must be a slice or DatetimeIndex representing a time period"
            )

    @classmethod
    def from_instant(cls, instant: Instant) -> Period:
        return cls(
            slice(instant.value, instant.origin, instant.duration),
            origin=instant.origin,
        )

    @property
    def values(self) -> np.ndarray:
        # TODO: Consider renaming this property.
        return self._time_index

    @property
    def start(self) -> timedelta:
        return self._start

    @property
    def end(self) -> datetime:
        return self._end

    @property
    def resolution(self) -> datetime:
        return self._resolution

    @property
    def duration(self) -> timedelta:
        return self._end - self._start

    @property
    def span(self) -> tuple[timedelta, timedelta]:
        return (self._start - self._origin, self._end - self._origin)

    @property
    def origin(self) -> datetime:
        return self._origin

    @property
    def tz(self) -> timezone:
        return self._tz

    @property
    def is_monotonic_increasing(self) -> bool:
        return np.all(self._time_index[:-1] <= self._time_index[1:])

    @property
    def is_unique(self) -> bool:
        return self._time_index.size == np.unique(self._time_index).size

    def __len__(self) -> int:
        return len(self.values)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Period):
            return False
        return (
            self._origin == other._origin
            and np.array_equal(self._time_index, other._time_index)
            and self._start == other._start
            and self._end == other._end
            and self._resolution == other._resolution
            and self._tz == other._tz
        )

    def split(
        self, when: _DatetimeT | None = None
    ) -> tuple[Instant | Period | None, Instant | Period | None]:
        """
        Splits the period into two parts.

        Parameters
        ----------
            when : _InstantT or None, optional
                A datetime-like object specifying the time to split the

        Returns
        -------
            A tuple containing the first and second parts as Instant or
            Period instances, or None if the resulting part is empty.
        """
        if when is None:
            time_stamp = self._origin
        else:
            time_stamp = _assure_time_zone(when)
        time_idx = self._time_index
        sep_idx = np.searchsorted(time_idx, time_stamp, side="right")
        first_part = time_idx[:sep_idx]
        second_part = time_idx[sep_idx:]

        first = (
            None
            if first_part.size == 0
            else (
                Instant(first_part[0], origin=self._origin)
                if first_part.size == 1
                else Period(first_part, origin=self._origin)
            )
        )
        second = (
            None
            if second_part.size == 0
            else (
                Instant(second_part[0], origin=self._origin)
                if second_part.size == 1
                else Period(second_part, origin=self._origin)
            )
        )
        return (first, second)


def _assure_time_zone(ts: datetime) -> datetime:
    # time zone should be UTC
    if ts.tzinfo is not None:
        return ts.astimezone(timezone.utc)
    else:
        return ts.replace(tzinfo=timezone.utc)


def _set_origin(origin: _DatetimeT | None) -> datetime:
    if origin:
        if isinstance(origin, str):
            return datetime.fromisoformat(origin).replace(microsecond=0)
        elif isinstance(origin, datetime):
            return origin.replace(microsecond=0)
        elif isinstance(origin, np.datetime64):
            return (origin.astype("datetime64[s]")).tolist()
    else:
        return datetime.now(timezone.utc).replace(microsecond=0)


def _parse_timedelta(time_str):
    num_part = "".join(filter(lambda c: c.isdigit() or c == "-", time_str))
    unit_part = "".join(filter(str.isalpha, time_str))

    num = int(num_part)

    unit_mapping = {
        "s": timedelta(seconds=num),
        "m": timedelta(minutes=num),
        "h": timedelta(hours=num),
        "d": timedelta(days=num),
    }

    if unit_part in unit_mapping:
        return unit_mapping[unit_part]

    raise ValueError(f"Unsupported time unit: {unit_part}")


def _time_stamp(
    value: Union[_DatetimeT, _TimeDeltaT, Literal[0], None], origin: datetime
) -> datetime:
    if value in {None, 0, "0"}:
        result = _assure_time_zone(origin)
    elif isinstance(value, (datetime, np.datetime64)):
        if isinstance(value, np.datetime64):
            if not np.isnat(value):
                value.isvalue = value.astype(
                    "datetime64[s]"
                ).tolist()  # Convert to seconds
            else:
                raise ValueError(f"{value} is not a time")
        result = _assure_time_zone(
            value.replace(microsecond=0)
        )  # Remove microseconds
    elif isinstance(value, (timedelta, np.timedelta64)):
        result = origin + value
    elif isinstance(value, str):
        # TODO: Use `dateutil` for better checks.
        # (value[-1].isdigit or value.endswith(('Z', 'z'), -1))
        last = value[-1]
        if last in _DATE_TIME_END and len(value) >= 14:
            result = _assure_time_zone(
                datetime.fromisoformat(value).replace(microsecond=0)
            )
        elif last in _TIME_DELTA_END:
            result = origin + _parse_timedelta(value)
        else:
            raise ValueError("'value' is an incorrect string")
    else:
        raise TypeError(
            "'value' must be a datetime-like or timedelta-like object"
        )

    return result.replace(microsecond=0)
