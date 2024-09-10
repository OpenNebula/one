# Copyright 2018 www.privaz.io Valletech AB
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


import dict2xml
import xmltodict
from lxml.etree import tostring
from collections import OrderedDict
from enum import IntEnum

# this is a bit hackish way to avoid escaping <,> characters
# by dict2xml, as it would break <!CDATA[]> which is injected before
dict2xml.Node.entities = []

TEMPLATE_ALWAYS_LIST_ELEM = ['SNAPSHOT']

def add_cdata(d):
    '''
    recursively traverse nested dict and add xml
    CDATA element to the leaves
    '''

    if isinstance(d, list):
        return [ add_cdata(x) for x in d ]

    elif isinstance(d, dict):
        return { k: add_cdata(v) for (k,v) in d.items()}

    else:
        return f"<![CDATA[{str(d)}]]>"


def cast2one(param):

    '''
    This function will cast parameters to make them nebula friendly
    flat dictionaries will be turned into attribute=value vectors
    dictionaries with root dictionary will be serialized as XML
    Structures will be turned into strings before being submitted.

    :param param: the parameter to make nebula friendly
    :return: casted parameter
    '''
    def is_nested_dict(dictionary):
        for val in dictionary.values():
            if isinstance(val, dict):
                return True
        return False

    if isinstance(param, IntEnum):
        # if the param is a constant we return its value
        return param.value
    if isinstance(param, dict):
        # if this is a structured type
        # in case we passed a dictionary that is part of another
        if hasattr(param, '_root'):
            param = param._root
        # if the dictionary is not empty
        if bool(param):
            root = list(param.values())[0]
            if is_nested_dict(param):
                # We return this dictionary as XML
                return dict2xml.dict2xml(add_cdata(param),
                                        indent="", newlines=False)
            else:
                # We return this dictionary as attribute=value vector
                ret = u""
                for (k, v) in param.items():
                    ret = u'''%s%s="%s"\n''' % (ret, k, v)
                return ret
        else:
            raise Exception("Cannot cast empty dictionary")
    else:
        return param


def one2dict(element):
    '''
    This function returns a dictionary from an anyType binding element
    The dictionary can then be used later as imput for an udpate
    This is now deprecated, included for backward compatibility.

    :param element: anyType element to be converted such as TEMLATE or USER_TEMPLATE
    :return: a dictionary representing the element
    '''

    return element._root


def none2emptystr(d):
    for k,v in d.items():
        if type(v) == OrderedDict:
            none2emptystr(v)
        elif v == None:
            d[k] = ""


def fix_dict(d, tag):
    if tag == 'TEMPLATE' and hasattr(d['TEMPLATE'], '__iter__'):
        tmpl = d['TEMPLATE']

        # wrap single entry as a list
        for elem in TEMPLATE_ALWAYS_LIST_ELEM:
            if elem in tmpl and type(tmpl[elem]) != list:
                tmpl[elem] = [ tmpl[elem] ]


def child2dict(element):
    '''
    Creates a dictionary from the documentTree obtained from a binding Element.
    :param element:
    :return:
    '''

    xml = tostring(element)
    ret = xmltodict.parse(xml, strip_whitespace=False)

    # process dict, do ad-hoc fixes
    fix_dict(ret, element.tag)

    # get the tag name and remove the ns attribute if present
    if "}" in element.tag:
        tagName = element.tag.split('}')[1]
        del ret[tagName]['@xmlns']
    else:
        tagName = element.tag

    # Reemplace no-dictionary with empty dictionary
    if ret[tagName] == None:
        ret[tagName] = OrderedDict()

    # Replace 'None' values returned by xmltodict by ""
    none2emptystr(ret)

    if not isinstance(ret[tagName], OrderedDict) and isinstance(ret[tagName], dict):
        ret[tagName] = OrderedDict(ret[tagName])

    # return the contents dictionary, but save a reference
    ret[tagName]._root = ret
    return ret[tagName]


def build_template_node(obj,nodeName,child):
    '''
    Utility function to build an anyType element that can be accessed as a dictionary
    :param obj:
    :param nodeName:
    :param child:
    :return:
    '''
    if nodeName == "TEMPLATE":
        obj.TEMPLATE = child2dict(child)
        return True
    elif nodeName == "USER_TEMPLATE":
        obj.USER_TEMPLATE = child2dict(child)
        return True
    else:
        return False


class TemplatedType(object):
    '''
    Mixin class for Templated bindings
    '''
    def _buildAttributes(self, node, attrs, already_processed):
        vars(self)['custom_attrs'] = dict(attrs)

    def _buildChildren(self, child_, node, nodeName_, fromsubclass_=False, gds_collector_=None):
        if not build_template_node(self, nodeName_, child_):
            super(TemplatedType, self)._buildChildren(child_,node,nodeName_,fromsubclass_,gds_collector_)
