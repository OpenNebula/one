/*******************************************************************************
 * Copyright 2002-2016, OpenNebula Project, OpenNebula Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.image.*;



public class ImageTest
{

    private static Image image;
    private static ImagePool imagePool;

    private static Client client;

    private static OneResponse res;
    private static int cont = 0;

    private static String template()
    {
        cont++;

        return  "NAME = \"test_img_" + cont + "\"\n" +
                "PATH = /etc/hosts\n" +
                "ATT1 = \"VAL1\"\n" +
                "ATT2 = \"VAL2\"";
    }

    /**
     *  Wait until the Image changes to the specified state.
     *  There is a time-out of 10 seconds.
     */
    static void waitAssert(Image img, String state)
    {
        int n_steps     = 10;
        int step        = 1000;

        int i = 0;

        img.info();

        while( !( img.stateString().equals(state) || i > n_steps )
              && !img.stateString().equals("ERROR") )
        {
            try{ Thread.sleep(step); } catch (Exception e){}

            img.info();
            i++;
        }

        assertTrue(
                "Image timeout, wanted state: " + state + "; it is in state "
                + img.stateString(), img.stateString().equals(state) );
    }

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        imagePool   = new ImagePool(client);
    }

    /**
     * @throws java.lang.Exception
     */
    @AfterClass
    public static void tearDownAfterClass() throws Exception
    {
    }

    /**
     * @throws java.lang.Exception
     */
    @Before
    public void setUp() throws Exception
    {
        res = Image.allocate(client, template(), 1);

        int imgid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        image = new Image(imgid, client);

        waitAssert(image, "READY");
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        image.delete();
    }

    @Test
    public void allocate()
    {
        image.delete();

        res = Image.allocate(client, template(), 1);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int imgid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        image = new Image(imgid, client);


        res = imagePool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        boolean found = false;
        for(Image img : imagePool)
        {
            found = found || img.getName().equals("test_img_"+cont);
        }

        assertTrue( found );
    }

    @Test
    public void clone_method()
    {
        res = image.clone("cloned_image");
        assertTrue(res.getErrorMessage(), !res.isError());

        int imgid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        Image cloned_image = new Image(imgid, client);

        res = imagePool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        boolean found = false;
        for(Image img : imagePool)
        {
            found = found || img.getName().equals("cloned_image");
        }

        assertTrue( found );

        res = cloned_image.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( cloned_image.getName().equals("cloned_image") );
    }

    @Test
    public void info()
    {
        res = image.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( image.getId().equals("0") );
//        assertTrue( image.id() == 0 );
        assertTrue( image.getName().equals("test_img_"+cont) );
    }

    @Test
    public void update()
    {
        res = image.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( image.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( image.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_template =  "ATT2 = NEW_VAL\n" +
                        "ATT3 = VAL3";

        res = image.update(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );


        res = image.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( image.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( image.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( image.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void enable()
    {
        res = image.enable();
        assertTrue( res.getErrorMessage(), !res.isError() );

        image.info();
        assertTrue( image.isEnabled() );
    }

    @Test
    public void disable()
    {
        res = image.disable();
        assertTrue( res.getErrorMessage(), !res.isError() );

        image.info();
        assertTrue( res.getErrorMessage(), !image.isEnabled() );
    }

    @Test
    public void publish()
    {
        res = image.publish();
        assertTrue( res.getErrorMessage(), !res.isError() );

        image.info();
        assertTrue( image.xpath("PERMISSIONS/GROUP_U").equals( "1" ) );
    }

    @Test
    public void unpublish()
    {
        res = image.unpublish();
        assertTrue( res.getErrorMessage(), !res.isError() );

        image.info();
        assertTrue( image.xpath("PERMISSIONS/GROUP_U").equals( "0" ) );
    }

    @Test
    public void attributes()
    {
        res = image.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( image.xpath("ID").equals("0") );
        assertTrue( image.xpath("NAME").equals("test_img_"+cont) );
    }

    @Test
    public void delete()
    {
        res = image.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        res = image.info();
//        assertTrue( res.isError() );
    }
}
