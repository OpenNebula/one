/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs
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

import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.OneSystem;
import org.opennebula.client.user.User;
import org.opennebula.client.user.UserPool;
import org.w3c.dom.Node;

public class UserTest
{

    private static User     user;
    private static UserPool userPool;

    private static Client client;

    private static OneResponse  res;
    private static String       name      = "new_test_user";
    private static String       password  = "new_test_password";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        userPool    = new UserPool(client);
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
        res = User.allocate(client, name, password);

        assertTrue( res.getErrorMessage(), !res.isError() );

        int uid = Integer.parseInt(res.getMessage());
        user    = new User(uid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        user.delete();
    }


    @Test
    public void allocate()
    {
        userPool.info();

        boolean found = false;
        for(User u : userPool)
        {
            found = found || u.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.id() >= 0 );
        assertTrue( user.getName().equals(name) );
    }

    @Test
    public void attributes()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("NAME").equals(name) );
        assertTrue( user.xpath("ENABLED").equals("1") );
    }

    @Test
    public void chauth()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("AUTH_DRIVER").equals("core") );

        res = user.chauth("new_driver", password);

        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("AUTH_DRIVER").equals("new_driver") );
    }

    @Test
    public void update()
    {
        String new_template =  "ATT2 = NEW_VAL\n" +
                "ATT3 = VAL3";

        res = user.update(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( user.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( user.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( user.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void delete()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( user.isEnabled() );

        res = user.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = user.info();
        assertTrue( res.getErrorMessage(), res.isError() );
    }

    @Test
    public void defaultqutoas()
    {
        OneSystem system = new OneSystem(client);

        res = system.getUserQuotas();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = system.setUserQuotas("VM = [ VMS = 7, MEMORY = 0, CPU = 3, VOLATILE_SIZE = 1 ]");
        assertTrue( res.getErrorMessage(), !res.isError() );

        Node node = system.getUserQuotasXML();
        XPathFactory factory = XPathFactory.newInstance();
        XPath xpath = factory.newXPath();

        try
        {
            assertTrue( xpath.evaluate("VM_QUOTA/VM/VMS", node).equals("7") );
        } catch (XPathExpressionException e)
        {
            assertTrue(e.getMessage(), false);
        }
    }
}
