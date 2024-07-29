# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #

import os
import SCons

############
# BUILDERS #
############


def build_lex(target, source, env):
    cwd = os.getcwd()

    src = SCons.Util.to_String(source[0])
    src_dir = os.path.dirname(src)
    src_name = os.path.basename(src)

    os.chdir(src_dir)
    os.system("flex "+src_name)
    os.chdir(cwd)

    return None


def emitter_lex(target, source, env):
    src = SCons.Util.to_String(source[0])
    (src_name, src_ext) = os.path.splitext(os.path.basename(src))
    target.append(src_name+".h")
    return target, source


def add_lex(environment):
    lex_bld = SCons.Builder.Builder(action=build_lex,
                                    suffix='.cc',
                                    src_suffix='.l',
                                    emitter=emitter_lex)
    environment.Append(BUILDERS={'Lex': lex_bld})


def build_bison(target, source, env):
    cwd = os.getcwd()

    src = SCons.Util.to_String(source[0])
    src_dir = os.path.dirname(src)
    src_name = os.path.basename(src)
    (base, ext) = os.path.splitext(src_name)

    os.chdir(src_dir)
    os.system("bison "+src_name)
    os.rename(base+".hh", base+".h")
    os.chdir(cwd)

    return None


def emitter_bison(target, source, env):
    src = SCons.Util.to_String(source[0])
    (src_name, src_ext) = os.path.splitext(os.path.basename(src))
    target.append(src_name+".h")
    return target, source


def add_bison(environment):
    bison_bld = SCons.Builder.Builder(action=build_bison,
                                      suffix='.cc',
                                      src_suffix='.y',
                                      emitter=emitter_bison)
    environment.Append(BUILDERS={'Bison': bison_bld})
