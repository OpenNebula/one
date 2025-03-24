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

import sys

try:
    import numpy as np
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
except ImportError as e:
    print(f"Error: {e} ({type(e).__name__})", file=sys.stderr)
    sys.exit(1)

import argparse
import os
from datetime import timedelta

import yaml

HOST_METRICS = {
    "usedcpu": MetricAttributes(
        name="usedcpu",
        type=MetricType.GAUGE,
        dtype=Float(
            0.0, np.inf
        ),  # TODO: inf should be replaced by the CPU ratio * 100 of the VM
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
    "netrx": MetricAttributes(name="netrx", type=MetricType.COUNTER, dtype=UInt()),
    "nettx": MetricAttributes(name="nettx", type=MetricType.COUNTER, dtype=UInt()),
    "netrx_bw": MetricAttributes(
        name="netrx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
    "nettx_bw": MetricAttributes(
        name="nettx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
}

VM_METRICS = {
    "cpu": MetricAttributes(
        name="cpu", type=MetricType.GAUGE, dtype=Float(0.0, np.inf)
    ),
    "memory": MetricAttributes(name="memory", type=MetricType.GAUGE, dtype=UInt()),
    "netrx": MetricAttributes(name="netrx", type=MetricType.COUNTER, dtype=UInt()),
    "nettx": MetricAttributes(name="nettx", type=MetricType.COUNTER, dtype=UInt()),
    "netrx_bw": MetricAttributes(
        name="netrx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
    "nettx_bw": MetricAttributes(
        name="nettx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
    "diskrdbytes": MetricAttributes(
        name="diskrdbytes", type=MetricType.COUNTER, dtype=UInt()
    ),
    "diskwrbytes": MetricAttributes(
        name="diskwrbytes", type=MetricType.COUNTER, dtype=UInt()
    ),
    "diskrd_bw": MetricAttributes(
        name="diskrdbytes", type=MetricType.COUNTER, dtype=UInt(), operator="rate"
    ),
    "diskwr_bw": MetricAttributes(
        name="diskwrbytes", type=MetricType.COUNTER, dtype=UInt(), operator="rate"
    ),
    "diskrdiops": MetricAttributes(
        name="diskrdiops", type=MetricType.COUNTER, dtype=Float(0.0, np.inf)
    ),
    "diskwriops": MetricAttributes(
        name="diskwriops", type=MetricType.COUNTER, dtype=Float(0.0, np.inf)
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
}

DERIVED_METRICS = [
    "netrx_bw",
    "nettx_bw",
    "diskrd_bw",
    "diskwr_bw",
    "diskrdiops_bw",
    "diskwriops_bw"
]


def get_horizon(period: int, resolution: timedelta):
    horizon = int(period / resolution)
    if horizon == 1:
        time = Instant(resolution)
    else:
        time = Period(
            slice(
                resolution,
                resolution * horizon,
                resolution,
            )
        )
    return time


DB_MONITOR_INTERVAL = {
    "host": 120,  # default value for the HOST monitoring interval
    "virtualmachine": 30,  # default values for the VM monitoring interval
}


def parse_entity(entity_str):
    try:
        type, id, uuid, db_dir = entity_str.split(",")
        return {"type": type, "id": id, "uuid": uuid, "db_dir": db_dir}
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"entity must be in the format 'type,id,uuid,db_dir'. Got: {entity_str}"
        )


def parse_args():
    parser = argparse.ArgumentParser(description="Prediction probe")

    parser.add_argument(
        "--entity",
        type=parse_entity,
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


def main():

    args = parse_args()
    entity = args.entity

    # load configuration file
    config_file = "/var/tmp/one/etc/im/kvm-probes.d/forecast.conf"
    with open(config_file, "r") as file:
        config = yaml.load(file, Loader=yaml.FullLoader)

    # db retention is in weeks
    db_retention = timedelta(weeks=int(config[entity["type"]]["db_retention"]))

    # Short-Term Forecast
    near = {}
    near["period"] = timedelta(minutes=int(config[entity["type"]]["forecast_period"]))
    near["resolution"] = timedelta(minutes=1)
    near["sequence_length"] = 60  # last 1 hour: this should be adaptive
    near["horizon"] = get_horizon(near["period"], near["resolution"])

    # Long-Term Forecast
    far = {}
    far["period"] = timedelta(hours=int(config[entity["type"]]["forecast_far_period"]))
    far["resolution"] = timedelta(hours=1)
    far["sequence_length"] = 48  # last 2 days of data: this should be adaptive
    far["horizon"] = get_horizon(far["period"], far["resolution"])

    try:
        if entity["type"] == "host":
            monitoring = {
                "db_path": os.path.join(entity["db_dir"], "host.db"),
                "monitor_interval": DB_MONITOR_INTERVAL["host"],
            }
            entity = Entity(
                uid=EntityUID(type=EntityType.HOST, id=entity["id"]),
                metrics=HOST_METRICS,
                monitoring=monitoring,
            )
        elif entity["type"] == "virtualmachine":
            monitoring = {
                "db_path": os.path.join(entity["db_dir"], f'{entity["id"]}.db'),
                "monitor_interval": DB_MONITOR_INTERVAL["virtualmachine"],
            }
            entity = Entity(
                uid=EntityUID(type=EntityType.VIRTUAL_MACHINE, id=entity["id"]),
                metrics=VM_METRICS,
                monitoring=monitoring,
            )
    except Exception as e:
        sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
        sys.exit(0)

    monitor = {}
    for name, m in entity.metrics.items():
        #
        # Get the latest observation for derived metrics
        #
        if name in DERIVED_METRICS:
            try:
                end = near["horizon"].origin
                step = timedelta(seconds=DB_MONITOR_INTERVAL[entity.uid.type.value])
                start = end - step
                obs = round(m[Period(slice(start, end, step))].values[-1][0][0], 2)
            except Exception as e:
                sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
                obs = None
        else:
            obs = None

        #
        # Compute Short Term Forecast
        #
        try:
            entity._pred._prediction_model.model_config.sequence_length = near[
                "sequence_length"
            ]
            ts = m[near["horizon"]].values
            forecast = round(ts[-1][0][0], 2)
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
            forecast = None
            obs = None

        #
        # Compute Long Term Forecast
        #
        try:
            entity._pred._prediction_model.model_config.sequence_length = far[
                "sequence_length"
            ]
            forecast_far = round(m[far["horizon"]].values[-1][0][0], 2)
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
            forecast_far = None

        if obs is not None:
            monitor[name.upper()] = obs
        if forecast is not None:
            monitor[f"{name.upper()}_FORECAST"] = forecast
        if forecast_far is not None:
            monitor[f"{name.upper()}_FORECAST_FAR"] = forecast_far

    #
    # Print on stdout predictions and derived metrics
    #
    if monitor:
        mon_str = "\n".join(f'{key}="{value}"' for key, value in monitor.items())

        print(mon_str)


if __name__ == "__main__":
    main()
