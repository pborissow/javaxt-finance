if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  RuleEditor
//******************************************************************************
/**
 *   Popup window used to create and edit rules
 *
 ******************************************************************************/

javaxt.express.finance.RuleEditor = function(config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {

    };

    var form, win;
    var account, category;
    var accounts;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


        accounts = orgConfig.accounts;


      //Create config for comboboxes
        var comboboxConfig = {
            style: config.style.combobox,
            scrollbar: true
        };


      //Create "active" combobox
        var active = createComboBox(comboboxConfig);
        active.add("True", true);
        active.add("False", false);
        active.setValue(true);


      //Create "field" combobox
        var field = createComboBox(comboboxConfig);
        field.add("Description");


      //Create "filter" combobox
        var filter = createComboBox(comboboxConfig);
        filter.add("Contains");
        filter.add("Starts With");
        filter.add("Ends With");
        filter.add("Equals");


      //Create "account" and "category" combobox
        account = createComboBox(comboboxConfig);
        category = createComboBox(comboboxConfig);


      //Create form
        var div = document.createElement("div");
        form = new javaxt.dhtml.Form(div, {
            style: config.style.form,
            items: [
                {
                    group: "Basic Info",
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
                            type: "textarea",
                            height: "50px"
                        },
                        {
                            name: "active",
                            label: "Active",
                            type: active
                        }
                    ]
                },
                {
                    group: "Trigger",
                    items: [
                        {
                            name: "field",
                            label: "Field",
                            type: field,
                            required: true
                        },
                        {
                            name: "filter",
                            label: "Filter",
                            type: filter,
                            required: true
                        },
                        {
                            name: "keyword",
                            label: "Keyword",
                            type: "text",
                            required: true
                        }
                    ]
                },
                {
                    group: "Assign To",
                    items: [
                        {
                            name: "accountID",
                            label: "Account",
                            type: account
                        },
                        {
                            name: "categoryID",
                            label: "Category",
                            type: category,
                            required: true
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
        var body = document.getElementsByTagName("body")[0];
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


      //Watch for onchange events
        form.onChange = function(formInput, value){
            if (formInput.name==="accountID"){
                category.clear();
                var accountID = parseInt(formInput.getValue());
                if (isNumber(accountID)){
                    for (var i=0; i<accounts.length; i++){
                        var a = accounts.get(i);
                        if (a.id===accountID){
                            for (var j=0; j<a.categories.length; j++){
                                var c = a.categories.get(j);
                                category.add(c.name, c.id);
                            }
                            break;
                        }
                    }
                }
            }

          //Broadcast onChange events
            me.onChange(formInput.name, value);
        };
    };


  //**************************************************************************
  //** getValues
  //**************************************************************************
    this.getValues = function(){
        var data = form.getData();
        var rule = {
            id: data.id,
            name: data.name,
            description: data.description,
            active: data.active,
            info: {

            }
        };


        if (isNumber(rule.id)) rule.id = parseInt(rule.id);
        else delete rule.id;
        delete data.id;
        delete data.name;
        delete data.description;
        delete data.active;
        delete data.accountID;
        rule.info = data;

        return rule;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(name, value){
        if (name==="categoryID"){
            var categoryID = value;
            for (var i=0; i<accounts.length; i++){
                var account = accounts.get(i);
                if (account.categories){
                    for (var j=0; j<account.categories.length; j++){
                        var category = account.categories.get(j);
                        if (category.id===categoryID){
                            form.setValue("accountID", account.id);
                            form.setValue("categoryID", categoryID);
                            i = accounts.length;
                            break;
                        }
                    }
                }
            }
        }
        else{
            form.setValue(name, value);
        }
    };


    this.onCancel = function(){};
    this.onSubmit = function(){};

    this.onChange = function(name, value){};


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        form.reset();

      //Update the "account" and "category" combo boxes
        account.clear();
        category.clear();
        for (var i=0; i<accounts.length; i++){
            var a = accounts.get(i);
            account.add(a.name, a.id);
        }
    };


  //**************************************************************************
  //** setTitle
  //**************************************************************************
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


  //**************************************************************************
  //** createComboBox
  //**************************************************************************
    var createComboBox = function(comboboxConfig){
        return new javaxt.dhtml.ComboBox(document.createElement("div"), comboboxConfig);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var isNumber = javaxt.express.finance.utils.isNumber;


    init();
};