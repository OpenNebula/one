/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef BACKUPS_INCREMENTS_H_
#define BACKUPS_INCREMENTS_H_

#include <string>

#include "ExtendedAttribute.h"
#include "NebulaUtil.h"

/**
 * The Image INCREMENT attribute
 */
class Increment : public ExtendedAttribute
{
public:
    Increment(VectorAttribute *va, int id): ExtendedAttribute(va, id){};

    ~Increment() = default;

    enum Type
    {
        FULL      = 0, /** < Full backup*/
        INCREMENT = 1, /** < Forward increment */
    };

    long long size() const
    {
        long long sz = 0;

        vector_value("SIZE", sz);

        return sz;
    }

    int id() const
    {
        return get_id();
    }

    Type backup_type() const
    {
        std::string stype = vector_value("TYPE");

        one_util::toupper(stype);

        if ( stype == "FULL" )
        {
            return FULL;
        }
        else if ( stype == "INCREMENT" )
        {
            return INCREMENT;
        }

        return FULL;
    }
};

/**
 *  Set of INCREMENTS (indexed by ID)
 */
class IncrementSet : public ExtendedAttributeSet
{
public:
    IncrementSet(): ExtendedAttributeSet(false){};

    ~IncrementSet() = default;

    void init(Template * tmpl)
    {
        std::vector<VectorAttribute *> incs;

        tmpl->get("INCREMENT", incs);

        init_attribute_map("ID", incs);
    };

    /* ---------------------------------------------------------------------- */
    /* Increment interface                                                    */
    /* ---------------------------------------------------------------------- */
    VectorAttribute * new_increment(const std::string& source, long long sz,
            Increment::Type type);

    Increment * last_increment()
    {
        return static_cast<Increment *>(last_attribute());
    }

    long long total_size();

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    class IncIterator : public AttributeIterator
    {
    public:
        IncIterator():AttributeIterator(){};
        IncIterator(const AttributeIterator& dit):AttributeIterator(dit){};

        virtual ~IncIterator(){};

        Increment * operator*() const
        {
            return static_cast<Increment *>(map_it->second);
        }
    };

    IncIterator begin()
    {
        IncIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    IncIterator end()
    {
        IncIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class IncIterator inc_iterator;

private:
    ExtendedAttribute * attribute_factory(VectorAttribute * va, int id) const override
    {
        return new Increment(va, id);
    };
};

/**
 *  This class represents a generic set of references (links) for Image objects
 *  The data model is as follows
 *  <BACKUP_INCREMENTS>
 *   <INCREMENT>
 *    <ID> Unique ID within this backup increment
 *    <TYPE> Of the backup FULL | INCREMENT
 *    <PARENT_ID> ID of the parent increment (backing file)
 *    <SOURCE> Reference in the backup system
 *    <SIZE> Size of this increment
 *    <DATE> When this backup was taken (epoch)
 */
class BackupIncrements
{
public:
    BackupIncrements():_template(false,'=',"BACKUP_INCREMENTS"){};

    ~BackupIncrements() = default;

    /* ---------------------------------------------------------------------- */
    /* XML from/to methods for DB persistency                                 */
    /* ---------------------------------------------------------------------- */
    int from_xml_node(const xmlNodePtr node);

    std::string& to_xml(std::string& xml) const
    {
        return _template.to_xml(xml);
    }

    /* ---------------------------------------------------------------------- */
    /* Increments interface                                                   */
    /* ---------------------------------------------------------------------- */
    int add_increment(const std::string& source, long long size, Increment::Type type);

    int last_increment_id();

    long long total_size()
    {
        return increments.total_size();
    }

private:
    /**
     *  Text representation of the increments
     */
    Template _template;

    IncrementSet increments;
};

#endif /*BACKUPS_H_*/
