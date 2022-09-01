if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  ImportWizard
//******************************************************************************
/**
 *   Window-based form wizard used to select or create a template.
 *
 ******************************************************************************/

javaxt.express.finance.ImportWizard = function(config) {

    var me = this;
    var win;
    var body = document.getElementsByTagName("body")[0];
    var mainDiv, backButton, nextButton, advancedButton;
    var panels = [];
    var history = [];
    var idx = 0;

    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var dateDisplayFormat;
    var datePopup;
    var data, vendor, template, account;
    var columnEditor;


    var defaultConfig = {
        style: javaxt.dhtml.style.default
    };
    defaultConfig.style.grid = {
        container: {
            border: "1px solid #e2e2e2"
        }
    };



  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Update grid style using table config
        var gridStyle = defaultConfig.style.grid;
        merge(gridStyle, config.style.table);
        gridStyle.headerColumn += " compact-table";
        gridStyle.column += " compact-table";


      //Set date format
        dateDisplayFormat = getMomentFormat("M/d/yyyy");


        mainDiv = document.createElement("div");
        mainDiv.setAttribute("desc", "mainDiv");


        var buttonDiv = document.createElement("div");
        buttonDiv.className = "button-div";

        nextButton = createButton("Next", next);
        backButton = createButton("Back", back);
        backButton.hide();

        buttonDiv.appendChild(backButton);
        buttonDiv.appendChild(nextButton);


      //Advanced button
        var leftButtonDiv = document.createElement("div");
        leftButtonDiv.style.position = "absolute";
        leftButtonDiv.style.top = 0;
        buttonDiv.appendChild(leftButtonDiv);
        advancedButton = createButton("Advanced...", parseColumns);
        advancedButton.style.width = "100px";
        advancedButton.style.marginLeft = "2px";
        leftButtonDiv.appendChild(advancedButton);
        advancedButton.hide();


      //Create pop-up window
        win = new javaxt.dhtml.Window(body, {
            width: 600,
            modal: true,
            body: mainDiv,
            closable: true,
            valign: "top",
            footer: buttonDiv,
            style: config.style.window
        });


      //Watch for enter
        mainDiv.addEventListener("keyup", function(e) {
            if (e.keyCode === 13) { //enter key
                e.preventDefault();
                e.stopPropagation();
                if (datePopup && datePopup.isOpen()){
                    datePopup.submit();
                }
                else{
                    nextButton.click();
                }
            }
        });


      //Hack to show/hide
        var setTitle = win.setTitle;
        win.setTitle = function(str){
            setTitle(str);
            if (str==="New Template"){
                advancedButton.show();
            }
            else{
                advancedButton.hide();
            }
        };
    };



  //**************************************************************************
  //** start
  //**************************************************************************
  /** Public method used to start the wizard.
   */
    this.start = function(csv){

        data = parseCSV(csv);
        vendor = null;
        template = null;
        account = null;


      //Get or create first panel
        var firstPanel;
        if (panels.length==0){
            firstPanel = selectSource();
            mainDiv.appendChild(firstPanel.el);
            panels.push(firstPanel);
        }
        else{
            firstPanel = panels[0];
            if (idx>0){
                mainDiv.removeChild(mainDiv.childNodes[0]);
                mainDiv.appendChild(firstPanel.el);
            }

            for (var i=0; i<panels.length; i++){
                panels[i].reset();
            }
        }



        idx = 0;
        firstPanel.init();
        win.setTitle(firstPanel.title);
        history = [firstPanel];
        nextButton.value = "Next";
        backButton.hide();

        win.show();
    };


  //**************************************************************************
  //** onEnd
  //**************************************************************************
    this.onEnd = function(source){};


  //**************************************************************************
  //** selectSource
  //**************************************************************************
    var selectSource = function(){

      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "selectSource");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    group: "Select Source",
                    items: [
                        {
                            name: "sourceType",
                            label: "",
                            type: "radio",
                            options: [
                                {
                                    label: "New Source",
                                    value: "newSource"
                                },
                                {
                                    label: "Existing Source",
                                    value: "existingSource"
                                }
                            ],
                            alignment: "vertical"
                        }

                    ]
                }
            ]

        });



      //Add custom combobox under the "Existing Source" radio button
        var sourceType = form.findField("sourceType");
        var tbody = sourceType.row.childNodes[2].childNodes[0].childNodes[0];
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td = document.createElement("td");
        td.style.padding = "5px 0 0 22px";
        tr.appendChild(td);

        var div = document.createElement("div");
        div.style.maxWidth = "350px";
        td.appendChild(div);

        var sourceList = new javaxt.dhtml.ComboBox(div, {
            maxVisibleRows: 5,
            style: config.style.combobox
        });

        sourceList.show = function(){
            tr.style.visibility = '';
            tr.style.display = '';
        };
        sourceList.hide = function(){
            tr.style.visibility = 'hidden';
            tr.style.display = 'none';
        };




      //Show/hide the combobox when the radio button changes
        form.onChange = function(field, value){
            if (field===sourceType){
                if (value=="newSource"){
                    sourceList.hide();
                }
                else{
                    sourceList.show();
                }
            }
        };


      //Return panel
        return {
            title: "Import CSV",
            el: parent,
            init: function(){

              //Update form
                sourceType.setValue("newSource");
                sourceList.clear();

              //Populate list of sources
                get("SourceAccounts?fields=vendorID&active=true", {
                    success: function(text){
                        var vendorIDs = [];
                        var rows = JSON.parse(text).rows;
                        for (var i=0; i<rows.length; i++){
                            vendorIDs.push(rows[i][0]);
                        }
                        vendorIDs = Array.from(new Set(vendorIDs));

                        if (vendorIDs.length>0){
                            get("Vendors?fields=id,name&id=" + vendorIDs.join() + "&orderby=name", {
                                success: function(text){
                                    var rows = JSON.parse(text).rows;
                                    for (var i=0; i<rows.length; i++){
                                        var col = rows[i];
                                        var vendorID = col[0];
                                        var vendorName = col[1];
                                        sourceList.add(vendorName, vendorID);
                                        if (rows.length==1) sourceList.setValue(vendorID);
                                    }

                                    sourceType.setValue("existingSource");
                                },
                                failure: function(request){
                                    alert(request);
                                }
                            });
                        }
                        else{
                            next();
                        }
                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            },
            getNextPanel: function(){

                var panel;
                if (sourceType.getValue()=="newSource"){
                    panel = getPanel("New Source", createSource);
                    panel.init();
                }
                else{

                    var vendorID = sourceList.getValue();
                    if (!vendorID){
                        warn("Please select a source", sourceList);
                        return false;
                    }
                    else{
                        panel = getPanel("Template", selectTemplate);

                        get("Vendor/" + vendorID, {
                            success: function(text){
                                vendor = JSON.parse(text);
                                panel.init();
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });
                    }
                }


                return panel;
            },
            reset: function(){

            }
        };
    };


  //**************************************************************************
  //** createSource
  //**************************************************************************
    var createSource = function(){

      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "New Source");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    name: "name",
                    label: "Source/Vendor",
                    type: "text",
                    placeholder: "Wells Fargo, AMEX, etc"
                },
                {
                    name: "accountName",
                    label: "Account",
                    type: "text",
                    placeholder: "Peter's Platinum Card, etc"
                },
                {
                    name: "accountNumber",
                    label: "Account Number",
                    type: "text",
                    placeholder: "1111-1111-1111-1111"
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea"
                }
            ]
        });


        var sources;


      //Return panel
        return {
            title: "New Source",
            el: parent,
            init: function(){
                form.clear();
            },
            validate: function(callback){

                var values = form.getData();
                var name = values.name;
                if (name) name = name.trim();
                if (name==null || name==="") {
                    warn("Name is required", form.findField("name"));
                    return false;
                }


                var accountName = values.accountName;
                if (accountName) accountName = accountName.trim();
                if (accountName==null || accountName==="") {
                    warn("Account is required", form.findField("accountName"));
                    return false;
                }


                var isNameUnique = function(){
                    for (var i=0; i<sources.length; i++){
                        if (name.toLowerCase()==sources[i].toLowerCase()){
                            warn("A source exists with this name", form.findField("name"));
                            return false;
                        }
                    }
                    return true;
                };



              //Create source
                vendor = {
                    name: name,
                    description: values.description,
                    active: true
                };

                account = {
                    accountName: accountName,
                    accountNumber: values.accountNumber,
                    active: true
                };


                if (sources){
                    if (isNameUnique()){
                        if (callback) callback.apply(me, [vendor]);
                    }
                }
                else{
                    get("Vendors?fields=name", {
                        success: function(text){
                            sources = [];
                            var rows = JSON.parse(text).rows;
                            for (var i=0; i<rows.length; i++){
                                sources.push(rows[i][0]);
                            }
                            if (isNameUnique()){
                                if (callback) callback.apply(me, [vendor]);
                            }
                        },
                        failure: function(request){
                            alert(request);
                        }
                    });
                }
            },
            getNextPanel: function(){
                var panel = getPanel("New Template", createTemplate);
                panel.init();
                return panel;
            },
            reset: function(){

            }
        };
    };


  //**************************************************************************
  //** selectTemplate
  //**************************************************************************
    var selectTemplate = function(){

      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "Template");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    group: "Select Template",
                    items: [
                        {
                            name: "templateType",
                            label: "",
                            type: "radio",
                            options: [
                                {
                                    label: "New Template",
                                    value: "newTemplate"
                                },
                                {
                                    label: "Existing Template",
                                    value: "existingTemplate"
                                }
                            ],
                            alignment: "vertical"
                        }

                    ]
                }
            ]

        });



      //Add custom combobox under the "Existing Template" radio button
        var templateType = form.findField("templateType");
        var tbody = templateType.row.childNodes[2].childNodes[0].childNodes[0];
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td = document.createElement("td");
        td.style.padding = "5px 0 0 22px";
        tr.appendChild(td);

        var div = document.createElement("div");
        div.style.maxWidth = "350px";
        td.appendChild(div);

        var templateList = new javaxt.dhtml.ComboBox(div, {
            maxVisibleRows: 5,
            style: config.style.combobox
        });

        templateList.show = function(){
            tr.style.visibility = '';
            tr.style.display = '';
        };
        templateList.hide = function(){
            tr.style.visibility = 'hidden';
            tr.style.display = 'none';
        };




      //Show/hide the combobox when the radio button changes
        form.onChange = function(field, value){
            if (field===templateType){
                if (value=="newTemplate"){
                    templateList.hide();
                }
                else{
                    templateList.show();
                }
            }
        };


      //Return panel
        return {
            title: "Import CSV",
            el: parent,
            init: function(){

              //Select one of the radio buttons
                templateType.setValue("newTemplate");
                templateList.clear();


              //Get list of known templates and populate the combobox
                if (vendor.id){
                    get("SourceTemplates?vendorID="+vendor.id  + "&active=true&orderby=id desc", {
                        success: function(text){
                            var response = JSON.parse(text);
                            var rows = response.rows;
                            var cols = {};
                            for (var i=0; i<response.cols.length; i++){
                                cols[response.cols[i]] = i;
                            }
                            if (rows.length>0){
                                for (var i=0; i<rows.length; i++){
                                    var row = rows[i];
                                    var sourceTemplate = {};
                                    for (var col in cols) {
                                        if (cols.hasOwnProperty(col)){
                                            sourceTemplate[col] = row[cols[col]];
                                        }
                                    }
                                    templateList.add(sourceTemplate.name, sourceTemplate);
                                    if (rows.length==1) templateList.setValue(sourceTemplate.name);
                                }

                                templateType.setValue("existingTemplate");
                            }
                            else{
                                //TODO: disable "existingTemplate"
                            }
                        },
                        failure: function(request){
                            alert(request);
                        }
                    });
                }
            },
            getNextPanel: function(){

                var panel;
                if (templateType.getValue()=="newTemplate"){
                    panel = getPanel("New Template", createTemplate);
                    panel.init();
                }
                else{
                    template = templateList.getValue();
                    if (!template){
                        warn("Please select a template", templateList);
                        return false;
                    }
                    panel = getPanel("Select Account", selectAccount);
                    panel.init();
                }

                return panel;
            },
            reset: function(){

            }
        };
    };



  //**************************************************************************
  //** createPreview
  //**************************************************************************
    var createPreview = function(){

        var parent = document.createElement("div");
        parent.setAttribute("desc", "preview");
        setStyle(parent, config.style.grid.container);
        parent.style.height = "500px";
        parent.style.margin = "0px 0 18px";


      //Create grid
        var grid = new javaxt.dhtml.DataGrid(parent, {
            style: config.style.grid,
            columns: [
                {
                    header: "Date",
                    width: 85,
                    align: "right"
                },
                {
                    header: "Desciption",
                    width: "100%"
                },
                {
                    header: "Amount",
                    width: 85,
                    align: "right"
                }
            ]
        });




      //Return panel
        return {
            title: "Preview",
            isLast: function(){
                return vendor.id>0;
            },
            el: parent,
            init: function(){

                grid.clear();


              //Get date format
                var momentFormat;
                if (template.info.dateFormat!=null) momentFormat = getMomentFormat(template.info.dateFormat);


              //Generate data for the grid
                var arr = [];
                var offset = parseInt(template.info.startRow);
                if (isNaN(offset) || offset<1) offset = 0;
                else offset = offset-1;
                if (template.info.containsHeader==true) offset++;



                var len = data.length;
                var endAt = offset+50;
                if (endAt>len) endAt=len;
                var sampleData = data.slice(offset, len>endAt ? endAt : len);

                if (template.info.columnParser){
                    (function (script) {
                        try{
                            eval(script);
                            for (var i=0; i<sampleData.length; i++){
                                sampleData[i] = parseColumns(sampleData[i]);
                            }
                        }
                        catch(e){
                            alert(e);
                            console.log(e);
                        }
                    })(template.info.columnParser);
                }




                for (var i=0; i<sampleData.length; i++){
                    var row = sampleData[i];
                    var cols = row.slice(0, row.length);
                    var date = cols[template.info.dateColumn];
                    var desc = cols[template.info.descColumn];
                    var debit = parseFloat(cols[template.info.debitColumn]);
                    var credit = parseFloat(cols[template.info.creditColumn]);
                    var amount = null;


                    if (template.info.debitColumn == template.info.creditColumn){
                        amount = debit;
                    }
                    else{

                        if (isNumber(debit)){
                            var x = parseFloat(debit);
                            if (x>0) x = -x;
                            amount = x;
                        }
                        else{
                            amount = credit;
                        }

                    }
                    amount = createCell("currency", amount);


                    if (date!=null){
                        var str = date;
                        var m = momentFormat ? moment(str, momentFormat) : moment(str);
                        date = m.format(dateDisplayFormat);
                    }

                    arr.push([
                        date,
                        desc,
                        amount
                    ]);
                }


                grid.load(arr);
            },
            getNextPanel: function(){

                if (this.isLast()){

                    if (isNaN(account.id)){

                        var sourceAccount = merge({ vendor: vendor }, account);
                        save("SourceAccount", JSON.stringify(sourceAccount), {
                            success: function(text){
                                account.id = parseInt(text);
                                saveSource(function(source){
                                    win.close();
                                    me.onEnd(source);
                                });
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });
                    }
                    else{

                        get("source/?account_id="+ account.id + "&template_id=" + template.id, {
                            success: function(text){
                                var source = JSON.parse(text);
                                win.close();
                                me.onEnd(source);
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });
                    }
                }
                else{

                  //Return next panel
                    var panel = getPanel("Save Template", saveTemplate);
                    panel.init();
                    return panel;
                }

            },
            reset: function(){
                grid.clear();
            }
        };
    };


  //**************************************************************************
  //** saveSource
  //**************************************************************************
    var saveSource = function(callback){

        var source = {
            template: template,
            account: account
        };

        if (template.active!==false) template.active = true;

        if (!source.template.vendor){
            source.template.vendor = vendor;
        }
        if (!source.account.vendor){
            source.account.vendor = vendor;
        }

        save("source", JSON.stringify(source), {
            success: function(id){
                get("source/"+id, {
                    success: function(text){
                        source = JSON.parse(text);

                        if (callback) callback.apply(me, [source]);
                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            },
            failure: function(request){
                alert(request);
            }
        });

    };


  //**************************************************************************
  //** createTemplate
  //**************************************************************************
  /** Creates a panel used to
   */
    var createTemplate = function(){


      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "template");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    group: "File",
                    items: [
                        {
                            name: "startRow",
                            label: "Start Row",
                            type: "text",
                            value: 1
                        },
                        {
                            name: "containsHeader",
                            label: "Contains Header",
                            type: new javaxt.dhtml.Checkbox(
                                document.createElement("div")
                            )
                        },
                        {
                            name: "columnParser",
                            type: "hidden"
                        }
                    ]
                },
                {
                    group: "Fields",
                    items: [
                        {
                            name: "dateColumn",
                            label: "Date",
                            type: new javaxt.dhtml.ComboBox(
                                document.createElement("div"),
                                {
                                    maxVisibleRows: 5,
                                    style: config.style.combobox
                                }
                            )
                        },

                        {
                            name: "descColumn",
                            label: "Description",
                            type: new javaxt.dhtml.ComboBox(
                                document.createElement("div"),
                                {
                                    maxVisibleRows: 5,
                                    style: config.style.combobox
                                }
                            )
                        },
                        {
                            name: "debitColumn",
                            label: "Debit",
                            type: new javaxt.dhtml.ComboBox(
                                document.createElement("div"),
                                {
                                    maxVisibleRows: 5,
                                    style: config.style.combobox
                                }
                            )
                        },
                        {
                            name: "creditColumn",
                            label: "Credit",
                            type: new javaxt.dhtml.ComboBox(
                                document.createElement("div"),
                                {
                                    maxVisibleRows: 5,
                                    style: config.style.combobox
                                }
                            )
                        }
                    ]
                },
                {
                    group: "Preview",
                    items: [{
                        name: "preview",
                        label: "",
                        type:{
                            el: document.createElement("div"),
                            getValue: function(){},
                            setValue: function(){}
                        }
                    }]
                }
            ]

        });




      //Add overflow divs to the preview
        var preview = form.findField("preview");
        var tr = preview.row;
        tr.innerHTML = "";
        var td = document.createElement("td");
        td.colSpan = 3;
        td.style.height = "150px";
        td.style.padding = "0 7px";
        tr.appendChild(td);
        var outerDiv = document.createElement("div");
        setStyle(outerDiv, config.style.grid.container);
        outerDiv.style.height = "100%";
        outerDiv.style.position = "relative";
        td.appendChild(outerDiv);

        var innerDiv = document.createElement("div");
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.overflow = "hidden";
        innerDiv.style.overflowX = "auto";
        outerDiv.appendChild(innerDiv);



      //Find comboboxes
        var dateColumn = form.findField("dateColumn");
        var descColumn = form.findField("descColumn");
        var debitColumn = form.findField("debitColumn");
        var creditColumn = form.findField("creditColumn");
        var comboboxes = [dateColumn, descColumn, debitColumn, creditColumn];



        var values;
        var columns = [];
        var ignoreEvents = false;

        var getValues = function(){
            var vals = {};
            var data = form.getData();
            for (var key in data) {
               if (data.hasOwnProperty(key)){
                   var val = data[key];
                   if (val!==""){
                       vals[key] = val;
                   }
               }
            }
            return vals;
        };


        var getColumns = function(rowID){
            var cols = data[rowID];
            if (values.columnParser){
                (function (script) {
                    try{
                        eval(script);
                        cols = parseColumns(cols);
                    }
                    catch(e){
                        alert(e);
                        console.log(e);
                    }
                })(values.columnParser);
            }
            return cols;
        };

        var updateColumns = function(){

            columns.length = 0;

          //Get offset
            var offset = parseInt(values.startRow);
            if (isNaN(offset) || offset<1) offset = 0;
            else offset = offset-1;

          //Get first row
            var firstRow = getColumns(offset);
            var numColumns = firstRow.length;

            var header;
            if (values.containsHeader==true){
                header = firstRow;
            }
            else{
                header = alphabet.slice(0, numColumns);
            }

            for (var i=0; i<numColumns; i++){
                columns.push(
                    values.containsHeader ? header[i] : header[i].toUpperCase()
                );
            }
        };


        var updateComboboxes = function(){
            ignoreEvents = true;
            for (var i=0; i<comboboxes.length; i++){
                var combobox = comboboxes[i];
                combobox.clear();
                for (var j=0; j<columns.length; j++){
                    combobox.add(columns[j], j);
                }
            }


            var colTypes = getColumnTypes();
            if (colTypes.date!=null) dateColumn.setValue(columns[colTypes.date]);
            if (colTypes.desc!=null) descColumn.setValue(columns[colTypes.desc]);
            if (colTypes.debit!=null) debitColumn.setValue(columns[colTypes.debit]);
            if (colTypes.credit!=null) creditColumn.setValue(columns[colTypes.credit]);

            values = getValues();
            ignoreEvents = false;
        };


        var updateGrid = function(){

          //Clear grid
            innerDiv.innerHTML = "";


          //Define columns
            var colSpec = [];
            for (var i=0; i<columns.length; i++){
                colSpec.push({
                    header: columns[i],
                    width: 75,
                    sortable: false
                });
            }
            if (values.debitColumn!=null){
                colSpec[values.debitColumn].width = 85;
                colSpec[values.debitColumn].align = "right";
            }
            if (values.creditColumn!=null){
                colSpec[values.creditColumn].width = 85;
                colSpec[values.creditColumn].align = "right";
            }
            if (values.dateColumn!=null){
                colSpec[values.dateColumn].width = 85;
                colSpec[values.dateColumn].align = "right";
            }
            if (values.descColumn!=null){
                colSpec[values.descColumn].width = "100%";
            }


          //Get date format
            var momentFormat;
            if (values.dateFormat!=null) momentFormat = getMomentFormat(values.dateFormat);


          //Generate data for the grid
            var arr = [];
            var offset = parseInt(values.startRow);
            if (isNaN(offset) || offset<1) offset = 0;
            else offset = offset-1;
            if (values.containsHeader==true) offset++;

            var len = data.length;
            var endAt = offset+50;
            if (endAt>len) endAt=len;
            var sampleData = data.slice(offset, len>endAt ? endAt : len);

            if (values.columnParser){
                (function (script) {
                    try{
                        eval(script);
                        for (var i=0; i<sampleData.length; i++){
                            sampleData[i] = parseColumns(sampleData[i]);
                        }
                    }
                    catch(e){
                        alert(e);
                        console.log(e);
                    }
                })(values.columnParser);
            }


            for (var i=0; i<sampleData.length; i++){
                var row = sampleData[i];
                var cols = row.slice(0, row.length);

                if (values.debitColumn == values.creditColumn){
                    if (values.debitColumn!=null) cols[values.debitColumn] = formatCurrency(cols[values.debitColumn]);
                }
                else{
                    if (values.debitColumn!=null) cols[values.debitColumn] = formatCurrency(cols[values.debitColumn]);
                    if (values.creditColumn!=null) cols[values.creditColumn] = formatCurrency(cols[values.creditColumn]);
                }

                if (values.dateColumn!=null){
                    var str = cols[values.dateColumn];
                    var m = momentFormat ? moment(str, momentFormat) : moment(str);
                    cols[values.dateColumn] = m.format(dateDisplayFormat);
                }

                arr.push(cols);
            }



          //Create grid and load data
            new javaxt.dhtml.DataGrid(innerDiv, {
                style: config.style.grid,
                columns: colSpec
            }).load(arr);

        };





        var getColumnTypes = function(){

            var offset = parseInt(values.startRow);
            if (isNaN(offset) || offset<1) offset = 0;
            else offset = offset-1;
            if (values.containsHeader==true) offset++;
            var cols = getColumns(offset);

            var colTypes = {};
            for (var i=0; i<cols.length; i++){
                var col = cols[i];
                if (col!=null && col.length>0){
                    if (isDate(col)){
                        if (colTypes.date==null){
                            colTypes.date = i;
                        }
                    }
                    else if (isNumber(col)){
                        if (colTypes.credit!=null){
                            colTypes.debit = i;
                        }
                        else{
                            colTypes.credit = i;
                        }
                    }
                    else{
                        if (colTypes.desc==null){
                            colTypes.desc = i;
                        }
                    }
                }
            }
            return colTypes;
        };





      //Update panel. Do before adding onChange listener!
        values = getValues();
        updateColumns();
        updateComboboxes();
        updateGrid();



      //Watch for changes
        form.onChange = function(field, value){
            if (ignoreEvents) return;

          //Get old/new values
            var orgValue = values[field.name];
            var newValue = value;


          //Update values
            values[field.name] = value;



          //Updated panel
            if (field.name == "containsHeader" || field.name == "columnParser"){
                updateColumns();
                updateComboboxes();
                updateGrid();
            }
            else if (field.name == "startRow"){
                updateGrid();
            }
            else { //column combobox


                var colID = value;

                var offset = parseInt(values.startRow);
                if (isNaN(offset) || offset<1) offset = 0;
                else offset = offset-1;
                if (values.containsHeader==true) offset++;

                var cols = getColumns(offset);
                var val = cols[colID];

                if (field.name == "dateColumn"){

                    if (!isDate(val)){

                        var currFormat = null;
                        if (orgValue==newValue) currFormat = values.dateFormat;

                        getDateFormat(colID, offset, currFormat, function(format){

                            if (format){ //Example: "MM/dd/yyyy EEE"
                                console.log(format);
                                values.dateFormat = format;
                            }
                            else{
                                delete values.dateFormat;
                                dateColumn.setValue(null);
                                values = getValues();
                            }

                            updateGrid();
                        });
                        return;
                    }
                }
                else if (field.name == "debitColumn" || field.name == "creditColumn"){
                    var err = function(){
                        field.setValue(null);
                        values = getValues();
                        updateGrid();
                        warn("Invalid column selection", field);
                    };

                    if (!isNumber(val)){
                        if (val==null || val==""){
                            for (var i=offset; i<data.length; i++){
                                val = getColumns(i)[colID];
                                if (val!=null){
                                    if (!isNumber(val) && val!=""){
                                        err();
                                        break;
                                    }
                                }
                            }
                        }
                        else{
                            err();
                        }
                    }
                }


                updateGrid();
            }
        };



      //Return panel
        return {
            title: "New Template",
            el: parent,
            init: function(){
                values = getValues();
                updateColumns();
                updateComboboxes();
                updateGrid();
            },
            getNextPanel: function(){


              //Update values for the next panel
                var startRow = parseInt(values.startRow);
                if (isNaN(startRow) || startRow<1) startRow = 1;
                values.startRow = startRow;

                if (values.containsHeader===true){}
                else values.containsHeader = false;

                delete values.preview;


                if (values.dateColumn==null){
                    warn("Date column is required", dateColumn);
                    return false;
                }

                if (values.descColumn==null){
                    warn("Description column is required", descColumn);
                    return false;
                }


                if (values.debitColumn==null){
                    warn("Debit column is required", debitColumn);
                    return false;
                }


                if (values.creditColumn==null){
                    warn("Credit column is required", creditColumn);
                    return false;
                }


                template = {info:values};



              //Return next panel
                var panel = getPanel("Preview", createPreview);
                panel.init();
                return panel;

            },
            setValue: function(name, value){
                form.setValue(name, value);
            },
            getValues: function(){
                return getValues();
            },
            reset: function(){
                form.reset();
            }
        };
    };


  //**************************************************************************
  //** parseColumns
  //**************************************************************************
    var parseColumns = function(){

        if (!columnEditor){
            columnEditor = new javaxt.express.finance.ColumnEditor();
            columnEditor.setTitle("Column Parser");
            columnEditor.onSubmit = function(script){
                var panel = getPanel("New Template");
                panel.setValue("columnParser", script);
                columnEditor.close();
            };
        }


        columnEditor.reset();
        columnEditor.loadData(data);
        var script = getPanel("New Template").getValues().columnParser;
        if (script) columnEditor.setValue(script);
        columnEditor.show();
    };


  //**************************************************************************
  //** selectTemplate
  //**************************************************************************
    var selectAccount = function(){

      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "Account");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    group: "Select Account",
                    items: [
                        {
                            name: "accountType",
                            label: "",
                            type: "radio",
                            options: [
                                {
                                    label: "New Account",
                                    value: "newAccount"
                                },
                                {
                                    label: "Existing Account",
                                    value: "existingAccount"
                                }
                            ],
                            alignment: "vertical"
                        }

                    ]
                }
            ]
        });



      //Add custom combobox under the "Existing Template" radio button
        var accountType = form.findField("accountType");
        var tbody = accountType.row.childNodes[2].childNodes[0].childNodes[0];
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td = document.createElement("td");
        td.style.padding = "5px 0 0 22px";
        tr.appendChild(td);

        var div = document.createElement("div");
        div.style.maxWidth = "350px";
        td.appendChild(div);

        var accountList = new javaxt.dhtml.ComboBox(div, {
            maxVisibleRows: 5,
            style: config.style.combobox
        });

        accountList.show = function(){
            tr.style.visibility = '';
            tr.style.display = '';
        };
        accountList.hide = function(){
            tr.style.visibility = 'hidden';
            tr.style.display = 'none';
        };




      //Show/hide the combobox when the radio button changes
        form.onChange = function(field, value){
            if (field===accountType){
                if (value=="newAccount"){
                    accountList.hide();
                }
                else{
                    accountList.show();
                }
            }
        };


      //Return panel
        return {
            title: "Import CSV",
            el: parent,
            init: function(){

              //Select one of the radio buttons
                accountType.setValue("newAccount");
                accountList.clear();


              //Get list of known templates and populate the combobox
                if (vendor.id){
                    get("SourceAccounts?vendorID="+vendor.id + "&orderby=accountName", {
                        success: function(text){
                            var response = JSON.parse(text);
                            var rows = response.rows;
                            var cols = {};
                            for (var i=0; i<response.cols.length; i++){
                                cols[response.cols[i]] = i;
                            }
                            if (rows.length>0){

                                for (var i=0; i<rows.length; i++){
                                    var row = rows[i];
                                    var sourceAccount = {};
                                    for (var col in cols) {
                                        if (cols.hasOwnProperty(col)){
                                            sourceAccount[col] = row[cols[col]];
                                        }
                                    }
                                    var label = sourceAccount.accountName;
                                    var accountNumber = sourceAccount.accountNumber;
                                    if (accountNumber){
                                        if (accountNumber.length>4) accountNumber = accountNumber.substring(accountNumber.length-4);
                                        label += " ..." + accountNumber;
                                    }
                                    label += " (" + vendor.name + ")";

                                    accountList.add(label, sourceAccount);
                                    if (rows.length==1) accountList.setValue(label);
                                }

                                accountType.setValue("existingAccount");
                            }
                            else{
                                //next();
                            }
                        },
                        failure: function(request){
                            alert(request);
                        }
                    });
                }
                else{
                    console.log("Next!");
                    //next();
                }
            },
            getNextPanel: function(){

                var panel;
                if (accountType.getValue()=="newAccount"){
                    panel = getPanel("New Account", createAccount);
                    panel.init();
                }
                else{
                    account = accountList.getValue();
                    if (!account){
                        warn("Please select an account", accountList);
                        return false;
                    }
                    panel = getPanel("Preview", createPreview);
                    panel.init();
                }

                return panel;
            },
            reset: function(){

            }
        };
    };


  //**************************************************************************
  //** createAccount
  //**************************************************************************
    var createAccount = function(){

      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "createAccount");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    name: "name",
                    label: "Account Name",
                    type: "text"
                },
                {
                    name: "number",
                    label: "Account Number",
                    type: "text"
                }
            ]
        });


      //Return panel
        return {
            title: "Create Account",
            el: parent,
            init: function(){
                form.clear();
            },
            validate: function(callback){
                var values = form.getData();
                var name = values.name;
                if (name) name = name.trim();
                if (name==null || name==="") {
                    warn("Name is required", form.findField("name"));
                    return false;
                }
                if (callback) callback.apply(me, []);
            },
            getNextPanel: function(){

                var values = form.getData();
                var name = values.name;
                if (name) name = name.trim();

                var number = values.number;
                if (number) number = number.trim();

                account = {
                    accountName: name,
                    accountNumber: number,
                    active: true
                };

                var panel = getPanel("Preview", createPreview);
                panel.init();
                return panel;
            },
            reset: function(){
                form.clear();
            }
        };
    };


  //**************************************************************************
  //** saveTemplate
  //**************************************************************************
    var saveTemplate = function(){


      //Create form
        var parent = document.createElement("div");
        parent.setAttribute("desc", "saveTemplate");
        var form = new javaxt.dhtml.Form(parent, {
            style: config.style.form,
            items: [
                {
                    name: "name",
                    label: "Name",
                    type: "text"
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea"
                }
            ]
        });



      //Return panel
        return {
            title: "Save Template",
            el: parent,
            isLast: function(){
                return isNaN(vendor.id);
            },
            init: function(){
                form.clear();
                if (isNaN(vendor.id)){
                    form.findField("name").setValue(vendor.name);
                }
            },
            validate: function(callback){
                var values = form.getData();
                var name = values.name;
                if (name) name = name.trim();
                if (name==null || name==="") {
                    warn("Name is required", form.findField("name"));
                    return false;
                }

                //TODO: Check if template name is unique

                if (callback) callback.apply(me, []);
            },
            getNextPanel: function(){

                var values = form.getData();
                var name = values.name;
                if (name) name = name.trim();

                var description = values.description;
                if (description) description = description.trim();

                template.name = name;
                template.description = description;

                if (vendor.id){

                  //Prompt user to associate an account with the template
                    var panel = getPanel("Select Account", selectAccount);
                    panel.init();
                    return panel;

                }
                else{

                  //Save vendor and source (inc template and account)
                    save("vendor", JSON.stringify(vendor), {
                        success: function(id){
                            get("vendor/"+id, {
                                success: function(text){
                                    vendor = JSON.parse(text);
                                    saveSource(function(source){
                                        win.close();
                                        me.onEnd(source);
                                    });
                                },
                                failure: function(request){
                                    alert(request);
                                }
                            });
                        },
                        failure: function(request){
                            alert(request);
                        }
                    });



                    return null;
                }
            },
            reset: function(){
                form.clear();
            }
        };
    };


  //**************************************************************************
  //** getPanel
  //**************************************************************************
  /** Used to get or create a panel
   */
    var getPanel = function(title, fn){

      //Find panel
        var panel;
        for (var i=0; i<panels.length; i++){
            if (panels[i].title==title){
                panel = panels[i];
                break;
            }
        }

      //Create new panel as needed
        if (!panel){
            panel = fn.apply(me, []);
            panels.push(panel);
        }



      //Update next button
        var isLast = false;
        if (panel.isLast) isLast = panel.isLast();
        if (isLast===true){
            nextButton.value = "Done";
        }
        else{
            nextButton.value = "Next";
        }


        return panel;
    };


  //**************************************************************************
  //** next
  //**************************************************************************
    var next = function(){

        var currPanel = history[idx];
        var nextPanel = currPanel.getNextPanel();


        var _next = function(){
            if (nextPanel){

                mainDiv.removeChild(mainDiv.childNodes[0]);
                mainDiv.appendChild(nextPanel.el);

                win.setTitle(nextPanel.title);
                history.length = idx+1;
                history.push(nextPanel);
                idx++;
                backButton.show();
            }
        };


        if (currPanel.validate) currPanel.validate(_next);
        else _next();
    };


  //**************************************************************************
  //** back
  //**************************************************************************
    var back = function(){

        var prevPanel = history[idx-1];
        idx = idx-1;

        mainDiv.removeChild(mainDiv.childNodes[0]);
        mainDiv.appendChild(prevPanel.el);

        if (idx===0) backButton.hide();
        win.setTitle(prevPanel.title);

        nextButton.value = "Next";
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(text, onClick){
        var input = document.createElement("input");
        input.type = "button";
        input.name = input.value = text;
        input.className = "form-button";
        input.show = function(){
            input.style.display = "";
            input.style.visibility = "";
        };
        input.hide = function(){
            input.style.display = "none";
            input.style.visibility = "hidden";
        };
        input.onclick = onClick;
        return input;
    };


  //**************************************************************************
  //** getDateFormat
  //**************************************************************************
  /** Renders a popup dialog used to specify a date format.
   *  @param colID Column number containing dates
   *  @param offset Number of records to skip when previewing dates
   *  @param currFormat Optional
   */
    var getDateFormat = function(colID, offset, currFormat, callback){
        var popup = datePopup;
        if (!popup){
            var div = document.createElement("div");
            var info = document.createElement("div");
            info.style.padding = "7px";
            info.innerHTML =
            "The column you have selected contains an unknown date format. " +
            "You will need to define the format using string tokens representing " +
            "day, month, year, etc (e.g. \"M/d/yyyy\").";
            div.appendChild(info);

            var form = new javaxt.dhtml.Form(div, {
                style: config.style.form,
                items: [
                    {
                        group: "Format",
                        items: [{
                            name: "dateFormat",
                            label: "Date Format",
                            //placeholder: "Date Format (e.g. M/d/yyyy)",
                            type: "text"
                        }]
                    },
                    {
                        group: "Preview",
                        items: [{
                            name: "preview",
                            label: "",
                            type:{
                                el: document.createElement("div"),
                                getValue: function(){},
                                setValue: function(){}
                            }
                        }]
                    }
                ]

            });

            var buttonDiv = document.createElement("div");
            buttonDiv.className = "button-div";

            popup = new javaxt.dhtml.Window(body, {
                title: "Unknown Date Format",
                width: 450,
                modal: true,
                body: div,
                closable: false,
                footer: buttonDiv,
                style: config.style.window
            });


          //Create grid
            var preview = form.findField("preview");
            var tr = preview.row;
            tr.innerHTML = "";
            var td = document.createElement("td");
            td.colSpan = 3;
            td.style.height = "150px";
            td.style.padding = "0 7px";
            tr.appendChild(td);

            var outerDiv = document.createElement("div");
            outerDiv.style.height = "100%";
            outerDiv.style.position = "relative";
            outerDiv.style.border = "1px solid #e2e2e2";
            td.appendChild(outerDiv);

            var grid = new javaxt.dhtml.DataGrid(outerDiv, {
                style: config.style.grid,
                columns: [
                    {
                        header: "Before",
                        width: "50%"
                    },
                    {
                        header: "After",
                        width: "50%"
                    }
                ]
            });


            popup.buttons = [
                createButton("Cancel"),
                createButton("OK")
            ];
            buttonDiv.appendChild(popup.buttons[0]);
            buttonDiv.appendChild(popup.buttons[1]);


            popup.form = form;
            popup.grid = grid;
            datePopup = popup;
        }


      //Populate grid
        var grid = popup.grid;
        grid.clear();
        var sampleData = [];
        for (var i=offset; i<data.length; i++){
            sampleData.push([
                data[i][colID], null
            ]);
            if (sampleData.length>100) break;
        }
        grid.load(sampleData);


      //Create function to update values in the grid
        var updateGrid = function(format){
            var momentFormat;
            if (format.length>5) momentFormat = getMomentFormat(format);

            grid.forEachRow(function (row) {
                var val = null;
                if (momentFormat){
                    var str = row.get(0);
                    var m = moment(str, momentFormat);
                    var d = m.toDate();
                    if (isDate(d)){
                        val = m.format(dateDisplayFormat);
                    }
                }

                row.set(1, val);
            });
        };


      //Update values in the grid whenever the user updates the date format
        popup.form.onChange = function(input, value){
            updateGrid(value);
        };


        var getFormat = function(){
            var format = null;

            var value = dateFormat.getValue();
            if (value.length>5){
                var momentFormat = getMomentFormat(value);
                if (momentFormat){
                    popup.grid.forEachRow(function (row) {

                        var str = row.get(0);
                        var m = moment(str, momentFormat);
                        var d = m.toDate();
                        if (isDate(d)){
                            format = value;
                        }

                        return;
                    });
                }
            }
            return format;
        };


      //Process "OK" button clicks
        popup.buttons[1].onclick = function(){
            popup.close();
            if (callback) callback.apply(me, [getFormat()]);
        };


        popup.submit = function(){
            popup.buttons[1].click();
        };



      //Process "Cancel" button clicks
        var dateFormat = popup.form.findField("dateFormat");
        popup.buttons[0].onclick = function(){
            popup.close();
            if (callback){
                var format = null;
                if (currFormat){
                    if (currFormat==dateFormat.getValue()){
                        format = getFormat();
                    }
                }
                callback.apply(me, [format]);
            }

        };



      //Clear form as needed
        popup.form.clear();
        if (currFormat){
            dateFormat.setValue(currFormat);
            updateGrid(currFormat);
        }

        popup.show();
    };



  //**************************************************************************
  //** isDate
  //**************************************************************************
  /** Returns true if the given object can be converted to a date and if the
   *  the year is between 2010-present.
   */
    var isDate = function(str){

        var d;
        if (typeof str === "string"){
            d = Date.parse(str);
            if (!isNumber(d)) return false;
            d = new Date(d);
        }
        else{
            if (str instanceof Date) d = str;
            else return false;
        }


        var y = d.getFullYear();
        if (y>2010){
            if (y<=new Date().getFullYear()){
                return true;
            }
        }

        return false;
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var save = javaxt.dhtml.utils.post;
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;
    var addShowHide = javaxt.dhtml.utils.addShowHide;

    var warn = javaxt.express.finance.utils.warn;
    var isNumber = javaxt.express.finance.utils.isNumber;
    var formatCurrency = javaxt.express.finance.utils.formatCurrency;
    var parseCSV = javaxt.express.finance.utils.parseCSV;
    var getMomentFormat = javaxt.express.finance.utils.getMomentFormat;
    var createCell = javaxt.express.finance.utils.createCell;

    init();
};