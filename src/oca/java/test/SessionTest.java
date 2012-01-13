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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import org.junit.Test;
import org.opennebula.client.Client;

public class SessionTest {

	@Test
	public void createSession()
	{
        Client oneClient = null;
        try
        {
            oneClient = new Client();
        }
        catch (Exception e)
        {
            System.out.println(e.getMessage());
        }

        assertNotNull(oneClient);
	}

	@Test
	public void wrong_url()
	{
	    Client oneClient = null;
        try
        {
            // The HTTP is misspelled
            oneClient = new Client(null,"HTP://localhost:2633/RPC2");
        }
        catch (Exception e)
        {
//            System.out.println(e.getMessage());
        }

        assertNull("Client should complain about misspelled url", oneClient);
	}	
}
