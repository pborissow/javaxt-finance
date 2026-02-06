if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  CategoryEditor
//******************************************************************************
/**
 *   Popup window used to create and edit categories
 *
 ******************************************************************************/

javaxt.express.finance.CategoryEditor = function(config) {

    var me = this;
    var defaultConfig = {
        style: javaxt.dhtml.style.default
    };
    var form, win, iconComboBox, iconWindow;



  //**************************************************************************
  //** Constructor
  //**************************************************************************

    var init = function(){

        config = merge(config, defaultConfig);



      //Create icon ComboBox
        var iconDiv = createElement("div");
        iconComboBox = new javaxt.dhtml.ComboBox(iconDiv, {
            readOnly: true,
            showMenuOnFocus: false,
            placeholder: "Select an icon...",
            style: config.style.combobox
        });
        var iconButton = iconComboBox.getButton();
        iconButton.innerHTML = "...";
        iconButton.style.backgroundImage = "none";
        var iconInput = iconComboBox.getInput();


      //Create form
        var div = createElement("div");
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
                    name: "icon",
                    label: "Icon",
                    type: iconComboBox
                },
                {
                    name: "isExpense",
                    label: "Type",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "Expense",
                            value: true
                        },
                        {
                            label: "Revenue",
                            value: false
                        }
                    ]
                },
                {
                    name: "id",
                    type: "hidden"
                },
                {
                    name: "accountID",
                    type: "hidden"
                }
            ],
            buttons: [
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


      //Create icon picker window
        iconWindow = new javaxt.dhtml.Window(document.body, {
            title: "Select Icon",
            width: 800,
            height: 600,
            modal: true,
            resizable: true,
            valign: "top",
            style: config.style.window
        });


      //Create IconSearch component in the window
        var iconSearch = new javaxt.express.finance.IconSearch(iconWindow.getBody(), config);
        iconSearch.onClick = function(iconClass){
            iconInput.value = iconClass;
            iconInput.data = iconClass;
            iconWindow.close();
        };


      //Override button click to show the icon picker window
        iconButton.onclick = function(e){
            e.preventDefault();
            iconWindow.show();
        };


      //Create window
        win = new javaxt.dhtml.Window(document.body, {
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
        var category = form.getData();
        if (isNumber(category.id)) category.id = parseInt(category.id);
        else delete category.id;
        if (isNumber(category.accountID)) category.accountID = parseInt(category.accountID);
        else delete category.accountID;

        // Get icon value from ComboBox
        if (iconComboBox) {
            var iconInput = iconComboBox.getInput();
            category.icon = iconInput.data || iconInput.value || null;
        }

        return category;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(name, value){
        if (name === "icon") {
            var iconInput = iconComboBox.getInput();
            iconInput.value = value || "";
            iconInput.data = value || null;
        }
        else {
            form.setValue(name, value);
        }
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
    var createElement = javaxt.dhtml.utils.createElement;
    var merge = javaxt.dhtml.utils.merge;


    init();
};