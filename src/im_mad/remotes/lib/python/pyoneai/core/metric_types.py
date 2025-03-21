import enum
from abc import ABC
from dataclasses import dataclass, field
from typing import Any, Union

import numpy as np


# NOTE: we exploit here NumPy dtype objects ad Timeseries relies on NumPy
# arrays
class DType(ABC):
    __slots__ = ("limits",)
    DTYPE: np.dtype
    DEFAULT_LIMITS: tuple

    def __init__(self, lower: Any = None, upper: Any = None):
        lower_limit = self.DEFAULT_LIMITS[0] if lower is None else lower
        upper_limit = self.DEFAULT_LIMITS[1] if upper is None else upper
        if upper_limit < lower_limit:
            raise ValueError(
                f"Invalid limits. Lower limit must be lower than upper limit."
            )
        self.limits = (lower_limit, upper_limit)

    def __eq__(self, value) -> bool:
        if not isinstance(value, DType):
            return False
        return (self.DTYPE == value.DTYPE) and (self.limits == value.limits)

    def __str__(self) -> str:
        return f"DType(dtype={self.DTYPE}, limits={self.limits})"

    def __hash__(self):
        return hash((self.DTYPE, self.limits))


class UInt(DType):
    DTYPE = np.dtype(np.uint64)
    DEFAULT_LIMITS = (0, np.iinfo(np.uint64).max)


class Float(DType):
    DTYPE = np.dtype(np.float64)
    DEFAULT_LIMITS = (-np.inf, np.inf)


@enum.unique
class MetricType(enum.Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    RATE = "rate"
    HISTOGRAM = "histogram"


@dataclass(frozen=True)
class MetricAttributes:
    name: Union[str, None] = None
    type: Union[MetricType, None] = None
    dtype: DType = field(default_factory=Float)
    operator: Union[str, None] = None

    def __eq__(self, value):
        if not isinstance(value, MetricAttributes):
            return False
        return (
            self.name == value.name
            and self.type == value.type
            and self.dtype == value.dtype
            and self.operator == value.operator
        )

    def __str__(self) -> str:
        repr = "MetricAttributes("
        if self.name:
            repr += f"name={self.name}, "
        if self.type:
            repr += f"type={self.type}, "
        if self.operator:
            repr += f"operator={self.operator}, "
        repr += f"dtype={self.dtype})"
        return repr

    def __hash__(self):
        return hash((self.name, self.type, self.operator, self.dtype))
