if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  TransactionEditor
//******************************************************************************
/**
 *   Popup window used to edit transactions
 *
 ******************************************************************************/

javaxt.express.finance.TransactionEditor = function(config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {

    };

    var form, win;
    var account, category; //comboboxes
    var accounts; //datastore


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


      //Create comboboxes
        account = createComboBox(comboboxConfig);
        category = createComboBox(comboboxConfig);



      //Create form
        var div = document.createElement("div");
        form = new javaxt.dhtml.Form(div, {
            style: config.style.form,
            items: [
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
                    name: "Save",
                    onclick: function(){

                        var transaction = me.getValues();
                        if (!transaction.categoryID){
                            alert("Category is required");
                            return;
                        }

                        me.onSubmit();
                    }
                },
                {
                    name: "Cancel",
                    onclick: function(){
                        form.clear();
                        win.close();
                        me.onCancel();
                    }
                }
            ]
        });

        me.clear();



      //Create window
        win = new javaxt.dhtml.Window(document.body, {
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
        var transaction = form.getData();
        transaction.id = parseInt(transaction.id);
        return transaction;
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