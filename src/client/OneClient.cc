/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include "OneClient.h"
#include <fstream>
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::allocate(string template_file, int& vmid, string& error)
{
		    
	try {
		ifstream file;
		string   str_template="";
	 
		file.exceptions (ifstream::failbit | ifstream::badbit );
	 
		file.open(template_file.c_str());
	 
		while (file.good())
		{
			str_template += file.get();
		}
	 
		file.close();

		xmlrpc_c::value result;	
		this->call(url,
				"one.vmallocate",
				"ss",
				&result,
				session.c_str(),
				str_template.c_str());
		
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
		
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
		
		if(static_cast<bool>(status) == true) 
		{	
			xmlrpc_c::value_int const _vmid (paramArrayValue[1]);            
			
			vmid = static_cast<int>(_vmid);
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e) 
	{
		ostringstream oss;
    	oss << "XML-RPC Error: " << e.what() << endl;
    	
		error=oss.str();
		return -1;
   	}		
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::deploy(int vmid, int hid, string& error)
{
	try {
		xmlrpc_c::value result;
		
   		this->call(url,"one.vmdeploy","sii", &result,session.c_str(),vmid,hid);

		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);
		
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
		
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
		
		if(static_cast<bool>(status) == true) 
		{	
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e) 
	{
		ostringstream oss;
    	oss << "XML-RPC Error: " << e.what() << endl;
    	
		error=oss.str();
		return -1;
   	}
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::migrate(int vmid, int hid, bool live, string& error)
{
	try {
		xmlrpc_c::value result;
		
		this->call(url,
				"one.vmmigrate",
				"siib", 
				&result,
				session.c_str(),
				vmid,hid,live);
	
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
	
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
		
		if(static_cast<bool>(status) == true) 
		{	
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
			ostringstream oss;
	    	oss << "XML-RPC Error: " << e.what() << endl;
	    	
			error=oss.str();
			return -1;
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::action(int vmid, const char * action, string& error)
{
	try {
		xmlrpc_c::value result;
		
		this->call(url,
				"one.vmaction",
				"ssi", 
				&result,
				session.c_str(),
				action,
				vmid);
		
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
		
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
		
		if(static_cast<bool>(status) == true) 
		{	
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
			ostringstream oss;
	    	oss << "XML-RPC Error: " << e.what() << endl;
	    	
			error=oss.str();
			return -1;
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::info(int vmid, string& info, string& error)
{
	try{
		xmlrpc_c::value result;
		this->call(url,"one.vmget_info","si",&result,session.c_str(),vmid);
			
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
	
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
						
		xmlrpc_c::value_string const valueS(paramArrayValue[1]);	
			
		if(static_cast<bool>(status) == true) 
		{	
			info = static_cast<string>(valueS);
			return 0;
		}
		else
		{	
			error = static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
		ostringstream oss;
		oss << "XML-RPC Error: " << e.what() << endl;
		    	
		error=oss.str();
		return -1;
	}				
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::host_info(int hid, string& info, string& error)
{
	try{
		xmlrpc_c::value result;
		this->call(url,"one.hostinfo","si",&result,session.c_str(),hid);
   
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());

		//check posible Errors:
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
				
		xmlrpc_c::value_string const valueS (paramArrayValue[1]);

		if(static_cast<bool>(status) == true) 
		{	
			info = static_cast<string>(valueS);
			return 0;
		}
		else
		{	
			error = static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
		ostringstream oss;
		oss << "XML-RPC Error: " << e.what() << endl;
		    	
		error=oss.str();
		return -1;
	}				
}		

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::host_delete(int hid, string& error)
{
	try {
		xmlrpc_c::value result;
		this->call(url, "one.hostdelete", "si", &result,session.c_str(), hid);
   
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
		
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
		
		if(static_cast<bool>(status) == true) 
		{	
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
			ostringstream oss;
	    	oss << "XML-RPC Error: " << e.what() << endl;
	    	
			error=oss.str();
			return -1;
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::host_available(int hid, bool enable, string& error)
{

	try{
		xmlrpc_c::value result;
		this->call(url, 
				"one.hostenable",
				"sib",
				&result,
				session.c_str(),
				hid,
				enable);
   
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
		
		//check posible errors
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
			
		if(static_cast<bool>(status) == true) 
		{	
			return 0;
		}
		else
		{	
			xmlrpc_c::value_string const valueS(paramArrayValue[1]);
				
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
			ostringstream oss;
	    	oss << "XML-RPC Error: " << e.what() << endl;
	    	
			error=oss.str();
			return -1;
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OneClient::host_allocate(string& name, 
		  string& im_mad, 
		  string& vmm_mad,
		  int&    hid,
		  string& error)
{

	try{
		xmlrpc_c::value result;
		this->call(url,
				"one.hostallocate",
				"sssssb", 
				&result,
				session.c_str(),
				name.c_str(),
				im_mad.c_str(),
				vmm_mad.c_str(),
				"tm_mad",
				true);
		    
		xmlrpc_c::value_array resultArray = xmlrpc_c::value_array(result);         
		vector<xmlrpc_c::value> const 
			paramArrayValue(resultArray.vectorValueValue());
	
		//check posible errors:
		xmlrpc_c::value_boolean const status(paramArrayValue[0]);
			
		if (static_cast<bool>(status) == true) 
		{	
			xmlrpc_c::value_int const valueI (paramArrayValue[1]);
			
			hid = static_cast<int>(valueI);
			return 0;

		}
		else
		{	
			xmlrpc_c::value_string const valueS = (paramArrayValue[1]);
			
			error=static_cast<string>(valueS);
			return -1;
		}
	}
	catch (std::exception const &e)
	{
				ostringstream oss;
		    	oss << "XML-RPC Error: " << e.what() << endl;
		    	
				error=oss.str();
				return -1;
	}		
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

