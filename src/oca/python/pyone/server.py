# Copyright 2018 www.privaz.io Valletech AB
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems
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

from os import environ

# check if test stub featuers are enabled

_test_fixture = (environ.get("PYONE_TEST_FIXTURE", "False").lower() in ["1", "yes", "true"])

if _test_fixture is False:
    from . import OneServer
else:
    from pyone.tester import OneServerTester as OneServer
