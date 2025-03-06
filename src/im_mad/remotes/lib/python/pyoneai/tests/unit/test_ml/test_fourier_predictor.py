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

import pytest
import numpy as np

from pyoneai.core.entity_uid import EntityType, EntityUID
from pyoneai.core.tsnumpy import Timeseries
from pyoneai.ml import FourierPredictionModel, ModelConfig
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)


class TestFourierPredictionModel(TestPredictionModelInterface):
    """Test class for FourierPredictionModel."""

    __test__ = True

    @pytest.fixture
    def model_config(self) -> ModelConfig:
        """
        Returns a model configuration for FourierPredictionModel.
        """
        return ModelConfig(
            model_class="pyoneai.ml.FourierPredictionModel",
            compute_ci=False,
            hyper_params={"nbr_freqs_to_keep": 40},
            training_params={},
            sequence_length=2,
        )

    @pytest.fixture
    def prediction_model(
        self, model_config: ModelConfig
    ) -> FourierPredictionModel:
        """Instantiates and returns a model using the configuration."""
        return FourierPredictionModel(model_config)

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_keep_all_freqs_for_too_short_timeseries(
        self, create_timeseries, prediction_model
    ):
        ts = getattr(self, create_timeseries)(10)
        # For multivariate timeseries, we need to select a single metric
        if ts.ndim > 1:
            ts = ts[ts.names[0]]
        assert prediction_model._get_freqs_to_keep(ts) == len(ts)

    @pytest.mark.parametrize(
        "create_timeseries",
        ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_keep_some_freqs_for_long_timeseries(
        self, create_timeseries, prediction_model
    ):
        ts = getattr(self, create_timeseries)(100)
        # For multivariate timeseries, we need to select a single metric
        if ts.ndim > 1:
            ts = ts[ts.names[0]]
        assert prediction_model._get_freqs_to_keep(ts) == 40

    def test_detrend_produces_timeseries(self, prediction_model):
        ts = self.create_univariate_timeseries(10)
        detrend_ts = prediction_model._detrend(ts, lambda x: x)
        assert isinstance(detrend_ts, Timeseries)

    def test_detrend_produces_ts_of_the_same_length(self, prediction_model):
        ts = self.create_univariate_timeseries(10)
        detrend_ts = prediction_model._detrend(ts, lambda x: x)
        assert len(detrend_ts) == len(ts)

    def test_warn_on_unsupported_compute_ci_option(self, model_config):
        model_config.compute_ci = True
        return super()._test_warn_on_unsupported_compute_ci_option(
            FourierPredictionModel, model_config
        )
