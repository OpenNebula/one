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

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;


public class DocumentTest
{
    private static GenericObjA      objA;
    private static GenericObjB      objB;
    private static GenericObjAPool  objAPool;
    private static GenericObjBPool  objBPool;

    private static Client client;

    private static OneResponse res;

    private static String nameA = "obj_one";
    private static String nameB = "obj_two";

    private static String template_one =
        "NAME = \"" + nameA + "\"\n" +
        "ATT1 = \"VAL1\"\n" +
        "ATT2 = \"VAL2\"";

    private static String template_two =
            "NAME = \"" + nameB + "\"\n" +
            "ATT1 = \"VAL1\"\n" +
            "ATT2 = \"VAL2\"";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        objAPool    = new GenericObjAPool(client);
        objBPool    = new GenericObjBPool(client);
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
        res = GenericObjA.allocate(client, template_one);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int oidA = Integer.parseInt(res.getMessage());
        objA = new GenericObjA(oidA, client);

        res = GenericObjB.allocate(client, template_two);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int oidB = Integer.parseInt(res.getMessage());
        objB = new GenericObjB(oidB, client);

        res = objA.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = objB.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        objA.delete();
        objB.delete();
    }

    @Test
    public void sameOidSpace()
    {
        assertTrue(
            "objA id : " +  objA.getId() + "; objB id : " +  objB.getId(),
            objB.id() == objA.id()+1  );
    }

    @Test
    public void differentPools()
    {
        res = objAPool.infoAll();
        assertTrue( res.getErrorMessage(), !res.isError() );

        boolean foundA = false;
        boolean foundB = false;

        for(GenericObjA ob : objAPool)
        {
            foundA = foundA || ob.getName().equals(nameA);
            foundB = foundB || ob.getName().equals(nameB);
        }

        assertTrue( foundA );
        assertTrue( !foundB );



        res = objBPool.infoMine();
        assertTrue( res.getErrorMessage(), !res.isError() );

        foundA = false;
        foundB = false;

        for(GenericObjB ob : objBPool)
        {
            foundA = foundA || ob.getName().equals(nameA);
            foundB = foundB || ob.getName().equals(nameB);
        }

        assertTrue( !foundA );
        assertTrue( foundB );
    }

    @Test
    public void lock()
    {
        res = objA.lock("doctest");
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( res.getMessage(), res.getBooleanMessage() == true );

        res = objA.lock("doctest");
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( res.getMessage(), res.getBooleanMessage() == false );

        res = objA.unlock("doctest");
        assertTrue( res.getErrorMessage(), !res.isError() );
    }
}
