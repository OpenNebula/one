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

from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from pyoneai.core import Instant, Period

_INSTANT = {
    "datetime_str": ["2024-07-04T10+00:00", "2024-07-04T12:00:00+02:00"],
    "datetime": [
        datetime(2024, 7, 4, 10, 0, tzinfo=timezone.utc),
        datetime(2024, 7, 4, 12, 0, tzinfo=timezone(timedelta(hours=2))),
    ],
    "timedelta_str": ["-15m", "15m", "-2h", "1h"],
    "timedelta": [
        timedelta(minutes=15),
        timedelta(minutes=-15),
        timedelta(hours=2),
        timedelta(hours=-1),
    ],
}

_PERIOD = {
    "string": [
        slice("2024-07-04T10+00:00", "2024-07-04T15+00:00", "1h"),
        slice("-150m", "150m", "30m"),
    ],
    "datetime": [
        np.arange(
            start=datetime(2024, 7, 4, 10, 0, tzinfo=timezone.utc),
            stop=datetime(2024, 7, 4, 12, 0, tzinfo=timezone.utc),
            step=timedelta(minutes=30),
            dtype=object,
        )
    ],
}


class TestInstant:
    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        self.now = datetime(2024, 7, 4, 12, 30, tzinfo=timezone.utc)

    @pytest.mark.parametrize("value", _INSTANT["datetime_str"])
    def test_init_from_datetime_string(self, value):
        instant = Instant(value=value, origin=self.now)
        assert isinstance(instant.value, datetime)
        assert datetime.fromisoformat(value) == instant.value
        assert isinstance(instant.origin, datetime)
        assert instant.origin == self.now
        assert isinstance(instant.duration, timedelta)
        assert instant.tz == timezone.utc

    @pytest.mark.parametrize("value", _INSTANT["datetime"])
    def test_init_from_datetime(self, value):
        instant = Instant(value=value, origin=self.now)
        assert isinstance(instant.value, datetime)
        assert value == instant.value
        assert isinstance(instant.origin, datetime)
        assert instant.origin == self.now
        assert isinstance(instant.duration, timedelta)

    @pytest.mark.parametrize("value", _INSTANT["timedelta_str"])
    def test_init_from_timedelta_string(self, value):
        instant = Instant(value=value, origin=self.now)
        assert isinstance(instant.value, datetime)
        assert isinstance(instant.origin, datetime)
        assert instant.origin == self.now
        assert isinstance(instant.duration, timedelta)

    @pytest.mark.parametrize("value", _INSTANT["timedelta"])
    def test_init_from_timedelta(self, value):
        timestamp = self.now + value
        instant = Instant(value=value, origin=self.now)
        assert isinstance(instant.value, datetime)
        assert instant.value == timestamp
        assert isinstance(instant.origin, datetime)
        assert instant.origin == self.now
        assert isinstance(instant.duration, timedelta)

    def test_init_from_none(self):
        instant = Instant()
        assert isinstance(instant.value, datetime)
        assert instant.value == instant.origin
        instant = Instant(value=self.now, origin=None)
        assert isinstance(instant.origin, datetime)
        instant = Instant(origin=self.now)
        assert isinstance(instant.value, datetime)
        instant = Instant(datetime.now())
        assert isinstance(instant.value, datetime)

    def test_incorrect_init(self):
        period = slice(None)
        with pytest.raises(TypeError):
            Instant(value=period, origin=self.now)
        incorrect_str = "fake date"
        with pytest.raises(ValueError):
            Instant(value=incorrect_str, origin=self.now)
        nat_datetime = np.datetime64("NaT")
        with pytest.raises(ValueError):
            Instant(value=nat_datetime, origin=self.now)


class TestPeriod:
    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        self.now = datetime(2024, 7, 4, 12, 30, tzinfo=timezone.utc)

    @pytest.mark.parametrize("value", _PERIOD["string"] + _PERIOD["datetime"])
    def test_init_from_string(self, value):
        period = Period(value=value, origin=self.now)
        assert isinstance(period.origin, datetime)
        assert period.origin == self.now
        assert isinstance(period.start, datetime)
        assert isinstance(period.end, datetime)
        assert isinstance(period.resolution, timedelta)
        assert isinstance(period.values, np.ndarray)
        assert isinstance(period.duration, timedelta)
        duration = period.end - period.start
        assert period.duration == duration
        assert isinstance(period.span, tuple)
        assert all(isinstance(t, timedelta) for t in period.span)

    def test_incorrect_init(self):
        value = slice(None)
        with pytest.raises(ValueError):
            Period(value=value, origin=self.now)
        timestamp = self.now
        with pytest.raises(TypeError):
            Period(value=timestamp, origin=self.now)
        td = timedelta(minutes=-150)
        with pytest.raises(TypeError):
            Period(value=td, origin=self.now)
        dt = datetime.fromisoformat("2024-07-04T12:00:00+02:00")
        with pytest.raises(TypeError):
            Period(value=dt, origin=self.now)
        str_instant = "0"
        with pytest.raises(TypeError):
            Period(value=str_instant, origin=self.now)

    def test_init_from_start_greater_than_stop(self):
        value = slice("2024-07-04T15+00:00", "2024-07-04T10+00:00", "30m")
        with pytest.raises(ValueError):
            time_idx = Period(value)  # noqa: F841

    def test_split(self):
        period = Period(
            value=slice("2024-07-04T10+00:00", "2024-07-04T15+00:00", "30m"),
            origin="2024-07-04T12+00:00",
        )
        past, future = period.split(
            when=datetime(2024, 7, 4, 13, 0, tzinfo=timezone.utc)
        )
        assert past.start == datetime(2024, 7, 4, 10, 0, tzinfo=timezone.utc)
        assert past.end == datetime(2024, 7, 4, 13, 0, tzinfo=timezone.utc)
        assert past.resolution == timedelta(minutes=30)
        assert future.start == datetime(
            2024, 7, 4, 13, 30, 0, tzinfo=timezone.utc
        )
        assert future.end == datetime(2024, 7, 4, 15, 0, tzinfo=timezone.utc)
        assert future.resolution == timedelta(minutes=30)

    def test_split_default(self):
        period = Period(
            value=slice("2024-07-04T10+00:00", "2024-07-04T15+00:00", "30m"),
            origin="2024-07-04T12+00:00",
        )
        past, future = period.split()
        assert past.start == datetime(2024, 7, 4, 10, 0, tzinfo=timezone.utc)
        assert past.end == datetime(2024, 7, 4, 12, 0, tzinfo=timezone.utc)
        assert past.resolution == timedelta(minutes=30)
        assert future.start == datetime(
            2024, 7, 4, 12, 30, tzinfo=timezone.utc
        )
        assert future.end == datetime(2024, 7, 4, 15, tzinfo=timezone.utc)
        assert future.resolution == timedelta(minutes=30)
