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

__all__ = ("ArtifactManager",)

import os
import warnings
from dataclasses import asdict
from pathlib import Path
from typing import Union

import yaml

from .base_prediction_model import BasePredictionModel
from .manifest import Manifest
from .model_config import ModelConfig
from .utils import get_class


def _read_manifest(manifest_path: Path) -> Manifest:
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest file '{manifest_path}' doesn't exist."
        )

    with open(manifest_path, "r") as manifest_file_stream:
        manifest_data = yaml.safe_load(manifest_file_stream)
        manifest = Manifest(**manifest_data)

    return manifest


def _get_model_config(manifest_path: Path, manifest: Manifest) -> ModelConfig:
    config_path: Path = Path(manifest.model_configuration_file)
    if not config_path.is_absolute():
        config_path = manifest_path.parent / config_path

    if not config_path.exists():
        raise FileNotFoundError(
            f"Model configuration file '{config_path}' " "doesn't exist."
        )

    with open(config_path, "r") as config_file:
        config_data = yaml.safe_load(config_file)
        config = ModelConfig(**config_data)
    return config


def _maybe_get_checkpoint_path(
    manifest_path: Path, manifest: Manifest
) -> Union[Path, None]:
    checkpoint_path: Union[Path, None] = None
    if manifest.checkpoint_file:
        checkpoint_path = Path(manifest.checkpoint_file)

        if not checkpoint_path.is_absolute():
            checkpoint_path = manifest_path.parent / checkpoint_path

        if not checkpoint_path.exists():
            warnings.warn(
                "Checkpoint path was passed but the file could "
                "not be found. It will be ignored."
            )
    return checkpoint_path


class ArtifactManager:
    """
    Manage saving and loading of predictor models using a manifest file.
    """

    @classmethod
    def save(
        cls,
        model: BasePredictionModel,
        config_path: Union[str, os.PathLike],
        manifest_path: Union[str, os.PathLike],
        checkpoint_path: Union[str, os.PathLike, None] = None,
    ) -> None:
        """
        Save the model configuration, checkpoint, and manifest.

        Parameters
        ----------
        model : BasePredictionModel
            The ML model to save.
        config_path : str or os.PathLike
            Path where the ML model configuration will be saved.
        manifest_path : str or os.PathLike
            Path where the manifest will be saved.
        checkpoint_path : str or os.PathLike or None
            Path where the ML model checkpoint will be saved (default is
            None).
        """
        model.save(config_path, checkpoint_path)

        manifest = Manifest(
            prediction_model_type=f"{model.__class__.__module__}.{model.__class__.__name__}",
            model_configuration_file=Path(config_path),
            checkpoint_file=(
                Path(checkpoint_path)
                if checkpoint_path and os.path.exists(checkpoint_path)
                else None
            ),
        )

        with open(manifest_path, "w") as manifest_file:
            yaml.safe_dump(asdict(manifest), manifest_file)

    @classmethod
    def load(
        cls, manifest_path: Union[str, os.PathLike]
    ) -> BasePredictionModel:
        """
        Load a prediction model using a manifest YAML file.

        Parameters
        ----------
        manifest_path : str or os.PathLike
            Path to the manifest YAML file with model configuration and
            checkpoint information.

        Returns
        -------
        The loaded prediction model.

        Raises
        ------
        FileNotFoundError
            If the manifest or model configuration file doesn't exist
        TypeError
            If the model class is not a subclass of BasePredictionModel
        """
        _manifest_path: Path = Path(manifest_path)
        manifest: Manifest = _read_manifest(_manifest_path)
        config: ModelConfig = _get_model_config(_manifest_path, manifest)
        checkpoint: Union[Path, None] = _maybe_get_checkpoint_path(
            _manifest_path, manifest
        )

        model_cls = get_class(manifest.prediction_model_type)
        if not issubclass(model_cls, BasePredictionModel):
            raise TypeError(
                f"Model class '{manifest.prediction_model_type}' "
                "is not a subclass of BasePredictionModel."
            )
        model_obj = model_cls.load(config, checkpoint)

        return model_obj
