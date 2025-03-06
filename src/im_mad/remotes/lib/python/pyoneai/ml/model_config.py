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

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class ModelConfig:
    """
    The class with prediction model configuration.
    
    Attibutes
    ---------
    model_class : str
        The fully qualified name of the model class.
    sequence_length : int
        The length of the input sequence needed by the model.
    compute_ci : bool
        If confidence intervals should be computed (if supported by 
        the model_class, default is True).
    hyper_params : dict
        The hyper parameters of the model.
    training_params : dict
        The training parameters of the model.
    """
    model_class: str
    sequence_length: int
    compute_ci: bool = True
    hyper_params: Dict[str, Any] = field(default_factory=dict)
    training_params: Dict[str, Any] = field(default_factory=dict)
