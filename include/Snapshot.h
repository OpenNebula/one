/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#ifndef SNAPSHOT_POOL_H_
#define SNAPSHOT_POOL_H_

#include <iostream>
#include <string>
#include <map>

#include <libxml/parser.h>

#include "Template.h"

using namespace std;

class VectorAttribute;

/**
 *  This class represents the List of Snapshots associated to an image or Virtual
 *  Machine Disk
 */
class Snapshots
{
public:
    Snapshots(int _disk_id);

    virtual ~Snapshots();

    // *************************************************************************
    // Inititalization functions
    // *************************************************************************

    /**
     *  Builds the snapshot list from its XML representation. This function
     *  is used when importing it from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

    int create_snapshot(unsigned int p_id, const string& tag, string& error);

    int delete_snapshot(unsigned int id);

    /**
     *  Set the given snapshot as active. Updates the values of the current
     *  snapshot
     */
    int active_snapshot(unsigned int id);

private:

    /**
     *  Get a snapshot from the pool
     *  @param id of the snapshot
     *  @return pointer to the snapshot (VectorAttribute) or null
     */
    VectorAttribute * get_snapshot(unsigned int id);

    Template snapshot_template;

    unsigned int next_snapshot;

    unsigned int disk_id;

    map<unsigned int, VectorAttribute *> snapshot_pool;

    unsigned int active;
};

#endif /*SNAPSHOT_H_*/
