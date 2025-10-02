# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems
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

from pyoneai.ml import ModelConfig, RANSACPredictionModel
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)


class TestRANSACPredictionModel(TestPredictionModelInterface):
    """Test class for RANSACPredictionModel."""

    __test__ = True

    @pytest.fixture
    def model_config(self) -> ModelConfig:
        """
        Returns a model configuration for RANSACPredictionModel.
        """
        return ModelConfig(
            model_class="pyoneai.ml.ransac_model.LinearModel",
            compute_ci=False,
            hyper_params={
                "residual_threshold": None,
                "max_trials": 100,
                "random_state": 0,
            },
            training_params={},
            sequence_length=0,
        )

    @pytest.fixture
    def prediction_model(
        self, model_config: ModelConfig
    ) -> RANSACPredictionModel:
        """Instantiates and returns a model using the configuration."""
        return RANSACPredictionModel(model_config)

    def test_warn_on_unsupported_compute_ci_option(self, model_config):
        model_config.compute_ci = True
        return super()._test_warn_on_unsupported_compute_ci_option(
            RANSACPredictionModel, model_config
        )

    def test_update_model_predict_with_new_metrics(
        self, prediction_model, mocker
    ):
        univ = self.create_univariate_timeseries(10)
        multiv = self.create_multivariate_timeseries(10)

        fit_mock = mocker.patch.object(
            prediction_model,
            "_fit_model_for_univariate_timeseries",
            wraps=prediction_model._fit_model_for_univariate_timeseries,
        )

        prediction_model.fit(univ)
        fit_mock.assert_called_once()

        prediction_model.predict(multiv)
        assert fit_mock.call_count == 2
