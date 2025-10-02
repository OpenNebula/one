## Overview

Design a numpy-based Timeseries class that represents time-series data (univariate or multivariate) for OpenNebula entities (VMs, hosts), with support for time-based operations and filtering.

## Current Minimal SDK Structure and Relations to the Timeseries Class

```mermaid
classDiagram
    %% Time Support Classes
    class Period {
        +values: np.ndarray
        +start: datetime
        +end: datetime
        +resolution: timedelta
        +split()
    }
    
    class Instant {
        +value: datetime
        +origin: datetime
        +is_past: bool
        +is_future: bool
    }

    %% Entity Classes
    class EntityType {
        <<enumeration>>
        HOST
        VIRTUAL_MACHINE
    }
    
    class EntityUID {
        <<dataclass>>
        +type: EntityType
        +id: int
        +__str__()
    }

    %% Core Data Classes
    class Timeseries {
        -_df: DataFrame
        +time_index: np.ndarray
        +__getitem__()
        +to_array()
        +fill_missing_values()
        +append()
    }

    class MetricAttributes {
        <<dataclass>>
        +name: str
        +type: MetricType
        +instant_resolution: str
        +instant_hist_steps: int
    }

    class MetricType {
        <<enumeration>>
        COUNTER
        GAUGE
        RATE
    }

    %% Accessor Hierarchy
    class AccessorType {
        <<enumeration>>
        OBSERVATION
        PREDICTION
    }

    class BaseAccessor {
        <<abstract>>
        +type: AccessorType*
        +get_timeseries(entity_uid, attrs, time)* Timeseries
    }

    class SQLiteAccessor {
        +type: AccessorType.OBSERVATION
        -connection
        -timestamp_col: str
        -value_col: str
        +get_timeseries(entity_uid, metric_attrs, time) Timeseries "Gets historical data"
    }

    class PredictorAccessor {
        +type: AccessorType.PREDICTION
        -prediction_model
        +get_timeseries(entity_uid, metric_attrs, time) Timeseries "Gets predicted data - future observations"
    }

    class MetricAccessor {
        -observator_accessor: BaseAccessor[OBSERVATION]
        -predictor_accessor: BaseAccessor[PREDICTION]
        +get_timeseries(entity_uid, attrs, time) Timeseries
        -_route_request(time) "Chooses accessor based on time"
    }

    class Metric {
        -entity_uid: EntityUID
        -attrs: MetricAttributes
        -accessor: MetricAccessor
        +__getitem__(key: str|slice|Period|Instant) Timeseries
    }

    %% Inheritance Relationships
    BaseAccessor <|-- SQLiteAccessor : inherits
    BaseAccessor <|-- PredictorAccessor : inherits
    MetricAccessor *-- BaseAccessor : composes

    %% Dataclass Usage Relationships
    Metric o-- EntityUID : has
    Metric o-- MetricAttributes : has
    
    %% Usage Relationships
    Metric o-- MetricAccessor : has
    MetricAccessor ..> SQLiteAccessor : routes to
    MetricAccessor ..> PredictorAccessor : routes to
    EntityUID --> EntityType : uses
    MetricAttributes o-- MetricType : has
    
    %% Creation Relationships
    SQLiteAccessor ..> Timeseries : creates
    PredictorAccessor ..> Timeseries : creates
    MetricAccessor ..> Timeseries : returns

    BaseAccessor --> AccessorType : has
```