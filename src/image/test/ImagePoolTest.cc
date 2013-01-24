/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "ImagePool.h"
#include "PoolTest.h"
#include "ObjectXML.h"

using namespace std;

const int uids[] = {0,1,2};

const char* unames[] = {"one","two","three"};
const char* gnames[] = {"oneadmin","group_two","users"};

const string names[] = {"Image one", "Second Image", "The third image"};
const string paths[] = {"/tmp/image_test", "/tmp/image_second_test", "/tmp/image_3_test"};

const string templates[] =
{
    "NAME          = \"Image one\"\n"
    "PATH = /tmp/image_test\n"
    "PERSISTENT    = YES\n"
    "DESCRIPTION   = \"This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.\"\n",

    "NAME          = \"Second Image\"\n"
    "PATH = /tmp/image_second_test\n"
    "DESCRIPTION   = \"This is a rather short description.\"\n",

    "NAME          = \"The third image\"\n"
    "PATH = /tmp/image_3_test\n"
    "# DESCRIPTION   = \"An image description\"\n"
    "BUS           = SCSI\n"
    "PROFILE       = STUDENT\n"
};

/* ************************************************************************* */
/* ************************************************************************* */

#include "NebulaTest.h"

class NebulaTestImage: public NebulaTest
{
public:
    NebulaTestImage():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_image_pool = true;
        need_imagem     = true;
        need_datastore_pool = true;
    }
};


class ImagePoolFriend : public ImagePool
{
public:
    ImagePoolFriend(SqlDB *                     db,
                    const string&               _default_type,
                    const string&               _default_dev_prefix,
                    vector<const Attribute *>   _restricted_attrs):

                    ImagePool(  db,
                                _default_type,
                                _default_dev_prefix,
                                _restricted_attrs){};


    int allocate(const int& uid, const std::string& stemplate, int* oid)
    {
        ImageTemplate * img_template;
        char *          error_msg = 0;
        int             rc;
        string          err;

        img_template = new ImageTemplate;
        rc = img_template->parse(stemplate,&error_msg);

        if( rc == 0 )
        {
            string uname = unames[uid];
            string gname = gnames[uid];

            return ImagePool::allocate(uid, 1, uname, gname, 
                        img_template, 0,"none", Image::FILE, "ds_data", -1, oid, err);
        }
        else
        {
            if (error_msg != 0 )
            {
                free(error_msg);
            }

            delete img_template;
            return -2;
        }
    };
};


/* ************************************************************************* */
/* ************************************************************************* */

class ImagePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (ImagePoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST ( names_initialization );
    CPPUNIT_TEST ( get_using_name );
    CPPUNIT_TEST ( wrong_get_name );
    CPPUNIT_TEST ( name_index );
    CPPUNIT_TEST ( chown_name_index );

    CPPUNIT_TEST_SUITE_END ();

protected:

    NebulaTestImage * tester;
    ImagePool *       ipool;
    ImageManager *    imagem;

    void bootstrap(SqlDB* db)
    {
        // setUp overwritten
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // setUp overwritten
        return ipool;
    };

    int allocate(int index)
    {
        int oid;
        return ((ImagePoolFriend*)pool)->allocate(uids[index],
                                            templates[index],
                                            &oid);

    };

    void check(int index, PoolObjectSQL* obj)
    {
        string st;

        CPPUNIT_ASSERT( obj != 0 );

        Image* img = static_cast<Image*>(obj);

        ObjectXML xml(img->to_xml(st));

        CPPUNIT_ASSERT( img->get_name() == names[index] );

        xml.xpath(st, "/IMAGE/UNAME", "-");
        CPPUNIT_ASSERT( st == unames[index] );

        xml.xpath(st, "/IMAGE/GNAME", "-");
        CPPUNIT_ASSERT( st == gnames[index] );

        xml.xpath(st, "/IMAGE/PATH", "-");
        CPPUNIT_ASSERT( st == paths[index] );
    };

public:
    ImagePoolTest(){xmlInitParser();};

    ~ImagePoolTest(){xmlCleanupParser();};

    void setUp()
    {
        create_db();

        tester = new NebulaTestImage();

        Nebula& neb = Nebula::instance();
        neb.start();

        ipool   = neb.get_ipool();
        imagem  = neb.get_imagem();

        pool    = ipool;
    };

    void tearDown()
    {
        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        imagem->finalize();
        pthread_join(imagem->get_thread_id(),0);

        //XML Library
        xmlCleanupParser();

        delete_db();

        delete tester;
    };
    /* ********************************************************************* */

    void names_initialization()
    {
        ImagePool * imp;
        Image *     img;

        // Allocate 2 images, so they are written to the DB.
        allocate(0);
        allocate(2);

        // Create a new pool, using the same DB. This new pool should read the
        // allocated images.
        vector<const Attribute *> restricted_attrs;
        imp = new ImagePool(db,"OS", "hd", restricted_attrs);

        img = imp->get(0, false);
        CPPUNIT_ASSERT( img != 0 );

        img = imp->get(2, false);
        CPPUNIT_ASSERT( img == 0 );

        img = imp->get(1, false);
        CPPUNIT_ASSERT( img != 0 );


        delete imp;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void get_using_name()
    {
        int oid_0, oid_1;
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        // ---------------------------------
        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        CPPUNIT_ASSERT( obj != 0 );
        check(0, obj);

        // Get using its name
        obj = imp->get(names[1], uids[1], true);
        CPPUNIT_ASSERT( obj != 0 );
        obj->unlock();

        check(1, obj);


        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // Get first object and check its integrity
        obj = imp->get(names[0], uids[0], false);
        check(0, obj);

        // Get using its name
        obj = imp->get(oid_1, false);
        check(1, obj);
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_get_name()
    {
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // The pool is empty
        // Non existing name
        obj = imp->get("Wrong name", 0, true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        obj = imp->get("Non existing name",uids[0], true);
        CPPUNIT_ASSERT( obj == 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void name_index()
    {
        Image   *img_oid, *img_name;
        int     oid_0;
        int     uid_0;
        string  name_0;

        oid_0 = allocate(0);

        CPPUNIT_ASSERT(oid_0 != -1);


        // ---------------------------------
        // Get by oid
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);

        name_0 = img_oid->get_name();
        uid_0  = img_oid->get_uid();

        img_oid->unlock();

        // Get by name and check it is the same object
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();

        // Get by oid
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        // Get by name and check it is the same object
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();

        // Get by name
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        // Get by oid and check it is the same object
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void chown_name_index()
    {
        Image   *img_oid, *img_name;
        int     oid;
        int     old_uid;
        int     new_uid = 3456;
        string  name;

        oid = allocate(0);

        CPPUNIT_ASSERT(oid != -1);


        // ---------------------------------
        // Get by oid
        img_oid = ipool->get(oid, true);
        CPPUNIT_ASSERT(img_oid != 0);

        name = img_oid->get_name();
        old_uid  = img_oid->get_uid();

        // Change owner and update cache index
        img_oid->set_user(new_uid, "new_username");
        ipool->update(img_oid);
        img_oid->unlock();

        ipool->update_cache_index(name, old_uid, name, new_uid);

        // Get by name, new_uid and check it is the same object
        img_name = ipool->get(name, new_uid, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // Get by name, old_uid and check it does not exist
        img_name = ipool->get(name, old_uid, true);
        CPPUNIT_ASSERT(img_name == 0);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();


        // Get by name, old_uid and check it does not exist
        img_name = ipool->get(name, old_uid, true);
        CPPUNIT_ASSERT(img_name == 0);

        // Get by oid
        img_oid = ipool->get(oid, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        // Get by name, new_uid and check it is the same object
        img_name = ipool->get(name, new_uid, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);
    }
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, ImagePoolTest::suite());
}
