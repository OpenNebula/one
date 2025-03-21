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

from typing import TYPE_CHECKING, Union

from .. import ml
from .entity_uid import EntityUID
from .metric import Metric
from .metric_accessor import MetricAccessor
from .metric_types import MetricAttributes
from .predictor_accessor import PredictorAccessor
from .sqlite_accessor import SQLiteAccessor


class Entity:
    """
    Represents an OpenNebula component with a unique identifier, metrics
    monitoring, and an optional AI/ML artifact for predictions.

    Parameters
    ----------
    uid : EntityUID
        Unique identifier for the entity, consisting of type and ID.
    metrics : dict[str, MetricAttributes]
        Dictionary of metric names to their attributes.
    monitoring : dict[str, Union[str, int]]
        Dictionary containing the monitoring configuration.
        - "db_path": Path to the SQLite database.
        - "timestamp_col": Name of the timestamp column.
        - "value_col": Name of the metric value column.
        - "monitor_interval": Interval (seconds) at which the data is stored in the database.
        - "table_name_template": Template for the table name.
    artifact : Union[BasePredictionModel, None], optional
        AI/ML artifact used for metric predictions, by default None.

    Attributes
    ----------
    _uid : EntityUID
        The unique identifier for the entity.
    _obs : SQLiteAccessor
        Accessor for retrieving timeseries data from the SQLite database.
    _pred : Union[PredictorAccessor, int]
        Accessor for making predictions, initialized with the artifact
        or set to Fourier Model if no artifact is provided.
    _metrics : dict[str, Metric]
        Dictionary of metric names to their Metric instances.

    Methods
    -------
    __getitem__(key: str) -> Metric
        Retrieves the Metric associated with the given key.
    """

    def __init__(
        self,
        uid: EntityUID,
        metrics: dict[str, MetricAttributes],
        monitoring: dict[str, Union[str, int]],
        artifact: Union[ml.BasePredictionModel, None] = None,
    ) -> None:

        self._uid = uid

        self._obs = SQLiteAccessor(monitoring)

        if artifact:
            self._pred = PredictorAccessor(artifact)
        else:
            ml_conf = ml.ModelConfig(
                model_class="pyoneai.ml.FourierPredictionModel",
                compute_ci=False,
                hyper_params={"nbr_freqs_to_keep": 40},
                training_params={},
                sequence_length=2,
            )
            self._pred = PredictorAccessor(ml.FourierPredictionModel(ml_conf))

        self._metrics = {}

        for name in metrics:
            self._metrics[name] = Metric(
                entity_uid=self._uid,
                attrs=metrics[name],
                accessor=MetricAccessor(
                    observator_accessor=self._obs,
                    predictor_accessor=self._pred,
                ),
            )

    @property
    def uid(self):
        return self._uid

    @property
    def metrics(self):
        return self._metrics

    def __getitem__(self, key: str) -> Metric:
        if key in self._metrics:
            return self._metrics[key]
        else:
            raise KeyError
