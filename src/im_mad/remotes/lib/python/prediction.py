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
import yaml

import argparse
import base64
import json
import os
import sqlite3

from datetime import timedelta


METRICS = {
    'host':
        ["usedcpu", "freecpu", "usedmemory", "freememory", "netrx", "nettx"],
    'virtualmachine':
        [
            "cpu",
            "memory",
            "netrx",
            "nettx",
            "diskrdbytes",
            "diskwrbytes",
            "diskrdiops",
            "diskwriops",
        ]
}

def predictions(
    entity, manifest_path, metric_name, metrics_db, forecast_horizon, resolution, 
    sequence_length
):
    """
    Generates predictions for a given Host metric using a trained ML model.

    Parameters
    ----------
    entity : dict
        Entity information.
    manifest_path : str
        Path to the ML artifact manifest file.
    metric_name : str
        Name of the metric to predict.
    metrics_db : str
        Path to SQLite metrics database.
    forecast_horizon : int
        Number of prediction steps.
    resolution : int
        Time resolution in minutes or hours.
    sequence_length: int
        Number of observations according to the resolution

    Returns
    -------
    str
        String of predictions in key:value format.
    """

    from pyoneai.core import (
        EntityType,
        EntityUID,
        Instant,
        Metric,
        MetricAccessor,
        MetricAttributes,
        Period,
        PredictorAccessor,
        SQLiteAccessor,
    )
    from pyoneai.ml import ArtifactManager

    if forecast_horizon == 1:
        time = Instant(resolution)
    else:
        time = Period(
            slice(
                resolution,
                resolution * forecast_horizon,
                resolution,
            )
        )

    ml_model = ArtifactManager.load(manifest_path)
    ml_model.model_config.sequence_length = sequence_length
    metric = Metric(
        entity_uid=EntityUID(type=EntityType(entity["type"]), id=entity["id"]),
        attrs=MetricAttributes(name=metric_name),
        accessor=MetricAccessor(
            SQLiteAccessor(metrics_db), PredictorAccessor(ml_model)
        ),
    )
    return round(metric[time].values[-1][0][0], 2)

def parse_entity(entity_str):
    try:
        type,id,uuid,db_dir = entity_str.split(",")
        return {"type":type,"id": id, "uuid": uuid, "db_dir": db_dir}
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"VM must be in the format 'id,db_dir'. Got: {entity_str}"
        )

def main():
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

    args = parser.parse_args()

    entity = args.entity

    # load configuration file
    config_file = '/var/tmp/one/etc/im/kvm-probes.d/forecast.conf'
    with open(config_file, 'r') as file:
        config = yaml.load(file, Loader=yaml.FullLoader)

    # db retention is in weeks
    db_retention = timedelta(weeks=int(config[entity["type"]]['db_retention']))

    # forecast is given in minutes
    forecast = timedelta(minutes=int(config[entity["type"]]['forecast_period']))

    # forecast_far is given in hours
    forecast_far = timedelta(hours=int(config[entity["type"]]['forecast_far_period']))

    resolution = timedelta(minutes=5)
    resolution_far = timedelta(hours=1)
    
    # TODO: since resolution is in minutes the sequence length could be really big
    # In this case, we should define a smaller sequence length
    sequence_length =int(db_retention/resolution)
    sequence_length_far =int(db_retention/resolution_far)
    
    forecast_horizon = int(forecast/resolution)
    forecast_horizon_far = int(forecast_far/resolution_far)

    manifest_path = f"{args.pythonpath}/models/fourier/manifest.yaml"
    metrics_db = os.path.join(entity["db_dir"], "metrics.db")

    monitor = {}
    connection = sqlite3.connect(metrics_db)
    for metric_name in METRICS[entity["type"]]:
        try:
            forecast = predictions(
                entity=entity,
                manifest_path=manifest_path,
                metric_name=metric_name,
                metrics_db=metrics_db,
                forecast_horizon=forecast_horizon,
                resolution=resolution,
                sequence_length=sequence_length
            )
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
            forecast = None

        try:
            forecast_far = predictions(
                entity=entity,
                manifest_path=manifest_path,
                metric_name=metric_name,
                metrics_db=metrics_db,
                forecast_horizon=forecast_horizon_far,
                resolution=resolution_far,
                sequence_length=sequence_length_far
            )
        except Exception as e:
            sys.stderr.write(f"Error: {e} ({type(e).__name__})\n")
            forecast_far = None

        if forecast:
            monitor[f"{metric_name.upper()}_FORECAST"] = forecast
        if forecast_far:
            monitor[f"{metric_name.upper()}_FORECAST_FAR"] = forecast_far

    if monitor:
        mon_str = "\n".join(f'{key}="{value}"' for key, value in monitor.items())

        print(mon_str)


if __name__ == "__main__":
    main()
