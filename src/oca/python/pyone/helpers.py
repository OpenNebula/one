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

from . import OneException
from . import MARKETPLACEAPP_STATES, MARKETPLACEAPP_TYPES
from base64 import b64decode

class OneHelperException(OneException):
    pass

# Helpers implementation
# This methods are non primitive XMLRPC methods, they can be implemented as a
# series of calls to primitive XMLRPC methods, however they are called in the
# exact same way as XMLRPC method
# They are implemented as standalone functions that take the XMLRPC server as first parameter
# they need to be registered in the XMLRPC server constructor

def marketapp_export(one, appid, dsid=None, name=None, vmtemplate_name=None):
    '''
    Exports a market app to a suitable OpenNebula object
    :param one: the XMLRPC server
    :param appid: id of the marketplace app
    :param dsid: id of the datastore to save images, if not provided the datastore named "default" will be used.
    :param name: name of the new object, if not provided the same name as the App will be used
    :param vmtemplate_name: name for the VM Template, if the app has one.
    :return: a dictionary with the ID of the new Image as image and the ID of the new associated template as vmtemplate. If no template has been defined, it will return -1.
    '''

    ret= {
        "image": -1,
        "vmtemplate": -1
    }

    # find out the datastore

    if not dsid:
        datastores = one.datastorepool.info()
        for ds in datastores.DATASTORE:
            if ds.NAME == "default":
                dsid = ds.ID
                break
    if not dsid:
        raise OneHelperException("Datastore was not provided and could not find the defaultone")

    # get the application

    app = one.marketapp.info(appid)

    if app.STATE != MARKETPLACEAPP_STATES.READY:
        raise OneHelperException("Application is not in READY state")

    if app.TYPE == MARKETPLACEAPP_TYPES.IMAGE:
        if app.APPTEMPLATE64:
            templ=b64decode(app.APPTEMPLATE64).decode()
        else:
            templ=""

        if not name:
            name = app.NAME

        templ+='''\nNAME="%s"\nFROM_APP="%d"''' % (name,app.ID)

        ret['image'] = one.image.allocate(templ,dsid)

        if 'VMTEMPLATE64' in app.TEMPLATE:
            vmtempl = b64decode(app.TEMPLATE['VMTEMPLATE64']).decode()
            if not vmtemplate_name:
                vmtemplate_name = app.NAME

            vmtempl += '''\nNAME="%s"\nDISK=[ IMAGE_ID = %d ]''' % (vmtemplate_name, ret['image'])

            ret['vmtemplate'] = one.template.allocate(vmtempl)

    else:
        raise OneHelperException('App type %s not supported' % MARKETPLACEAPP_TYPES(app.TYPE).name)

    return ret
