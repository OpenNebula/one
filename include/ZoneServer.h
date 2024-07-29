/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef ZONE_SERVER_H_
#define ZONE_SERVER_H_

#include "ExtendedAttribute.h"

/**
 * The VirtualMachine DISK attribute
 */
class ZoneServer : public ExtendedAttribute
{
public:

    ZoneServer(VectorAttribute *va, int id):ExtendedAttribute(va, id) {};

    virtual ~ZoneServer() {};

    /**
     *  Initialized server metadata:
     *    - NAME
     *    - ENDPOINT
     *  @param error string if any
     *  @return -1 if server data could not be initialized, 0 on success
     */
    int init(std::string& error)
    {
        if ( vector_value("NAME").empty() )
        {
            error = "Missing NAME in SERVER";
            return -1;
        }

        if ( vector_value("ENDPOINT").empty() )
        {
            error = "Missing ENDPOINT in SERVER";
            return -1;
        }

        return 0;
    }

    //--------------------------------------------------------------------------
    //  Server attributes
    //--------------------------------------------------------------------------
    /**
     *  @return the ID of the server
     */
    int get_id() const
    {
        return ExtendedAttribute::get_id();
    }
};


/**
 *  Set of Zone servers
 */
class ZoneServers : public ExtendedAttributeSet
{
public:
    /* ---------------------------------------------------------------------- */
    /* Constructor and Initialization functions                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Creates the ZoneServers set from a zone template with SERVER=[...]
     *  attributes
     *    @param tmpl template with SERVER
     */
    ZoneServers(Template * tmpl)
        : ExtendedAttributeSet(false)
        , next_id(-1)
    {
        std::vector<VectorAttribute *> vas;

        tmpl->get(SERVER_NAME, vas);

        init_attribute_map(SERVER_ID_NAME, vas);

        for ( zone_iterator it = begin() ; it != end() ; ++it )
        {
            std::string error;

            int i = (*it)->get_id();

            if ( i > next_id )
            {
                next_id = i;
            }

            (*it)->init(error);
        }

        next_id += 1;
    };

    /**
     *  Creates an empty zone server set
     */
    ZoneServers()
        : ExtendedAttributeSet(false)
        , next_id(-1)
    {}

    virtual ~ZoneServers() = default;

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    class ZoneIterator : public AttributeIterator
    {
    public:
        ZoneIterator():AttributeIterator() {};
        ZoneIterator(const AttributeIterator& dit):AttributeIterator(dit) {};
        virtual ~ZoneIterator() {};

        ZoneServer * operator*() const
        {
            return static_cast<ZoneServer *>(map_it->second);
        }
    };

    ZoneIterator begin()
    {
        ZoneIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    ZoneIterator end()
    {
        ZoneIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class ZoneIterator zone_iterator;

    /* ---------------------------------------------------------------------- */
    /* ZoneServer interface                                                   */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns the SERVER attribute for a zone server
     *   @param disk_id of the DISK
     *   @return pointer to the attribute ir null if not found
     */
    ZoneServer * get_server(int id) const
    {
        return static_cast<ZoneServer *>(get_attribute(id));
    }

    int add_server(VectorAttribute * va, int& sid, std::string& error)
    {
        ZoneServer * server = new ZoneServer(va, next_id);

        if ( server->init(error) != 0 )
        {
            delete server;

            return -1;
        }

        va->replace(SERVER_ID_NAME, next_id);

        add_attribute(server, next_id);

        sid = next_id;

        next_id += 1;

        return 0;
    };

    ZoneServer * delete_server(int id)
    {
        return static_cast<ZoneServer *>(delete_attribute(id));
    };

    /**
     *  @return servers in zone
     */
    unsigned int size()
    {
        return ExtendedAttributeSet::size();
    }

protected:
    ExtendedAttribute * attribute_factory(VectorAttribute * va, int id) const override
    {
        return new ZoneServer(va, id);
    };

private:
    friend class Zone;

    static const char * SERVER_NAME; //"SERVER"

    static const char * SERVER_ID_NAME; //"ID"

    int next_id;
};

#endif  /*ZONE_SERVER_H_*/

