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
    from pyoneai.ml import ArtifactManager
except ImportError as e:
    print(f"Error: {e} ({type(e).__name__})", file=sys.stderr)
    sys.exit(0)

import argparse
import os
from datetime import timedelta
import time
import xml.etree.ElementTree as ET

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
    # "netrx": MetricAttributes(name="netrx", type=MetricType.COUNTER, dtype=UInt()),
    # "nettx": MetricAttributes(name="nettx", type=MetricType.COUNTER, dtype=UInt()),
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
    # "netrx": MetricAttributes(name="netrx", type=MetricType.COUNTER, dtype=UInt()),
    # "nettx": MetricAttributes(name="nettx", type=MetricType.COUNTER, dtype=UInt()),
    "netrx_bw": MetricAttributes(
        name="netrx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
    "nettx_bw": MetricAttributes(
        name="nettx", type=MetricType.COUNTER, dtype=Float(0.0, np.inf), operator="rate"
    ),
    # "diskrdbytes": MetricAttributes(
    #     name="diskrdbytes", type=MetricType.COUNTER, dtype=UInt()
    # ),
    # "diskwrbytes": MetricAttributes(
    #     name="diskwrbytes", type=MetricType.COUNTER, dtype=UInt()
    # ),
    "diskrdbytes_bw": MetricAttributes(
        name="diskrdbytes", type=MetricType.COUNTER, dtype=UInt(), operator="rate"
    ),
    "diskwrbytes_bw": MetricAttributes(
        name="diskwrbytes", type=MetricType.COUNTER, dtype=UInt(), operator="rate"
    ),
    # "diskrdiops": MetricAttributes(
    #     name="diskrdiops", type=MetricType.COUNTER, dtype=Float(0.0, np.inf)
    # ),
    # "diskwriops": MetricAttributes(
    #     name="diskwriops", type=MetricType.COUNTER, dtype=Float(0.0, np.inf)
    # ),
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
    "diskrdbytes_bw",
    "diskwrbytes_bw",
    "diskrdiops_bw",
    "diskwriops_bw",
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


DB_MONITOR_INTERVAL_DEFAULT = {
    "host": 120,  # default value for the HOST monitoring interval
    "virtualmachine": 30,  # default values for the VM monitoring interval
}


def get_monitor_interval(config_file):
    monitor_probes = {}
    probes_period = None

    try:
        root = ET.parse(config_file).getroot()
        probes_period = root.find("PROBES_PERIOD")
    except:
        pass

    if probes_period is not None:
        monitor_probes = {child.tag: child.text for child in probes_period}

    db_monitor_interval = {}
    db_monitor_interval["host"] = int(monitor_probes.get(
        "MONITOR_HOST", DB_MONITOR_INTERVAL_DEFAULT["host"]
    ))
    db_monitor_interval["virtualmachine"] = int(monitor_probes.get(
        "MONITOR_VM", DB_MONITOR_INTERVAL_DEFAULT["virtualmachine"]
    ))
    return db_monitor_interval

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
        config = yaml.load(file, Loader=yaml.FullLoader)[entity["type"]]

    # load monitor interval
    db_monitor_interval = get_monitor_interval('/var/tmp/one_db/config')

    db_retention = timedelta(weeks=config["db_retention"])

    manifest_path = os.path.join(args.pythonpath, "models", "default", "manifest.yaml")
    try:
        artifact = ArtifactManager.load(manifest_path)
    except Exception as e:
        print(f"Error: {e} ({type(e).__name__})", file=sys.stderr)
        sys.exit(0)

    # Short-Term Forecast
    near = {}
    near["enabled"] = config["forecast"].get("enabled", True)
    near["period"] = timedelta(minutes=int(config["forecast"]["period"]))
    near["resolution"] = timedelta(seconds=db_monitor_interval[entity["type"]])
    near["sequence_length"] = config["forecast"].get(
        "lookback", db_retention / near["resolution"]
    )
    near["horizon"] = get_horizon(near["period"], near["resolution"])

    # Long-Term Forecast
    far = {}
    far["enabled"] = config["forecast_far"].get("enabled", False)
    far["period"] = timedelta(minutes=int(config["forecast_far"]["period"]))
    if far["period"].total_seconds() > 7200:  # greater then 2 hours
        far["resolution"] = timedelta(hours=1)
        lookback = timedelta(
            minutes=config["forecast_far"].get(
                "lookback", db_retention / far["resolution"]
            )
        )
        far["sequence_length"] = lookback / far["resolution"]
    else:
        far["resolution"] = max(
            timedelta(minutes=1), timedelta(seconds=db_monitor_interval[entity["type"]])
        )
        far["sequence_length"] = config["forecast_far"].get(
            "lookback", db_retention / far["resolution"]
        )
    far["horizon"] = get_horizon(far["period"], far["resolution"])

    if not near["enabled"] and not far["enabled"]:
        sys.exit(0)

    try:
        if entity["type"] == "host":
            monitoring = {
                "db_path": os.path.join(entity["db_dir"], "host.db"),
                "monitor_interval": db_monitor_interval["host"],
            }
            entity = Entity(
                uid=EntityUID(type=EntityType.HOST, id=entity["id"]),
                metrics=HOST_METRICS,
                monitoring=monitoring,
                artifact=artifact,
            )
        elif entity["type"] == "virtualmachine":
            monitoring = {
                "db_path": os.path.join(entity["db_dir"], f'{entity["id"]}.db'),
                "monitor_interval": db_monitor_interval["virtualmachine"],
            }
            entity = Entity(
                uid=EntityUID(type=EntityType.VIRTUAL_MACHINE, id=entity["id"]),
                metrics=VM_METRICS,
                monitoring=monitoring,
                artifact=artifact,
            )
    except Exception as e:
        sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
        sys.exit(0)

    # compute the slot for the forecast far
    # we set the larger interval to 60 minutes by default
    #
    if far["enabled"]:
        monitor_interval = timedelta(seconds=db_monitor_interval[entity.uid.type.value])
        far["interval"] = min(
            timedelta(minutes=60), far["sequence_length"] * far["resolution"] / 10
        )
        far["interval"] = max(far["interval"], monitor_interval)
        total_slots = int(far["interval"] / monitor_interval)
        slot = (
            int(time.time()) // db_monitor_interval[entity.uid.type.value]
        ) % total_slots
        entity_slot = int(int(entity.uid.id) % total_slots)

    monitor = {}
    for name, m in entity.metrics.items():
        #
        # Get the latest observation for derived metrics
        #
        obs = None
        if name in DERIVED_METRICS:
            try:
                end = near["horizon"].origin
                step = timedelta(seconds=db_monitor_interval[entity.uid.type.value])
                start = end - step
                obs = round(m[Period(slice(start, end, step))].values[-1][0][0], 2)
            except Exception as e:
                sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")

        #
        # Compute Short Term Forecast
        #
        forecast = None
        try:
            if near["enabled"]:
                entity._pred._prediction_model.model_config.sequence_length = near[
                    "sequence_length"
                ]
                ts = m[near["horizon"]].values
                forecast = round(ts[-1][0][0], 2)
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")

        #
        # Compute Long Term Forecast
        #
        forecast_far = None
        try:
            #
            # Long term forecast is computed at larger intervals
            #
            if far["enabled"] and (entity_slot == slot):
                entity._pred._prediction_model.model_config.sequence_length = far[
                    "sequence_length"
                ]
                forecast_far = round(m[far["horizon"]].values[-1][0][0], 2)
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")

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
