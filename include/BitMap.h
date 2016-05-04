/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef BITMAP_H_
#define BITMAP_H_

#include <bitset>

#include "Attribute.h"
#include "Callbackable.h"

class SqlDB;

/**
 *  This class represents a generic BitMap
 *
 */
template <unsigned int N>
class BitMap : public Callbackable
{
public:
    /**
     *  Creates a new bitmap, it stores a pointer to the DB parameters
     *  that MUST exists during the object lifetime.
     */
    BitMap(const VectorAttribute& bs_conf, int _id, const char * _db_table)
        : id(_id), start_bit(0), bs(0), db_table(_db_table)
    {
        std::string reserved;

        bs_conf.vector_value("START", start_bit);
        bs_conf.vector_value("RESERVED", reserved);

        if (!reserved.empty())
        {
            one_util::split_unique(reserved, ',', reserved_bit);
        }
    };

    virtual ~BitMap()
    {
        delete bs;
    };

    /* ---------------------------------------------------------------------- */
    /* Database interface                                                     */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns a string stream with the SQL bootstrap command for the
     * bitmap table
     */
    static std::ostringstream& bootstrap(const char * t, std::ostringstream& o)
    {
        o << "CREATE TABLE IF NOT EXISTS " << t
          << " (id INTEGER, map LONGTEXT, PRIMARY KEY(id))";

        return o;
    }

    /**
     *  Insert a new bitmap into the bitmap table. The bitmap marks the
     *  associated reserved bits as initialized by the bitmap conf. This
     *  function is called once to bootstrap the bitmap contents.
     *    @param id of the set, this will update the id of the bitmap
     *    @return 0 on success
     */
    int insert(int _id, SqlDB * db)
    {
        id = _id;

        init("");

        return insert_replace(db, false);
    }

    /**
     *  Loads a bitmap and marks (again) the reserved bits. This function
     *  is called once to load the bitmap from the DB. The reserved bits are
     *  updated.
     *    @param id of the set, this will update the id of the bitmap
     *    @return 0 on success
     */
    int select(int _id, SqlDB * db)
    {
        std::string * uzbs;

        id = _id;

        if ( select(db, &uzbs) != 0 )
        {
            return -1;
        }

        init(*uzbs);

        delete uzbs;

        return 0;
    }

    int update(SqlDB * db)
    {
        return insert_replace(db, true);
    }

    /**
     *  Deletes a bitmap from the DB.
     *    @return 0 on success
     */
    int drop(SqlDB * db)
    {
        std::ostringstream oss;
        oss << "DELETE FROM " << db_table << " WHERE id = " << id ;

        return db->exec(oss);
    }

    /* ---------------------------------------------------------------------- */
    /* BitMap interface                                                       */
    /* ---------------------------------------------------------------------- */
    /*+
     *  Gets the first 0 bit in the map and set it.
     *    @param hint try this bit first, 0 does not use any hint
     *    @param bit the bit number reserved
     *    @return -1 in case of error
     */
    int get(unsigned int hint, unsigned int& bit)
    {
        if ( hint != 0 )
        {
            if ( bs->test(hint) == false )
            {
                bs->set(hint);

                bit = hint;
                return 0;
            }
        }

        for (bit = start_bit; ; ++bit)
        {
            try
            {
                if ( bs->test(bit) == false )
                {
                    bs->set(bit);
                    return 0;
                }
            }
            catch (const std::out_of_range& oor)
            {
                return -1;
            }
        }

        return -1;
    }

    /**
     *  Clears a bit in the map and updates DB.
     *    @param bit to reset
     */
    void reset(int bit)
    {
        try
        {
            bs->reset(bit);
        }
        catch(const std::out_of_range& oor){};
    }

    /**
     *  Sets a bit in the map and updates DB.
     *    @param bit to set
     *    @return 0 on success, -1 if bit was set
     */
    int set(int bit)
    {
        int rc = -1;

        try
        {
            if (bs->test(bit) == false)
            {
                bs->set(bit);

                rc = 0;
            }
        }
        catch(const std::out_of_range& oor){};

        return rc;
    }

    /**
     *  Return the start_bit of the bitmap
     */
    unsigned int get_start_bit()
    {
        return start_bit;
    }

private:
    /* ---------------------------------------------------------------------- */
    /* Bitmap configuration attributes                                        */
    /* ---------------------------------------------------------------------- */
    int id;

    unsigned int start_bit;

    std::set<int> reserved_bit;

    std::bitset<N> * bs;

    /**
     *  Initialized a bitmap by creating a new object and setting the reserved
     *  bits.
     *    @param bm_s the bitmap in string form
     */
    void init(const std::string& bm_s)
    {
        std::set<int>::iterator it;

        bs = new std::bitset<N>(bm_s);

        for (it = reserved_bit.begin(); it != reserved_bit.end(); ++it)
        {
            try
            {
                bs->set(*it);
            }
            catch (const std::out_of_range& oor) {};
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Database implementation                                                */
    /* ---------------------------------------------------------------------- */
    const char * db_table;

    /**
     *  Select callback from DB engine
     */
    int select_cb(void * _bs, int num, char **values, char **names)
    {
        if ( num == 0 || values == 0 || values[0] == 0 )
        {
            return -1;
        }

        *static_cast<std::string*>(_bs) = (const char *) values[0];

        return 0;
    }

    /**
     *  Loads a the contents of a bitmap from DB
     *    @param **uzbs, pointer to a string pointer to store the bitmap, must
     *    be freed by caller.
     *    @return 0 on success
     */
    int select(SqlDB * db, std::string ** uzbs)
    {
        int rc;

        std::ostringstream oss;

        std::string zbs;

        *uzbs = 0;

        set_callback(static_cast<Callbackable::Callback>(&BitMap::select_cb),
                     static_cast<void *>(&zbs));

        oss << "SELECT map FROM " << db_table << " WHERE id = " << id ;

        rc = db->exec(oss, this);

        unset_callback();

        if ( rc != 0 )
        {
            return rc;
        }
        else if (zbs.empty())
        {
            return -1;
        }

        *uzbs = one_util::zlib_decompress(zbs, true);

        if ( *uzbs == 0 )
        {
            rc = -1;
        }

        return rc;
    }


    /**
     *  Insert a Bitmap in the DB, the bitmap is stored in a compressed (zlib)
     *  string form.
     *    @param replace true to replace false to insert
     *    @return 0 on success
     */
    int insert_replace(SqlDB * db, bool replace)
    {
        std::ostringstream oss;

        if (replace)
        {
            oss << "REPLACE ";
        }
        else
        {
            oss << "INSERT ";
        }

        std::string * zipped = one_util::zlib_compress(bs->to_string(), true);

        if (zipped == 0)
        {
            return -1;
        }

        char * ezipped64 = db->escape_str(zipped->c_str());

        oss << "INTO " << db_table << " (id, map) VALUES ("
            << id << ",'" << ezipped64 << "')";

        int rc = db->exec(oss);

        delete zipped;

        db->free_str(ezipped64);

        return rc;
    }
};

#endif /*BITMAP_H_*/

