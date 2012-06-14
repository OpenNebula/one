/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef IMAGE_MANAGER_H_
#define IMAGE_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "ImageManagerDriver.h"

using namespace std;

extern "C" void * image_action_loop(void *arg);

class Image;
class Template;

class ImageManager : public MadManager, public ActionListener
{
public:

    ImageManager(ImagePool * _ipool, vector<const Attribute*>& _mads):
            MadManager(_mads), ipool(_ipool)
    {
        am.addListener(this);
    };

    ~ImageManager(){};

    /**
     *  This functions starts the associated listener thread, and creates a 
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads the Image Driver defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula 
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application. 
     */
    void load_mads(int uid=0);
        
    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return imagem_thread;
    };

    /**
     *  Finalizes the Image Manager
     */
    void finalize()
    {
        am.trigger(ACTION_FINALIZE,0);
    };

    /**************************************************************************/
    /*                           Image Manager Actions                        */
    /* Operates in a semi-sinchronous mode. Operations will be granted or not */
    /* , when needed the image repository drivers will be used to perform FS  */
    /* operations in the background.                                          */
    /**************************************************************************/

    /**
     *  Try to acquire an image from the repository for a VM.
     *    @param image_id id of image
     *    @param error string describing the error
     *    @return pointer to the image or 0 if could not be acquired
     */
    Image * acquire_image(int image_id, string& error);
    
    /**
     *  Try to acquire an image from the repository for a VM.
     *    @param name of the image
     *    @param id of owner
     *    @param error string describing the error
     *    @return pointer to the image or 0 if could not be acquired
     */
    Image * acquire_image(const string& name, int uid, string& error);

    /**
     *  Releases an image and triggers any needed operations in the repo
     *    @param iid image id of the image to be released
     *    @param failed the associated VM releasing the images is FAILED
     */
    void release_image(int iid, bool failed);

    /**
     *  Enables the image
     *    @param to_enable true will enable the image.
     *    @return 0 on success
     */
    int enable_image(int iid, bool to_enable);

    /**
     *  Adds a new image to the repository copying or creating it as needed
     *    @param img pointer to the image
     *    @param ds_data data of the associated datastore in XML format
     *    @return 0 on success
     */
    int register_image(int iid, const string& ds_data);

    /**
     *  Deletes an image from the repository and the DB
     *    @param iid id of image
     *    @return 0 on success
     */
    int delete_image(int iid, const string& ds_data);

    /**
     *  Gets the size of an image by calling the STAT action of the associated
     *  datastore driver.
     *
     *  @param img_tmpl the template for the image
     *  @param ds_tmpl the template for the datastore
     *  @oaram result with a string representation of the size or if an error 
     *         occurred describing the error.
     *  @result 0 on success
     */
     int stat_image(Template* img_tmpl, const string& ds_tmpl, string& res);

private:
    /**
     *  Generic name for the Image driver
     */
     static const char *  image_driver_name;
    
    /**
     *  Thread id for the Transfer Manager
     */
    pthread_t             imagem_thread;

    /**
     *  Pointer to the Image Pool to access VMs
     */
    ImagePool *           ipool;
     
    /**
     *  Action engine for the Manager
     */
    ActionManager         am;

    /**
     *  Returns a pointer to the Image Manager Driver used for the Repository
     *    @return the Image Manager driver or 0 in not found
     */
    const ImageManagerDriver * get()
    {
        string name("NAME");

        return static_cast<const ImageManagerDriver *>
               (MadManager::get(0,name,image_driver_name));
    };
        
    /**
     *  Function to execute the Manager action loop method within a new pthread 
     * (requires C linkage)
     */
    friend void * image_action_loop(void *arg);    
        
    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(const string& action, void * arg);

    /**
     *  Acquires an image updating its state.
     *    @param image pointer to image, it should be locked
     *    @return 0 on success
     */
    int acquire_image(Image *img, string& error);

    /**
     *  Moves a file to an image in the repository
     *    @param image to be updated (it's source attribute)
     *    @param source path of the disk file 
     */
    void move_image(Image *img, const string& source);

    /**
     * Formats an XML message for the MAD
     *
     *    @param img_data Image XML representation
     *    @param ds_data Datastore XML representation
     *    @return the XML message
     */
    string * format_message(const string& img_data, const string& ds_data);
};

#endif /*IMAGE_MANAGER_H*/

