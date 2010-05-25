/* ------------------------------------------------------------------------ */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef IMAGE_H_
#define IMAGE_H_

#include "PoolSQL.h"
#include "ImageTemplate.h"

using namespace std;

/**
 *  The Image class.
 */
class Image : public PoolObjectSQL
{
public:
    /**
     *  Type of Images
     */
     enum ImageType
     {
         OS        = 0,
         CDROM     = 1,
         DATABLOCK = 2
     };
     
     /**
      *  Bus type
      */
      enum BusType
      {
          IDE      = 0,
          SCSI     = 1
      }; 
      
      /**
       *  Image State
       */
       enum ImageState
       {
           INIT      = 0,
           LOCKED    = 1,
           READY     = 2,
           USED      = 3
       }; 
     
    /**
     *  Function to write an Image on an output stream
     */
     friend ostream& operator<<(ostream& os, Image& i);
     
    // *************************************************************************
    // Virtual Network Public Methods
    // *************************************************************************

	/**
	 * Function to print the Image object into a string in plain text
	 *  @param str the resulting string
	 *  @return a reference to the generated string
	 */
	string& to_str(string& str) const;

	/**
	 * Function to print the Image object into a string in XML format
	 *  @param xml the resulting XML string
	 *  @return a reference to the generated string
	 */
	string& to_xml(string& xml) const;

    /**
     * Get the Image unique identifier IID, that matches the OID of the object
     *    @return IID Image identifier
     */
    int get_iid() const
    {
        return oid;
    };

    /**
     * Gets the uid of the owner of the Image
     * @return uid
     **/
    int get_uid()
    {
        return uid;
    }

    /**
     *  Returns Image's name
     *     @return name Image's name
     */
    const string& get_name() const
    {
        return name;
    };
    
    /**
     *  Set enum type
     *     @return 0 on success, -1 otherwise
     */ 
    int set_type(string _type)
    {
        int rc = 0;
        
        if ( _type == "OS" )
        {
            type = OS;
        }
        else if ( _type == "CDROM" )
        {
            type = CDROM;
        }
        else if ( _type == "DATABLOCK" )
        {
            type = DATABLOCK;
        }
        else
        {
            rc = -1;
        }
        
        return rc;
    }

    /**
     *  Set enum bus
     *     @return 0 on success, -1 otherwise
     */  
    int set_bus(string _bus)
    {
        int rc = 0;
        
        if ( _bus == "IDE" )
        {
            bus = IDE;
        }
        else if ( _bus == "SCSI" )
        {
            bus = SCSI;
        }
        else
        {
            rc = -1;
        }
        
        return rc;
    }
    
    /**
     * Get an image to be used in a VM
     * @param overwrite true if the image is going to be overwritten
     * @return boolean true if the image can be used
     */
    bool get_image(bool overwrite);
    

    /**
     * Releases an image being used by a VM
     */
    void release_image();
 

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        string& name,
        vector<const Attribute*>& values) const
    {
        return image_template.get(name,values);
    };

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        const char *name,
        vector<const Attribute*>& values) const
    {
        string str=name;
        return image_template.get(str,values);
    };

    /**
     *  Gets a string based Image attribute
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined
     */
    void get_template_attribute(
        const char *    name,
        string&         value) const
    {
        string str=name;
        image_template.get(str,value);
    }

    /**
     *  Gets a string based Image attribute
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined
     */
    void get_template_attribute(
        const char *    name,
        int&            value) const
    {
        string str=name;
        image_template.get(str,value);
    }
    
    /**
     *  Sets an Image single attribute
     *    @param name of the attribute
     *    @param value of the attribute (string)
     */
    void set_template_attribute(
        const string&   name,
        string          value) 
    {
        Attribute * single_attr;

        single_attr = new SingleAttribute(name,value);

        image_template.set(single_attr);
    }
    
    /**
     *  Sets a string based Image attribute
     *    @param name of the attribute
     *    @param values of the attribute (map)
     */
    void set_template_attribute(
        const string&       name,
        map<string,string>  value) 
    {
        Attribute * vector_attr;

        vector_attr = new VectorAttribute(name,value);

        image_template.set(vector_attr);
    }
    
    /**
     *  Removes an Image attribute
     *    @param name of the attribute
     */
    int remove_template_attribute(
        const string&   name) 
    {
        int                 rc;  
        vector<Attribute *> values;
        Attribute *         value;

        rc = image_template.remove(name, values);
        
        // Delete all pointers in the vector
        while (!values.empty())
        {
            value = values.front();     // Gets the pointer
            values.erase(values.begin()); // Removes it from the vector 
            delete value;               // Frees memory
        }       
        
        return rc;
    }

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class ImagePool;

    // -------------------------------------------------------------------------
    // Image Description
    // -------------------------------------------------------------------------

    /**
     *  Owner if the image
     */
    int         uid;

    /**
     *  The name of the Image
     */
    string       name;
    
    /**
     *  The description of the Image
     */
    string       description;
    
    /**
     *  Type of the Image
     */
    ImageType    type;
    
    /**
     *  Registration time
     */
    time_t       regtime;
    
    /**
     *  Path to the image
     */
    string      source;
     
    /**
     *  Device for the image to be attached into
     */
    string      target;
     
     /**
      *  IDE or SCSI
      */
    BusType     bus;
    
     /**
      *  Image state
      */
    ImageState  state;
    
    /**
     * Number of VMs using the image
     */
    int running_vms;     

    // -------------------------------------------------------------------------
    //  Image Attributes
    // -------------------------------------------------------------------------

    /**
     *  The Image template, holds the Image attributes.
     */
    ImageTemplate    image_template;


    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
    */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Callback function to unmarshall a Image object (Image::select)
     *    @param num the number of columns read from the DB
     *    @param names  the column names
     *    @param values the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Bootstraps the database table(s) associated to the Image
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss_image(Image::db_bootstrap);
        ostringstream oss_templ(ImageTemplate::db_bootstrap);

        db->exec(oss_image);
        db->exec(oss_templ);
    };

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Image(int id=-1);

    virtual ~Image();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    enum ColNames
    {                                                           
        OID              = 0,    /* Image identifier (IID)      */
        UID              = 1,    /* Image owner id              */
        NAME             = 2,    /* Image name                  */
        DESCRIPTION      = 3,    /* Image description           */
        TYPE             = 4,    /* 0) OS 1) CDROM 2) DATABLOCK */
        REGTIME          = 5,    /* Time of registration        */
        SOURCE           = 6,    /* Path to the image           */
        TARGET           = 7,    /* Device to be plugged into   */
        BUS              = 8,    /* 0) IDE 1) SCSI              */
        STATE            = 9,    /* 0) INIT   1) ALLOCATED      */
                                 /* 2) READY  3) USED           */
        RUNNING_VMS      = 10,   /* Number of VMs using the img */
        LIMIT            = 11    
    };
    
    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Reads the Image (identified with its OID=IID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db);

    /**
     *  Writes the Image in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int insert(SqlDB *db);

    /**
     *  Writes/updates the Images data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int update(SqlDB *db);

    /**
     *  Drops Image and associated template from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
     virtual int drop(SqlDB *db);

    /**
     *  Function to output an Image object in to an stream in XML format
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(ostringstream& oss, int num, char **values, char **names);
};

#endif /*IMAGE_H_*/
