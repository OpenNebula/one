/*******************************************************************************
 * Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)
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
import org.opennebula.client.template.*;



public class TemplateTest
{

    private static Template template;
    private static TemplatePool templatePool;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_template";


    private static String template_str =
        "NAME = \"" + name + "\"\n" +
        "ATT1 = \"val1\"";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client          = new Client();
        templatePool    = new TemplatePool(client);
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
        res = Template.allocate(client, template_str);

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        template = new Template(oid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        template.delete();
    }

    @Test
    public void allocate()
    {
        template.delete();

        res = Template.allocate(client, template_str);
        assertTrue( !res.isError() );

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        template = new Template(oid, client);


        templatePool.info();

        boolean found = false;
        for(Template temp : templatePool)
        {
            found = found || temp.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = template.info();
        assertTrue( !res.isError() );

//        assertTrue( template.getId().equals("0") );
//        assertTrue( template.id() == 0 );
        assertTrue( template.getName().equals(name) );
    }

    @Test
    public void update()
    {
        // Update an existing att.
        res = template.update("ATT1", "new_val_1");
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );
        assertTrue( template.xpath("TEMPLATE/ATT1").equals("new_val_1") );

        // Create a new att.
        res = template.update("ATT2", "new_val_2");
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );
        assertTrue( template.xpath("TEMPLATE/ATT2").equals("new_val_2") );
    }

    @Test
    public void rmattr()
    {
        res = template.rmattr("ATT1");
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.xpath("ATT1").equals("") );
    }

    @Test
    public void publish()
    {
        res = template.publish();
        assertTrue( !res.isError() );

        template.info();
        assertTrue( template.isPublic() );
    }

    @Test
    public void unpublish()
    {
        res = template.unpublish();
        assertTrue( !res.isError() );

        template.info();
        assertTrue( !template.isPublic() );
    }

    @Test
    public void attributes()
    {
        res = template.info();
        assertTrue( !res.isError() );

//        assertTrue( template.xpath("ID").equals("0") );
        assertTrue( template.xpath("NAME").equals(name) );
    }

//    @Test
    public void delete()
    {
        res = template.delete();
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( res.isError() );
    }
}
