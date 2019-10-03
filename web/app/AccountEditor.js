if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  AccountEditor
//******************************************************************************
/**
 *   Popup window used to create and edit accounts
 *
 ******************************************************************************/

javaxt.express.finance.AccountEditor = function() {

    var me = this;
    var form, win;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){
        var body = document.getElementsByTagName("body")[0];
        var div = document.createElement("div");


        var config = {};
        config.style = javaxt.express.finance.style;


      //Create form
        form = new javaxt.dhtml.Form(div, {
            style: config.style.form,
            items: [
                {
                    name: "name",
                    label: "Name",
                    type: "text",
                    required: true
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea"
                },
                {
                    name: "active",
                    label: "Active",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "True",
                            value: true
                        },
                        {
                            label: "False",
                            value: false
                        }
                    ]
                },
                {
                    name: "id",
                    type: "hidden"
                }
            ],
            buttons: [
                {
                    name: "Cancel",
                    onclick: function(){
                        form.clear();
                        win.close();
                        me.onCancel();
                    }
                },
                {
                    name: "Submit",
                    onclick: function(){

                        var account = form.getData();
                        if (!account.name){
                            alert("Name is required");
                            return;
                        }

                        me.onSubmit();
                    }
                }
            ]
        });




      //Create window
        win = new javaxt.dhtml.Window(body, {
            width: 450,
            valign: "top",
            modal: true,
            body: div,
            style: config.style.window
        });




      //Watch for enter key events
        form.el.addEventListener("keyup", function(e){
            if (e.keyCode===13){
                me.onSubmit();
            }
        });


      //Broadcast onChange events
        form.onChange = function(formInput, value){
            me.onChange(formInput.name, value);
        };
    };


  //**************************************************************************
  //** getValues
  //**************************************************************************
    this.getValues = function(){
        var account = form.getData();
        if (isNumber(account.id)) account.id = parseInt(account.id);
        else delete account.id;
        if (account.active==="true") account.active = true;
        else account.active = false;
        return account;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(name, value){
        form.setValue(name, value);
    };


    this.onCancel = function(){};
    this.onSubmit = function(){};

    this.onChange = function(name, value){};

    this.clear = function(){
        form.clear();
    };


    this.setTitle = function(str){
        win.setTitle(str);
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        win.show();
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        win.hide(); //same as close
    };


  //**************************************************************************
  //** close
  //**************************************************************************
    this.close = function(){
        win.close();
    };


    var isNumber = javaxt.express.finance.utils.isNumber;


    init();
};