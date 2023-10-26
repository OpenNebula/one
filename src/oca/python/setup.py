# Copyright 2018 www.privaz.io Valletech AB
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems
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

# Always prefer setuptools over distutils
from setuptools import setup, find_packages
# To use a consistent encoding
from codecs import open
from os import path
import sys

here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, 'README.rst'), encoding='utf-8') as f:
    long_description = f.read()

install_requires = [
    'lxml',
    'dict2xml',
    'xmltodict',
    'six',
    'aenum',
    'tblib',
    'requests'
]

# include future in python2
if sys.version_info[0] < 3:
    install_requires.append('future')

version = '6.4.5'

# mark pre-release
v1 = int(version.split('.')[1])
v2 = int(version.split('.')[2])

if v1 >= 90 or v2 >= 90:
    pyone_version = version + 'rc1'
elif v1 >= 80 or v2 >= 80:
    pyone_version = version + 'b1'
else:
    pyone_version = version

setup(
    name='pyone',
    version=pyone_version,
    description='Python Bindings for OpenNebula XML-RPC API',
    long_description=long_description,

    # The project's main homepage.
    url='http://opennebula.io',

    # Author details
    author='Rafael del Valle',
    author_email='rvalle@privaz.io',

    # Choose your license
    license='http://www.apache.org/licenses/LICENSE-2.0',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Build Tools',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python :: 3'
    ],

    keywords='cloud opennebula xmlrpc bindings',
    packages=find_packages(),
    install_requires=install_requires,
    extras_require={
        'dev': ['check-manifest'],
        'test': ['coverage'],
    },
    test_suite="tests"
)
