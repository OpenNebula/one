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
import argparse
import os
import sys
import time
import xml.etree.ElementTree as ET
from collections import defaultdict
from dataclasses import dataclass
from datetime import timedelta
from functools import wraps
from typing import Dict, Optional, Tuple, Union

try:
    import numpy as np
    import yaml

    from pyoneai.core import (
        Entity,
        EntityType,
        EntityUID,
        Float,
        Instant,
        MetricAttributes,
        MetricType,
        Period,
        UInt,
    )
    from pyoneai.ml import ArtifactManager, BasePredictionModel
except ImportError as e:
    print(f"Error: {e} ({type(e).__name__})", file=sys.stderr)
    sys.exit(0)

# ########################
# Type Aliases
# ########################
Minutes = int
Weeks = int
Seconds = int


# ########################
# Decorators
# ########################
def suppress_and_exit(func):
    """
    suppress_and_exit specified error types and print a message to stderr.
    """

    @wraps(func)
    def _inner(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
            sys.exit(0)

    return _inner


# ########################
# Utility classes
# ########################
@dataclass
class EntityDTO:
    type: str
    id: int
    uuid: str
    db_dir: str

    def __post_init__(self):
        self.type = self.type.lower()
        if self.type not in ["host", "virtualmachine"]:
            raise ValueError(
                f"Invalid entity type: {self.type}. "
                "Must be 'host' or 'virtualmachine'."
            )

    @classmethod
    def from_string(cls, entity_str: str):
        try:
            type, id, uuid, db_dir = entity_str.strip().split(",")
            if type == "host":
                db_dir = os.path.join(db_dir, "host.db")
            elif type == "virtualmachine":
                db_dir = os.path.join(db_dir, f"{id}.db")
            else:
                raise argparse.ArgumentTypeError(
                    f"Invalid entity type: {type}. "
                    "Must be 'host' or 'virtualmachine'."
                )
            return cls(type=type, id=int(id), uuid=uuid, db_dir=db_dir)
        except ValueError:
            raise argparse.ArgumentTypeError(
                f"Invalid entity string format: {entity_str}"
            )


class ForecastConfig:
    enabled: bool = True
    period: timedelta
    lookback: Optional[timedelta] = None

    def __init__(
        self,
        enabled: bool = True,
        period: Minutes = 15,
        lookback: Optional[Minutes] = 60,
    ):
        self.enabled = enabled
        self.period = timedelta(minutes=period)
        self.lookback = (
            timedelta(minutes=lookback) if lookback is not None else None
        )

    @classmethod
    def from_dict(cls, config_dict: Optional[dict]):
        if config_dict is None:
            return cls(enabled=False)
        return cls(
            enabled=config_dict.get("enabled", True),
            period=config_dict.get("period", 15),
            lookback=config_dict.get("lookback", 60),
        )


@dataclass
class EntityConfig:
    db_retention: timedelta
    forecast: ForecastConfig
    forecast_far: ForecastConfig

    @classmethod
    def from_yaml(cls, yaml_file: str, entity_type: str):
        with open(yaml_file, "r") as f:
            config_dict = yaml.safe_load(f)[entity_type]
        return cls(
            db_retention=timedelta(weeks=config_dict.get("db_retention", 4)),
            forecast=ForecastConfig.from_dict(config_dict.get("forecast", {})),
            forecast_far=ForecastConfig.from_dict(
                config_dict.get("forecast_far", {})
            ),
        )


@dataclass
class MonitorConfig:
    interval: timedelta

    @classmethod
    def from_conf(cls, config_file: str, entity_type: str):
        monitor_probes = {}

        try:
            root = ET.parse(config_file).getroot()
            probes_period = root.find("PROBES_PERIOD")
        except FileNotFoundError:
            probes_period = None

        if probes_period is not None:
            monitor_probes = {
                child.tag: int(child.text)
                for child in probes_period
                if child.text is not None
            }

        if entity_type == "host":
            return cls(
                interval=timedelta(
                    seconds=monitor_probes.get(
                        "MONITOR_HOST", DB_MONITOR_INTERVAL_DEFAULT["host"]
                    )
                )
            )
        elif entity_type == "virtualmachine":
            return cls(
                interval=timedelta(
                    seconds=monitor_probes.get(
                        "MONITOR_VM",
                        DB_MONITOR_INTERVAL_DEFAULT["virtualmachine"],
                    )
                )
            )
        else:
            raise ValueError(
                f"Invalid entity type: {entity_type}. "
                "Must be 'host' or 'virtualmachine'."
            )


# ########################
# Argument Parsing (CLI)
# ########################
@suppress_and_exit
def parse_args():
    parser = argparse.ArgumentParser(description="Prediction probe")

    parser.add_argument(
        "--entity",
        type=EntityDTO.from_string,
        required=True,
        help="Specify an entity in the format 'type,id,uid,db_dir'.",
    )

    parser.add_argument(
        "--pythonpath",
        type=str,
        required=True,
        help="Specify the path to python libs and configs",
    )

    return parser.parse_args()


# ########################
# Utility Functions
# ########################
def _get_horizon(period: timedelta, resolution: timedelta):
    horizon = int(period / resolution)
    if horizon == 1:
        return Instant(resolution)
    return Period(slice(resolution, resolution * horizon, resolution))


def _create_entity(
    entity: EntityDTO,
    monitor_config: MonitorConfig,
    metrics: Dict[str, MetricAttributes],
    artifact: BasePredictionModel,
) -> Entity:
    return Entity(
        uid=EntityUID(type=EntityType(entity.type), id=entity.id),
        metrics=metrics,
        monitoring={
            "db_path": entity.db_dir,
            "monitor_interval": monitor_config.interval.seconds,
        },
        artifact=artifact,
    )


def _is_time_slot_eligible(
    monitor_interval: timedelta, forecast_period: timedelta, entity: Entity
) -> bool:
    available_slots = forecast_period // monitor_interval
    current_slot = (
        int(time.time()) // monitor_interval.seconds
    ) % available_slots
    entity_slot = int(entity.uid.id) % available_slots
    return current_slot == entity_slot


# ########################
# Configuration
# ########################
# Defaults
DB_MONITOR_INTERVAL_DEFAULT: dict[str, Seconds] = {
    "host": 120,
    "virtualmachine": 30,
}

# Metrics definitions
HOST_METRICS = {
    "usedcpu": MetricAttributes(
        name="usedcpu",
        type=MetricType.GAUGE,
        dtype=Float(0.0, np.inf),
    ),
    "freecpu": MetricAttributes(
        name="freecpu", type=MetricType.GAUGE, dtype=Float(0.0, np.inf)
    ),
    "usedmemory": MetricAttributes(
        name="usedmemory", type=MetricType.GAUGE, dtype=UInt()
    ),
    "freememory": MetricAttributes(
        name="freememory", type=MetricType.GAUGE, dtype=UInt()
    ),
    "netrx_bw": MetricAttributes(
        name="netrx",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
    "nettx_bw": MetricAttributes(
        name="nettx",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
}

VM_METRICS = {
    "cpu": MetricAttributes(
        name="cpu", type=MetricType.GAUGE, dtype=Float(0.0, np.inf)
    ),
    "memory": MetricAttributes(
        name="memory", type=MetricType.GAUGE, dtype=UInt()
    ),
    "netrx_bw": MetricAttributes(
        name="netrx",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
    "nettx_bw": MetricAttributes(
        name="nettx",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
    "diskrdbytes_bw": MetricAttributes(
        name="diskrdbytes",
        type=MetricType.COUNTER,
        dtype=UInt(),
        operator="rate",
    ),
    "diskwrbytes_bw": MetricAttributes(
        name="diskwrbytes",
        type=MetricType.COUNTER,
        dtype=UInt(),
        operator="rate",
    ),
    "diskrdiops_bw": MetricAttributes(
        name="diskrdiops",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
    "diskwriops_bw": MetricAttributes(
        name="diskwriops",
        type=MetricType.COUNTER,
        dtype=Float(0.0, np.inf),
        operator="rate",
    ),
    # GPU metrics
    "gpu_utilization": MetricAttributes(
        name="gpuutilization",
        type=MetricType.GAUGE,
        dtype=Float(0.0, 100.0)
    ),
    "gpu_memory_utilization": MetricAttributes(
        name="gpumemoryutilization",
        type=MetricType.GAUGE,
        dtype=Float(0.0, 100.0)
    ),
    "gpu_memory_free": MetricAttributes(
        name="gpumemoryfree",
        type=MetricType.GAUGE,
        dtype=Float(0.0, np.inf)
    ),
    "gpu_power_usage": MetricAttributes(
        name="gpupowerusage",
        type=MetricType.GAUGE,
        dtype=Float(0.0, np.inf)
    )
}

DERIVED_METRICS = [
    "netrx_bw",
    "nettx_bw",
    "diskrdbytes_bw",
    "diskwrbytes_bw",
    "diskrdiops_bw",
    "diskwriops_bw",
]

# Path constants
FORECAST_CONFIG_FILE = "/var/tmp/one/etc/im/kvm-probes.d/forecast.conf"
ENTITIES_CONFIG_FILE = "/var/tmp/one_db/config"

# ########################
# Main functions
# ########################


@suppress_and_exit
def configure(
    entity_dto: EntityDTO, pythonpath: str
) -> Tuple[EntityConfig, MonitorConfig, Entity]:
    # 1. Load the configuration
    config: EntityConfig = EntityConfig.from_yaml(
        FORECAST_CONFIG_FILE, entity_type=entity_dto.type
    )

    if not config.forecast.enabled and not config.forecast_far.enabled:
        raise RuntimeError(
            "Forecast is not enabled for this entity type. "
            "Check the configuration file: {}".format(FORECAST_CONFIG_FILE)
        )

    # 2. Load the monitor intervals
    monitor_config: MonitorConfig = MonitorConfig.from_conf(
        ENTITIES_CONFIG_FILE, entity_type=entity_dto.type
    )

    # 3. Load artifact
    artifact = ArtifactManager.load(
        os.path.join(pythonpath, "models", "default", "manifest.yaml")
    )

    # 4. Create the entity
    entity = _create_entity(
        entity=entity_dto,
        monitor_config=monitor_config,
        metrics=HOST_METRICS if entity_dto.type == "host" else VM_METRICS,
        artifact=artifact,
    )
    return config, monitor_config, entity


def run_forecast(
    entity: Entity,
    db_retention: timedelta,
    period: timedelta,
    lookback: Optional[timedelta],
    resolution: timedelta,
    compute_obs: bool = False,
    suffix: str = "FORECAST",
):
    if lookback is None:
        sequence_length = db_retention / resolution
    else:
        sequence_length = lookback / resolution

    horizon: Union[Instant, Period] = _get_horizon(period, resolution)

    results = defaultdict(dict)
    for name, metric in entity.metrics.items():
        try:
            entity._pred._prediction_model.model_config.sequence_length = (
                int(sequence_length)
            )
            forecast = metric[horizon].values[-1][0][0]
            forecast = round(forecast, 2)
            results[f"{name.upper()}_{suffix}"] = forecast
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
        if not (name in DERIVED_METRICS and compute_obs):
            continue
        try:
            query_period = Period(
                slice(
                    horizon.origin - resolution,
                    horizon.origin,
                    resolution,
                )
            )
            observation = metric[query_period].values[-1][0][0]
            observation = round(observation, 2)
            results[name.upper()] = observation
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")

    return results


@suppress_and_exit
def run_all_forecasts(entity_dto: EntityDTO, pythonpath: str):

    config, monitor_config, entity = configure(
        pythonpath=pythonpath, entity_dto=entity_dto
    )
    # 5. Run short-term forecast
    shortterm_results = {}
    longterm_results = {}
    if config.forecast.enabled:
        shortterm_results = run_forecast(
            entity=entity,
            db_retention=config.db_retention,
            period=config.forecast.period,
            lookback=config.forecast.lookback,
            resolution=monitor_config.interval,
            compute_obs=True,
            suffix="FORECAST",
        )

    if config.forecast_far.enabled and _is_time_slot_eligible(
        monitor_config.interval, config.forecast_far.period, entity
    ):
        # 6. Run long-term forecast
        longterm_results = run_forecast(
            entity=entity,
            db_retention=config.db_retention,
            period=config.forecast_far.period,
            lookback=config.forecast_far.lookback,
            resolution=monitor_config.interval,
            compute_obs=False,
            suffix="FORECAST_FAR",
        )

    monitoring = dict(**shortterm_results, **longterm_results)
    if monitoring:
        print(
            "\n".join(f'{key}="{value}"' for key, value in monitoring.items())
        )


if __name__ == "__main__":
    arguments = parse_args()
    run_all_forecasts(
        entity_dto=arguments.entity, pythonpath=arguments.pythonpath
    )
