import numpy as np
import pytest

from pyoneai.core.metric_types import Float, UInt


class TestDtype:

    def test_create_default_limits(self):
        dtype = Float()
        assert dtype.limits == (-np.inf, np.inf)

    def test_use_correct_dtype_float(self):
        dtype = Float()
        assert dtype.DTYPE == np.dtype("float")

    def test_use_correct_dtype_uint(self):
        dtype = UInt()
        assert dtype.DTYPE == np.dtype("uint")

    def test_create_with_only_lower_limit(self):
        dtype = Float(lower=0)
        assert dtype.limits == (0, np.inf)

    def test_create_with_only_upper_limit(self):
        dtype = Float(upper=0)
        assert dtype.limits == (-np.inf, 0)

    def test_eq_for_upper_limit_sameas_default(self):
        dtype1 = Float()
        dtype2 = Float(upper=np.inf)
        assert dtype1 == dtype2

    def test_eq_different_upper_limit(self):
        dtype1 = Float(upper=0)
        dtype2 = Float(upper=1)
        assert dtype1 != dtype2

    def test_raise_on_lower_limit_bigger_than_upper(self):
        with pytest.raises(
            ValueError,
            match=r"Invalid limits. Lower limit must be lower than upper "
            r"limit.",
        ):
            Float(lower=1, upper=0)
