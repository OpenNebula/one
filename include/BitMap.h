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

#ifndef BITMAP_H_
#define BITMAP_H_

#include <bitset>

#include "Attribute.h"
#include "Callbackable.h"
#include "SSLUtil.h"

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
            set_reserved_bit(reserved);
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
     *  Insert a new zero'ed bitmap into the bitmap table. This function is
     *  called once to bootstrap the bitmap contents.
     *    @param id of the set, this will update the id of the bitmap
     *    @return 0 on success
     */
    int insert(int _id, SqlDB * db)
    {
        id = _id;
        bs = new std::bitset<N>;

        return insert_replace(db, false);
    }

    /**
     *  Loads a bitmap from its string representation. This function is called
     *  once to load the bitmap from the DB.
     *    @param id of the set, this will update the id of the bitmap
     *    @return 0 on success
     */
    int select(int _id, SqlDB * db)
    {
        std::string uzbs;

        id = _id;

        if ( select(db, uzbs) != 0 )
        {
            return -1;
        }

        bs = new std::bitset<N>(uzbs);

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

        return db->exec_wr(oss);
    }

    /* ---------------------------------------------------------------------- */
    /* BitMap interface                                                       */
    /* ---------------------------------------------------------------------- */
    /*+
     *  Gets the first 0 bit in the map (and not reserved) and set it.
     *    @param hint try this bit first, 0 does not use any hint
     *    @param bit the bit number reserved
     *    @return -1 in case of error
     */
    int get(unsigned int hint, unsigned int& bit) const
    {
        if ( hint != 0 )
        {
            if ( !bs->test(hint) && !reserved_bit.test(hint) )
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
                if ( !bs->test(bit) && !reserved_bit.test(bit) )
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
        catch(const std::out_of_range& oor) {};
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
        catch(const std::out_of_range& oor) {};

        return rc;
    }

    /**
     *  Return the start_bit of the bitmap
     */
    unsigned int get_start_bit() const
    {
        return start_bit;
    }

private:
    /* ---------------------------------------------------------------------- */
    /* Bitmap configuration attributes                                        */
    /* ---------------------------------------------------------------------- */
    int id;

    unsigned int start_bit;

    std::bitset<N> reserved_bit;

    std::bitset<N> * bs;

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
    int select(SqlDB * db, std::string &uzbs)
    {
        int rc;

        std::ostringstream oss;

        std::string zbs;

        set_callback(static_cast<Callbackable::Callback>(&BitMap::select_cb),
                     static_cast<void *>(&zbs));

        oss << "SELECT map FROM " << db_table << " WHERE id = " << id ;

        rc = db->exec_rd(oss, this);

        unset_callback();

        if ( rc != 0 )
        {
            return rc;
        }
        else if (zbs.empty())
        {
            return -1;
        }

        return ssl_util::zlib_decompress64(zbs, uzbs);
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

        std::string zipped;

        if (ssl_util::zlib_compress64(bs->to_string(), zipped) != 0)
        {
            return -1;
        }

        char * ezipped64 = db->escape_str(zipped);

        if (replace)
        {
            oss << "UPDATE "  << db_table << " SET "
                << "map = '" << ezipped64 << "' "
                << "WHERE id = " << id;
        }
        else
        {
            oss << "INSERT INTO " << db_table << " (id, map) VALUES ("
                << id << ",'" << ezipped64 << "')";
        }

        int rc = db->exec_wr(oss);

        db->free_str(ezipped64);

        return rc;
    }

    /**
     * The reserved bit string is separated by ',' for each element
     * and by ':' for ranges.
     *   @param string with reserved bits
     */

    void set_reserved_bit(const std::string& reserved)
    {
        std::vector<std::string> strings;
        std::vector<std::string> range;

        std::istringstream iss;

        unsigned int bit, bit_start, bit_end;

        strings = one_util::split(reserved, ',', true);

        for (const auto& str : strings)
        {
            // Try to split it by ':'
            range = one_util::split(str, ':', true);

            iss.clear();
            iss.str(range[0]);
            iss >> bit_start;

            if ( iss.fail() )
            {
                continue;
            }

            if (range.size() == 1)
            {
                bit_end = bit_start;
            }
            else if (range.size() == 2)
            {
                iss.clear();
                iss.str(range[1]);
                iss >> bit_end;

                if ( iss.fail() )
                {
                    continue;
                }
            }
            else
            {
                continue;
            }

            for (bit = bit_start; bit <= bit_end && bit < N; bit++)
            {
                reserved_bit.set(bit);
            }
        }

    }
};

#endif /*BITMAP_H_*/

