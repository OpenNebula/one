import pytest

from pyoneai.core import (
    Entity,
    EntityType,
    EntityUID,
    Float,
    UInt,
    MetricAttributes,
    MetricType,
)


class TestEntity:
    @pytest.fixture(autouse=True)
    def setup(self, mocker):
        self.uid = EntityUID(type=EntityType.VIRTUAL_MACHINE, id=0)
        self.monitoring = {
            "db_path": "dummy.db",
            "monitor_interval": 60,
        }
        self.metrics = {
            "cpu": MetricAttributes(
                name="cpu",
                type=MetricType.COUNTER,
                dtype=Float(0.0, 100.0),
            ),
            "memory": MetricAttributes(
                name="memory",
                type=MetricType.GAUGE,
                dtype=UInt(0, 1000000),
            ),
        }

        self.mock_sqlite_accessor = mocker.patch(
            "pyoneai.core.entity.SQLiteAccessor"
        )
        self.mock_predictor_accessor = mocker.patch(
            "pyoneai.core.entity.PredictorAccessor"
        )
        self.mock_metric_accessor = mocker.patch(
            "pyoneai.core.entity.MetricAccessor"
        )
        self.mock_metric = mocker.patch("pyoneai.core.entity.Metric")
        self.mock_fourier_model = mocker.patch(
            "pyoneai.ml.FourierPredictionModel"
        )

        self.entity = Entity(
            uid=self.uid,
            metrics=self.metrics,
            monitoring=self.monitoring,
        )

    def test_init(self):
        assert self.entity._uid == self.uid
        assert len(self.entity._metrics) == 2
        assert "cpu" in self.entity._metrics
        assert "memory" in self.entity._metrics
        self.mock_sqlite_accessor.assert_called_once_with(self.monitoring)
        self.mock_metric.call_count == 2
        self.mock_metric_accessor.call_count == 2
        self.mock_fourier_model.assert_called_once()
        self.mock_predictor_accessor.assert_called_once()
