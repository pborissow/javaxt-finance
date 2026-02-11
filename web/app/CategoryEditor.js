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
    var form, win, iconInput, iconDiv, iconWindow;



  //**************************************************************************
  //** Constructor
  //**************************************************************************

    var init = function(){

        config = merge(config, defaultConfig);



      //Create icon ComboBox
        var iconComboBox = new javaxt.dhtml.ComboBox(createElement("div"), {
            readOnly: true,
            showMenuOnFocus: false,
            placeholder: "Select an icon...",
            style: config.style.combobox
        });
        iconComboBox.el.className += " icon-input";
        var iconButton = iconComboBox.getButton();
        iconButton.innerHTML = "...";
        iconButton.style.backgroundImage = "none";
        iconInput = iconComboBox.getInput();
        iconInput.disabled = true;

        var menuDiv = iconComboBox.el.childNodes[1];
        iconDiv = createElement("div", menuDiv, "icon-div");
        addShowHide(iconDiv);
        iconDiv.hide();


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
            iconDiv.innerHTML = "";
            createElement("i", iconDiv, iconClass);
            iconDiv.show();
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
            if (formInput.name === "isExpense") updateIconStyle();
            me.onChange(formInput.name, value);
        };
    };


  //**************************************************************************
  //** updateIconStyle
  //**************************************************************************
  /** Updates the iconDiv className to reflect the current expense/revenue type
   */
    var updateIconStyle = function(){
        var data = form.getData();
        var typeClass = data.isExpense === true || data.isExpense === "true" ?
            "expense-icon" : "income-icon";
        iconDiv.className = "icon-div " + typeClass;
    };


  //**************************************************************************
  //** getValues
  //**************************************************************************
  /** Transforms form inputs into a category object
   */
    this.getValues = function(){

      //Get form data
        var category = form.getData();

      //Get category ID
        if (isNumber(category.id)) category.id = parseInt(category.id);
        else delete category.id;

      //Get accountID
        if (isNumber(category.accountID)) category.accountID = parseInt(category.accountID);
        else delete category.accountID;

      //Get icon value from ComboBox and store it in the info field
        var icon = iconInput.data || iconInput.value || null;
        if (icon){
            if (!category.info) category.info = {};
            category.info.icon = icon;
        }
        delete category.icon;

        return category;
    };


  //**************************************************************************
  //** setValue
  //**************************************************************************
    this.setValue = function(name, value){
        if (name === "info") {
            if (value && value.icon){
                iconInput.value = value.icon;
                iconInput.data = value.icon;
                iconDiv.innerHTML = "";
                createElement("i", iconDiv, value.icon);
                iconDiv.show();
            }
        }
        else {
            form.setValue(name, value);
            if (name === "isExpense") updateIconStyle();
        }
    };


  //**************************************************************************
  //** Events
  //**************************************************************************
    this.onCancel = function(){};
    this.onSubmit = function(){};
    this.onChange = function(name, value){};


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        form.clear();
        iconInput.value = "";
        iconInput.data = null;
        iconDiv.innerHTML = "";
        iconDiv.hide();
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
  //** Utils
  //**************************************************************************
    var isNumber = javaxt.express.finance.utils.isNumber;

    var createElement = javaxt.dhtml.utils.createElement;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;


    init();
};