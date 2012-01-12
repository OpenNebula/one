/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
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
        res = Image.allocate(client, template());

        int imgid = res.isError() ? -1 : Integer.parseInt(res.getMessage()); 
        image = new Image(imgid, client);
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

        res = Image.allocate(client, template());
        assertTrue( !res.isError() );

        int imgid = res.isError() ? -1 : Integer.parseInt(res.getMessage()); 
        image = new Image(imgid, client);


        res = imagePool.info();
        assertTrue( !res.isError() );

        boolean found = false;
        for(Image img : imagePool)
        {
            found = found || img.getName().equals("test_img_"+cont);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = image.info();
        assertTrue( !res.isError() );
        
//        assertTrue( image.getId().equals("0") );
//        assertTrue( image.id() == 0 );
        assertTrue( image.getName().equals("test_img_"+cont) );
    }

    @Test
    public void update()
    {
        res = image.info();
        assertTrue( !res.isError() );

        assertTrue( image.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( image.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_template =  "ATT2 = NEW_VAL\n" +
                        "ATT3 = VAL3";

        res = image.update(new_template);
        assertTrue( !res.isError() );


        res = image.info();
        assertTrue( !res.isError() );
        assertTrue( image.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( image.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( image.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }


//  TODO
//    @Test
    public void enable()
    {
        res = image.enable();
        assertTrue( !res.isError() );

        image.info();
        assertTrue( image.isEnabled() );
    }

//  TODO
//  @Test
    public void disable()
    {
        res = image.disable();
        assertTrue( !res.isError() );

        image.info();
        assertTrue( !image.isEnabled() );
    }
// TODO
/*
    @Test
    public void publish()
    {
        res = image.publish();
        assertTrue( !res.isError() );

        image.info();
        assertTrue( image.isPublic() );
    }

    @Test
    public void unpublish()
    {
        res = image.unpublish();
        assertTrue( !res.isError() );

        image.info();
        assertTrue( !image.isPublic() );
    }
*/
    @Test
    public void attributes()
    {
        res = image.info();
        assertTrue( !res.isError() );

//        assertTrue( image.xpath("ID").equals("0") );
        assertTrue( image.xpath("NAME").equals("test_img_"+cont) );
    }

    @Test
    public void delete()
    {
        res = image.delete();
        assertTrue( !res.isError() );

//        res = image.info();
//        assertTrue( res.isError() );
    }
}
