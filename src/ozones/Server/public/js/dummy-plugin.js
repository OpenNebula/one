//Sunstone dummy plugin

//********PART 1 - Static contents and global variables declaration*****

//This is the content of the dummy tab
var dummy_plugin_tab_content = '\
<div><h3>This is the dummy plugin</h3>\
<p style="margin-top:10px">The dummy plugin is a playground to \
learn and test Sunstone plugins \
capabilities. This words are part of the the dummy plugin main tab \
content. In this content, we are going to include an special div element \
which will be filled in with some action buttons doing some crazy stuff.\
This special div must be of class "action_blocks": </p>\
<div class="action_blocks"></div>\
<div id="edit_me" style="border: 1px solid; margin-top: 20px">I am some\
text inside a div. I will be affected by some actions</div>\
<div id="dummy_count" style="border: 1px solid; margin-top: 20px">\
You have clicked the "increase count" button <span id="dummy_number">0</span> times</div>\
<div id="dummy_panel" style="border: 1px solid; margin-top: 20px">\
Click here to pop up an info panel</div>';

//This is a global variable to count how many times the user has
//clicked something
var dummy_plugin_count = 0;
var permission = false;
var permissionF = function() {return permission};



//******** PART2 - Sunstone configuration objects ***********

//Here we define some dummy actions. As we are not interacting with
//opennebula.js we are using "custom" actions.
var dummy_plugin_actions = {
    
    //Do nothing, just notify that this action is run
    "Dummy.notifyMe" : {
        type: "custom",
        call: function() {
          return true;  
        },
        notify:true
    },
    
    //Increase the dummy count
    "Dummy.increaseCount" : {
        type: "custom",
        call: function(number){
            if (number) {
                dummy_plugin_count += number;
            }
            else {
                dummy_plugin_count += 1;
            };
            $('#dummy_count #dummy_number').html(dummy_plugin_count);
        }
    },
    
    //Double the count
    "Dummy.doubleCount" : {
        type: "custom",
        call: function() {
            Sunstone.runAction("Dummy.increaseCount",dummy_plugin_count*2);
        }
    },
    
    //Add a new tab dynamicly
    "Dummy.addDummyTab2": {
        type: "custom",
        call: function(){
            var tab = {
                title: "Dummy tab 2",
                content: "You have dynamicly added this tab!"
            };
            Sunstone.addMainTab("dummy_tab2",tab,true);
            $('#edit_me').html("You added a tab!");
        },
        notify:true,
    },
    
    
    //Remove dynamicly a tab
    "Dummy.removeDummyTab2": {
        type: "custom",
        call: function() {
            Sunstone.removeMainTab("dummy_tab2",true);
        },
        notify:true
    },
    
    //Enable/disable permission (used to run action)
    "Dummy.enDisPermission": {
        type: "custom",
        call: function(){
            permission=!permission;
            $('#edit_me').html("Permissions set to "+permission);
        }
    },
    
    //Run an conditioned action
    "Dummy.runIfPermission": {
        type: "custom",
        call: function() {
            $('#edit_me').html("You had permission to run an action!!");
        },
        notify: true,
        condition: permissionF
    },
    
    //Regenerate buttons
    "Dummy.regenerateButtons": {
        type: "custom",
        call: function() {
            Sunstone.updateMainTabButtons("dummy_tab",dummy_plugin_buttons,true);
        }
    }
}

//And here we create buttons for the actions above. Note that buttons are
//going to become clickable elements in the DOM. That doesn't mean there
//needs every action needs a button as actions are simply run with
//Sunstone.runAction(action_name, [param], [extra_param]).

//However, every button does need an action. The name of the button and
//the name of the action it will run has to be the same.

var dummy_plugin_buttons = {
       //Do nothing, just notify that this action is run
    "Dummy.notifyMe" : {
        type: "action",
        text: "Notify me!",
    },
    
    //Increase the dummy count
    "Dummy.increaseCount" : {
        type: "action",
        text: "Increase count",
    },
    
    //Double the count - for such a serious action we need
    //the user to confirm it!! Therefore we use a "confirm" button.
    //Also we need certain permissions to have this button included.
    "Dummy.doubleCount" : {
        type: "confirm",
        text: "Double count",
        tip: "This will double the count.",
        condition: permissionF
    },
    
    //Add a new tab dynamicly
    "Dummy.addDummyTab2": {
       type: "action",
       text: "Add tab",
    },
    
    
    //Remove dynamicly a tab
    "Dummy.removeDummyTab2": {
       type: "action",
       text: "Remove tab"
    },
    
    //Enable/disable permission (used to run action)
    "Dummy.enDisPermission": {
        type: "action",
        text: "Enable, disable permissions",
    },
    
    //Run an conditioned action
    "Dummy.runIfPermission": {
       type: "action",
       text: "Run with permission",
    },
    
    //Regenerate buttons
    "Dummy.regenerateButtons": {
        type: "action",
        text: "Regenerate buttons",
    }
}


//We can now create a tab
var dummy_plugin_tab = {
    title: "Dummy plugin!",
    content: dummy_plugin_tab_content,
    buttons: dummy_plugin_buttons    
}

//And why not, an info panel

var dummy_plugin_info_panel = {
    "dummy_info_tab1" : {
        title: "1st Tab",
        content: "This is tab1"
    },
    "dummy_info_tab2" : {
        title: "2nd Tab",
        content: "This is tab2"
    },
    "dummy_info_tab3" : {
        title: "3rd Tab",
        content: "This is tab3"
    },
}

//********PART 3: Add config to Sunstone *********

Sunstone.addActions(dummy_plugin_actions);
Sunstone.addMainTab('dummy_tab',dummy_plugin_tab);
Sunstone.addInfoPanel('dummy_info_panel',dummy_plugin_info_panel);

//********PART 4: DOM-dependant initializations and user interaction****

$(document).ready(function() {
    //Lets add a listener to show our info panel:
    
    $('#dummy_panel').click(function() {
        Sunstone.popUpInfoPanel('dummy_info_panel');
    });
    
})