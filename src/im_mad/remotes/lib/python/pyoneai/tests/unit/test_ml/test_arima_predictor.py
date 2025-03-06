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

from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)

try:
    import pandas

    __HAS_PANDAS__ = True
except:
    __HAS_PANDAS__ = False


@pytest.mark.skipif(not __HAS_PANDAS__, reason="pandas not installed")
class TestArimaPredictionModel(TestPredictionModelInterface):
    __test__ = True

    @pytest.fixture
    def model_config(self):
        from pyoneai.ml import ModelConfig

        yield ModelConfig(
            model_class="statsmodels.tsa.arima.model.ARIMA",
            hyper_params={
                "order": (0, 0, 0),
                "seasonal_order": (0, 0, 0, 0),
                "enforce_stationarity": True,
                "enforce_invertibility": True,
                "concentrate_scale": False,
                "trend_offset": 1,
            },
            training_params={},
            sequence_length=10,
        )

    @pytest.fixture
    def prediction_model(self, model_config):
        from pyoneai.ml import ArimaPredictionModel
        
        yield ArimaPredictionModel(model_config)

    @pytest.fixture(autouse=True)
    def setup(self):
        pass

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_warn_if_single_element_time_series(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(1)
        with pytest.warns(
            Warning, match=r"Only one historical step is used. Returning the.*"
        ):
            prediction_model.predict(ts)

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_return_lastest_value_for_single_element_time_series(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(1)
        forecast = prediction_model.predict(ts, horizon=1)
        assert np.all(forecast._df.to_numpy() == ts._df.to_numpy())

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_return_lastest_value_for_single_element_time_series_multstep(
        self, prediction_model, create_timeseries
    ):
        ts = getattr(self, create_timeseries)(1)
        forecast = prediction_model.predict(ts, horizon=100)
        assert np.all(forecast._df.to_numpy() == ts._df.to_numpy())
