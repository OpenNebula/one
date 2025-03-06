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

try:
    import statsmodels
except ImportError:
    pass
else:
    from .arima_prediction_model import ArimaPredictionModel

from .artifact_manager import ArtifactManager
from .base_prediction_model import BasePredictionModel
from .fourier_prediction_model import FourierPredictionModel
from .persistence_prediction_model import PersistencePredictionModel

try:
    import sklearn
except ImportError:
    pass
else:
    from .hgbt_prediction_model import HgbtPredictionModel

from .manifest import Manifest
from .model_config import ModelConfig
