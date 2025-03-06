import pytest

from pyoneai.ml import ModelConfig, PersistencePredictionModel
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)


class TestPersistencePredictionModel(TestPredictionModelInterface):
    """
    Test class for PersistencePredictionModel.

    Provides pytest fixtures to configure and instantiate a persistence prediction model.
    """

    __test__ = True

    @pytest.fixture
    def model_config(self) -> ModelConfig:
        """
        Returns a model configuration for PersistencePredictionModel.
        """
        return ModelConfig(
            model_class="pyoneai.ml.PersistencePredictionModel",
            compute_ci=False,
            hyper_params={},
            training_params={},
            sequence_length=2,
        )

    @pytest.fixture
    def prediction_model(
        self, model_config: ModelConfig
    ) -> PersistencePredictionModel:
        """
        Instantiates and returns a PersistencePredictionModel using the provided model configuration.
        """
        return PersistencePredictionModel(model_config)

    def test_warn_on_unsupported_compute_ci_option(self, model_config):
        model_config.compute_ci = True
        return super()._test_warn_on_unsupported_compute_ci_option(
            PersistencePredictionModel, model_config
        )
