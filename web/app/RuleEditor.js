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
    var field, filter, source, account, category, active; //comboboxes
    var accounts, sourceAccounts, vendors; //datastores


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
        sourceAccounts = orgConfig.sourceAccounts;
        vendors = orgConfig.vendors;


      //Create config for comboboxes
        var comboboxConfig = {
            style: config.style.combobox,
            scrollbar: true
        };



      //Create comboboxes
        field = createComboBox(comboboxConfig);
        filter = createComboBox(comboboxConfig);
        source = createComboBox(comboboxConfig);
        account = createComboBox(comboboxConfig);
        category = createComboBox(comboboxConfig);
        active = createComboBox(comboboxConfig);


      //Create form
        var div = document.createElement("div");
        form = new javaxt.dhtml.Form(div, {
            style: config.style.form,
            items: [
                {
                    group: "Rule",
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
                            name: "sourceAccountID",
                            label: "Source",
                            type: source,
                            required: true
                        },
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
                    name: "Save",
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

        me.clear();



      //Create window
        var body = document.getElementsByTagName("body")[0];
        win = new javaxt.dhtml.Window(body, {
            width: 450,
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


      //Update active
        active.add("True", true);
        active.add("False", false);
        active.setValue(true);


      //Update field
        field.clear();
        field.add("Description");


      //Update filter
        filter.clear();
        filter.add("Contains");
        filter.add("Starts With");
        filter.add("Ends With");
        filter.add("Equals");


      //Update the "account" and "category" combo boxes
        account.clear();
        category.clear();
        for (var i=0; i<accounts.length; i++){
            var a = accounts.get(i);
            account.add(a.name, a.id);
        }

      //Update the "source" combobox
        source.clear();
        var arr = [];
        for (var i=0; i<sourceAccounts.length; i++){
            var sourceAccount = sourceAccounts.get(i);
            arr.push({
                name: getName(sourceAccount),
                id: sourceAccount.id
            });
        }
        arr.sort(function(a, b) {
           return a.name.localeCompare(b.name);
        });
        source.add("Any", null);
        for (var i=0; i<arr.length; i++){
            source.add(arr[i].name, arr[i].id);
        }
        source.setValue("Any");


    };


    var getName = function(sourceAccount){
        if (sourceAccount.id===null) return "Any";
        var name = sourceAccount.accountName;
        var vendorID = sourceAccount.vendorID;
        for (var j=0; j<vendors.length; j++){
            var vendor = vendors.get(j);
            if (vendor.id===vendorID){
                name += " (" + vendor.name + ")";
                break;
            }
        }
        return name;
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