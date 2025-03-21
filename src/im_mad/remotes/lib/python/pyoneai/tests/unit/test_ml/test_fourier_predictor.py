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

from pyoneai.core import EntityType, EntityUID
from pyoneai.core import MetricAttributes
from pyoneai.core import Timeseries
from pyoneai.ml import FourierPredictionModel, ModelConfig
from pyoneai.tests.unit.test_ml.test_predictors_interface import (
    TestPredictionModelInterface,
)

CORRELATION_THRESHOLD = (
    0.8  # Minimum correlation coefficient for pattern matching
)
NOISE_AMPLITUDE = 0.3  # Amplitude of random noise
BASE_SIGNAL_AMPLITUDE = 5.0  # Amplitude of main periodic signal
SIGNAL_OFFSET = 10.0  # Offset to ensure positive values
HOURLY_SAMPLES = 100  # Number of hourly samples for testing
DEFAULT_HORIZON = 24  # Default prediction horizon in hours


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

    @pytest.fixture
    def base_timeseries(self) -> Timeseries:
        """
        Creates a base timeseries with a daily periodic pattern for testing.

        Returns:
            Timeseries: A timeseries object with a simple daily periodic pattern.
        """
        start_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
        time_idx = np.array(
            [start_date + timedelta(hours=i) for i in range(HOURLY_SAMPLES)]
        )
        t = np.arange(HOURLY_SAMPLES)

        # Create basic sinusoidal pattern with daily periodicity
        values = (
            BASE_SIGNAL_AMPLITUDE * np.sin(2 * np.pi * t / 24) + SIGNAL_OFFSET
        )

        return Timeseries(
            time_idx=time_idx,
            metric_idx=np.array([MetricAttributes(name="test_metric")]),
            entity_uid_idx=np.array([EntityUID(EntityType.HOST, "1")]),
            data=values.reshape(-1, 1, 1),
        )

    @pytest.fixture
    def noisy_timeseries(self, base_timeseries: Timeseries) -> Timeseries:
        """
        Creates a noisy version of the base timeseries for testing noise filtering.

        Args:
            base_timeseries: The base timeseries to add noise to.

        Returns:
            Timeseries: A timeseries object with added random noise.
        """
        np.random.seed(42)
        noisy_values = (
            base_timeseries.values.squeeze()
            + NOISE_AMPLITUDE * np.random.randn(HOURLY_SAMPLES)
        )

        return Timeseries(
            time_idx=base_timeseries.time_index,
            metric_idx=base_timeseries.metrics,
            entity_uid_idx=base_timeseries.entity_uids,
            data=noisy_values.reshape(-1, 1, 1),
        )
    
    @pytest.mark.parametrize(
    "create_timeseries",
    ["create_univariate_timeseries", "create_multivariate_timeseries"],
    )
    def test_predict_method(
        self, create_timeseries, prediction_model
    ):
        # Get the actual method from self using the method name string
        ts_creator = getattr(self, create_timeseries)
        ts = ts_creator(100)
        
        # Test prediction for next 24 points
        horizon = 24
        predictions = prediction_model.predict(ts, horizon)
        
        # Basic shape checks
        assert len(predictions) == horizon
        assert predictions.ndim == ts.ndim
        assert predictions.names.tolist() == ts.names.tolist()

        expected_shape = (horizon, len(ts.names), len(ts.entity_uids))
        assert predictions.values.shape == expected_shape

    def test_seasonality_calculation(self, prediction_model, base_timeseries):
        """Test the seasonality calculation using Fourier transforms with a known periodic signal."""
        # Predict next 24 hours
        predictions = prediction_model.predict(
            base_timeseries, DEFAULT_HORIZON
        )

        # Basic checks
        assert len(predictions) == DEFAULT_HORIZON

        # The predictions should follow the same pattern
        next_t = np.arange(HOURLY_SAMPLES, HOURLY_SAMPLES + DEFAULT_HORIZON)
        expected_pattern = (
            BASE_SIGNAL_AMPLITUDE * np.sin(2 * np.pi * next_t / 24)
            + SIGNAL_OFFSET
        )
        pred_values = predictions.values.squeeze()

        correlation = np.corrcoef(expected_pattern, pred_values)[0, 1]
        assert correlation > CORRELATION_THRESHOLD, (
            f"Expected correlation > {CORRELATION_THRESHOLD} with periodic"
            f" signal, got {correlation}"
        )

    def test_frequency_filtering(self, prediction_model, noisy_timeseries):
        """Test that the frequency filtering works correctly by filtering out noise."""
        # Predict next 24 points
        predictions = prediction_model.predict(
            noisy_timeseries, DEFAULT_HORIZON
        )

        # The predictions should be smoother than the input
        def calculate_roughness(signal):
            return np.mean(np.abs(np.diff(signal, n=2)))

        input_roughness = calculate_roughness(
            noisy_timeseries.values.squeeze()
        )
        pred_roughness = calculate_roughness(predictions.values.squeeze())

        assert pred_roughness < input_roughness, (
            "Expected predictions to be smoother than input. Input roughness:"
            f" {input_roughness}, Prediction roughness: {pred_roughness}"
        )
        

    def test_warn_on_unsupported_compute_ci_option(self, model_config):
        model_config.compute_ci = True
        return super()._test_warn_on_unsupported_compute_ci_option(
            FourierPredictionModel, model_config
        )

    def test_frequency_percentile_filtering(self, prediction_model):
        """Test that the frequency filtering correctly applies the 95th percentile threshold."""
        # Create time index
        start_date = datetime(2024, 1, 1, tzinfo=timezone.utc)
        time_idx = np.array(
            [start_date + timedelta(hours=i) for i in range(HOURLY_SAMPLES)]
        )

        # Create a signal with known frequency components
        t = np.arange(HOURLY_SAMPLES)
        # Main signal (large amplitude)
        main_signal = BASE_SIGNAL_AMPLITUDE * np.sin(2 * np.pi * t / 24)
        # Secondary signals (smaller amplitudes)
        noise_signals = []
        for freq in range(1, 21):  # Add 20 different high-frequency components
            noise_signals.append(0.1 * np.sin(2 * np.pi * freq * t))

        # Combine signals and add offset
        combined_signal = (
            main_signal + np.sum(noise_signals, axis=0) + SIGNAL_OFFSET
        )

        # Create timeseries
        ts = Timeseries(
            time_idx=time_idx,
            metric_idx=np.array([MetricAttributes(name="test_metric")]),
            entity_uid_idx=np.array([EntityUID(EntityType.HOST, "1")]),
            data=combined_signal.reshape(-1, 1, 1),
        )

        # Predict next 24 points
        predictions = prediction_model.predict(ts, DEFAULT_HORIZON)
        pred_values = predictions.values.squeeze()

        # The predictions should mainly follow the main signal pattern
        next_t = np.arange(HOURLY_SAMPLES, HOURLY_SAMPLES + DEFAULT_HORIZON)
        expected_pattern = (
            BASE_SIGNAL_AMPLITUDE * np.sin(2 * np.pi * next_t / 24)
            + SIGNAL_OFFSET
        )

        # Calculate correlation with the main pattern
        correlation = np.corrcoef(expected_pattern, pred_values)[0, 1]
        assert correlation > CORRELATION_THRESHOLD, (
            "Expected strong correlation with main frequency component, "
            f"got {correlation}"
        )

        # Verify that high-frequency components are reduced
        def get_frequency_spectrum(signal):
            # Remove mean (DC component) before FFT
            signal_zero_mean = signal - np.mean(signal)
            fft = np.fft.fft(signal_zero_mean)
            return np.abs(fft)

        def count_significant_freqs(spectrum):
            threshold = np.percentile(spectrum, 95)
            return np.sum(spectrum > threshold)

        input_spectrum = get_frequency_spectrum(combined_signal)
        pred_spectrum = get_frequency_spectrum(pred_values)
        
        input_sig_freqs = count_significant_freqs(input_spectrum)
        pred_sig_freqs = count_significant_freqs(pred_spectrum)

        # Predictions should have fewer significant frequencies
        assert pred_sig_freqs < input_sig_freqs, (
            "Expected fewer significant frequencies in predictions. "
            f"Input: {input_sig_freqs}, Predictions: {pred_sig_freqs}"
        )

    def test_basic_univariate_prediction(self, prediction_model):
        # TODO: Implement test for basic univariate prediction
        pass
