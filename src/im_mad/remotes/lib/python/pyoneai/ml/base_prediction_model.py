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

import os
import warnings
from abc import ABCMeta, abstractmethod
from dataclasses import asdict
import numpy as np
from pathlib import Path
from typing import Any, ClassVar

import yaml

from ..core.time import Period, Instant
from ..core.tsnumpy.timeseries import Timeseries, TimeIndex
from .model_config import ModelConfig
from .utils import get_class


class BasePredictionModel(metaclass=ABCMeta):
    """
    Abstract base class for prediction models.

    It provides an interface to facilitate integration with
    different artificial intelligence frameworks. The base class
    provides a basic implementation for saving a model -
    it saves the configuration YAML file.

    Parameters
    ----------
    model_config : ModelConfig
        The configuration of the model.

    Attributes
    ----------
    model_config : ModelConfig
        The configuration of the model.
    model
        The model used for predictions.
    __SUPPORTS_CI__ : bool
        Whether the model supports confidence intervals, default
        is True
    """

    __SUPPORTS_CI__: ClassVar[bool] = True

    def __init__(self, model_config: ModelConfig):
        self.model_config = model_config
        self.model = None
        if self.model_config.compute_ci and not self.__SUPPORTS_CI__:
            warnings.warn(
                f"Model of type {type(self).__name__} does not "
                "support computation of confidence intervals. "
                "That option will be ignored."
            )

    def init_model(self) -> Any:
        """
        Initialize the model based on the model configuration.

        Returns
        -------
        Any
            An instance of the artificial intelligence method class.
        """
        model_class = get_class(self.model_config.model_class)
        return model_class(**self.model_config.hyper_params)

    def _forecast_time_index(
        self, metric: Timeseries, horizon: int
    ) -> TimeIndex:
        time_index = metric.time_index
        if isinstance(time_index, Instant):
            last_time = time_index.value
        elif isinstance(time_index, Period):
            last_time = time_index.values[-1]
        else:
            raise ValueError("Unknown time index type")
            
        freq = metric._time_idx.frequency
            
        return TimeIndex(np.array(
            [last_time + (i + 1) * freq for i in range(horizon)])
        )


    @abstractmethod
    def fit(
        self,
        metric: Timeseries,
    ) -> BasePredictionModel:
        """
        Train the model using the given metric.

        Parameters
        ----------
        metric : Timeseries
            The metric used to train the model (univariate or
            multivariate).

        Returns
        -------
        BasePredictionModel
            The BasePredictionModel with the model trained.

        Raises
        ------
        NotImplementedError
            This method must be implemented by subclasses.
        """
        raise NotImplementedError

    @abstractmethod
    def predict(self, metric: Timeseries, horizon: int = 1) -> Timeseries:
        """
        Predict future values for the given metric.

        Parameters
        ----------
        metric : Timeseries
            The metric data for generating predictions (univariate or
            multivariate).
        horizon : int
            The number of steps ahead to predict (default is 1).

        Returns
        -------
        Timeseries
            The prediction results of the model.

        Raises
        ------
        NotImplementedError
            This method must be implemented by subclasses.
        """
        raise NotImplementedError

    @classmethod
    @abstractmethod
    def load(
        cls,
        model_config: ModelConfig,
        checkpoint: str | os.PathLike | None = None,
    ) -> BasePredictionModel:
        """
        Load a model based on provided configuration and checkpoint.

        It initializes the model and loads the state from the
        checkpoint if provided.

        Parameters
        ----------
        model_config : ModelConfig
            The model configuration used to load the model.
        checkpoint : str or os.PathLike or None
            A file path to the model's checkpoint from which the model
            state is loaded (default is None).

        Returns
        -------
        BasePredictionModel
            An instance of the BasePredictionModel with the loaded
            model.

        Raises
        ------
        NotImplementedError
            This method must be implemented by subclasses.
        """
        raise NotImplementedError

    def save(
        self,
        model_config_path: os.PathLike | str,
        checkpoint_path: os.PathLike | str | None = None,
    ) -> None:
        """
        Save the model configuration and state.

        The default implementation saves just the model configuration
        YAML file.

        Parameters
        ----------
        model_config_path : os.PathLike or str
            The file path where the model configuration (ModelConfig)
            will be saved.
        checkpoint_path : os.PathLike or str or None
            The file path where the model checkpoint will be saved.
            If None, the model checkpoint will not be saved.
        """
        model_config_file = Path(model_config_path)
        model_config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(model_config_path, "w") as model_config_file:
            yaml.safe_dump(asdict(self.model_config), model_config_file)
