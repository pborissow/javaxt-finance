if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.utils = {


  //**************************************************************************
  //** isNumber
  //**************************************************************************
  /** Returns true if the given object can be converted to a number.
   */
    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    },


  //**************************************************************************
  //** formatCurrency
  //**************************************************************************
  /** Returns a string representing currency values. Adds commas to every
   *  thousandths place. Rounds decimals to the nearest cent. Prepends a
   *  dollar sign. Also prepends a minus sign if the value is negative.
   */
    formatCurrency: function(n){
        n = parseFloat(n);
        if (!javaxt.express.finance.utils.isNumber(n)){
            return "";
        }

        var x = (n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        if (x.substring(0,1)=="-"){
            return "-$" + x.substring(1);
        }
        else{
            return "$" + x;
        }
    },


  //**************************************************************************
  //** parseCSV
  //**************************************************************************
  /** Used to parse a csv file. Returns a 2D array. Each entry in the array
   *  represents a row in the csv file. Each row has an array representing
   *  cell values.
   */
    parseCSV: function(csv, delimiter){
        delimiter = (delimiter || ",");
        var isCSV = delimiter===",";

        var getColumns = function(row){
            var cols = [];
            var insideDoubleQuotes = false;
            var str = "";
            var c;

            for (var i=0; i<row.length; i++){

                c = row.substring(i,i+1);

                if (c===("\"") && isCSV){
                    if (!insideDoubleQuotes) insideDoubleQuotes = true;
                    else insideDoubleQuotes = false;
                }

                if (c===(delimiter) && !insideDoubleQuotes){
                    cols.push(getValue(str));
                    str = "";
                }
                else{
                    str += c;
                }
            }

          //Add last column
            cols.push(getValue(str));


            return cols;
        };


        var getValue = function(str){

            var col = str.trim();
            if (col.length===0) col = null;
            if (col!==null){
                if (col.startsWith("\"") && col.endsWith("\"")){
                    col = col.substring(1, col.length-1).trim();
                    if (col.length===0) col = null;
                }
            }
            return col;
        };

        var data = [];
        var rows = csv.split(/\r?\n/);
        for (var i=0; i<rows.length; i++){
            var row = rows[i];
            if (row.indexOf(delimiter)>-1)
            data.push(getColumns(row));
        }
        return data;
    },


  //**************************************************************************
  //** parseCSV
  //**************************************************************************
  /** Used to parse a csv file. Returns a 2D array. Each entry in the array
   *  represents a row in the csv file. Each row has an array representing
   *  cell values. Credit: https://stackoverflow.com/a/1293163/
   */
    parseCSV2: function(strData, strDelimiter){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    },


  //**************************************************************************
  //** getMomentFormat
  //**************************************************************************
  /** Translates tokens in java.text.SimpleDateFormat date format to moment.js
   *  date format. Source: https://github.com/MadMG/moment-jdateformatparser/
   */
    getMomentFormat: function(formatString){
        var me = javaxt.express.finance.utils;


        var mapped = "";
        var regexp = /[^']+|('[^']*')/g;
        var part = '';

        while ((part = regexp.exec(formatString))) {
            part = part[0];
            if (part.match(/'(.*?)'/)) {
              mapped += "[" + part.substring(1, part.length - 1) + "]";
            } else {
              mapped += me.translateFormat(part, me.javaFormatMapping);
            }
        }
        return mapped;
    },

    translateFormat: function(formatString, mapping){

        var _appendMappedString = function (formatString, mapping, startIndex, currentIndex, resultString) {
          if (startIndex !== -1) {
            var tempString = formatString.substring(startIndex, currentIndex);

            // check if the temporary string has a known mapping
            if (mapping[tempString]) {
              tempString = mapping[tempString];
            }

            resultString += tempString;
          }

          return resultString;
        };


        var len = formatString.length;
        var i = 0;
        var startIndex = -1;
        var lastChar = null;
        var currentChar = "";
        var resultString = "";

        for (; i < len; i++) {
          currentChar = formatString.charAt(i);

          if (lastChar === null || lastChar !== currentChar) {
            // change detected
            resultString = _appendMappedString(formatString, mapping, startIndex, i, resultString);

            startIndex = i;
          }

          lastChar = currentChar;
        }

        return _appendMappedString(formatString, mapping, startIndex, i, resultString);
    },

    javaFormatMapping: {
        d: 'D',
        dd: 'DD',
        y: 'YYYY',
        yy: 'YY',
        yyy: 'YYYY',
        yyyy: 'YYYY',
        a: 'a',
        A: 'A',
        M: 'M',
        MM: 'MM',
        MMM: 'MMM',
        MMMM: 'MMMM',
        h: 'h',
        hh: 'hh',
        H: 'H',
        HH: 'HH',
        m: 'm',
        mm: 'mm',
        s: 's',
        ss: 'ss',
        S: 'SSS',
        SS: 'SSS',
        SSS: 'SSS',
        E: 'ddd',
        EE: 'ddd',
        EEE: 'ddd',
        EEEE: 'dddd',
        EEEEE: 'dddd',
        EEEEEE: 'dddd',
        D: 'DDD',
        w: 'W',
        ww: 'WW',
        z: 'ZZ',
        zzzz: 'Z',
        Z: 'ZZ',
        X: 'ZZ',
        XX: 'ZZ',
        XXX: 'Z',
        u: 'E'
    },


  //**************************************************************************
  //** normalizeResponse
  //**************************************************************************
  /** Used to conflate response from the server for use in a data grid
   */
    normalizeResponse: function(request){

        var response;
        if ((typeof(request) === 'string' || request instanceof String)){
            response = JSON.parse(request);
        }
        else{
            response = JSON.parse(request.responseText);
        }


        var rows = response.rows;
        var cols = {};
        for (var i=0; i<response.cols.length; i++){
            cols[response.cols[i]] = i;
        }
        for (var i=0; i<rows.length; i++){
            var row = rows[i];
            var obj = {};
            for (var col in cols) {
                if (cols.hasOwnProperty(col)){
                    obj[col] = row[cols[col]];
                }
            }
            rows[i] = obj;
        }
        return rows;
    },


  //**************************************************************************
  //** getDataStore
  //**************************************************************************
  /** Used to get or create a DataStore. The DataStore is assigned to a given
   *  config object (e.g. config.vendors). A callback is called when the
   *  DataStore becomes available for use.
   *  @param name Name of the datastore. The name is a plural varient of a
   *  Model name (e.g. "vendors", "templates", etc).
   */
    getDataStore: function(name, config, callback){
        if (config[name]){
            if (config[name] instanceof javaxt.dhtml.DataStore) {
                if (callback) callback.call();
            }
            else{
                var timer;
                var interval = 100;
                var checkAccounts = function(){
                    if (config[name] instanceof javaxt.dhtml.DataStore) {
                        clearTimeout(timer);
                        if (callback) callback.call();
                    }
                    else{
                        timer = setTimeout(checkAccounts, interval);
                    }
                };
                timer = setTimeout(checkAccounts, interval);
            }
        }
        else{
            config[name] = "Loading...";
            javaxt.dhtml.utils.get(name, {
                success: function(text){
                    var parseResponse = javaxt.express.finance.utils.normalizeResponse;
                    config[name] = new javaxt.dhtml.DataStore(parseResponse(text));
                    if (callback) callback.call();
                },
                failure: function(request){
                    alert(request);
                }
            });
        }
    },


  //**************************************************************************
  //** getSources
  //**************************************************************************
    getSources: function(config, callback){
        var getDataStore = javaxt.express.finance.utils.getDataStore;
        getDataStore("vendors", config, function(){
            getDataStore("sources", config, function(){
                getDataStore("sourceAccounts", config, function(){
                    if (callback) callback.call();
                });
            });
        });
    },


  //**************************************************************************
  //** findSource
  //**************************************************************************
  /** Returns account name, vendor name, and color for a given sourceID
   *  associated with a transaction. This information is used to render the
   *  "Source" field in the transaction tables.
   *  @param sourceID number
   *  @param vendors DataStore
   *  @param sources DataStore
   *  @param sourceAccounts DataStore
   */
    findSource: function(sourceID, vendors, sources, sourceAccounts){
        var isNumber = javaxt.express.finance.utils.isNumber;
        if (!isNumber(sourceID)) return null;
        for (var i=0; i<sources.length; i++){
            var source = sources.get(i);
            if (sourceID===source.id){
                for (var j=0; j<sourceAccounts.length; j++){
                    var sourceAccount = sourceAccounts.get(j);
                    if (sourceAccount.id===source.accountID){
                        var accountName = sourceAccount.accountName;
                        var vendorName, color;
                        for (var k=0; k<vendors.length; k++){
                            var vendor = vendors.get(k);
                            if (sourceAccount.vendorID===vendor.id){
                                vendorName = vendor.name;
                                if (vendor.info) color = vendor.info.color;
                                break;
                            }
                        }


                        return {
                            account: accountName,
                            vendor: vendorName,
                            color: color
                        };
                    }
                }

                break;
            }
        }
        return null;
    },


  //**************************************************************************
  //** getAccounts
  //**************************************************************************
  /** Used to get or create a DataStore with accounts and categories. The
   *  DataStore is assigned to the config objects (e.g. config.accounts). A
   *  callback is called when the DataStore is available.
   */
    getAccounts: function(config, callback){
        if (config.accounts){
            if (config.accounts instanceof javaxt.dhtml.DataStore) {
                if (callback) callback.call();
            }
            else{
                var timer;
                var interval = 100;
                var checkAccounts = function(){
                    if (config.accounts instanceof javaxt.dhtml.DataStore) {
                        clearTimeout(timer);
                        if (callback) callback.call();
                    }
                    else{
                        timer = setTimeout(checkAccounts, interval);
                    }
                };
                timer = setTimeout(checkAccounts, interval);
            }
        }
        else{
            config.accounts = "Loading...";
            var get = javaxt.dhtml.utils.get;
            get("accounts", {
                success: function(text){
                    var parseResponse = javaxt.express.finance.utils.normalizeResponse;
                    var accounts = new javaxt.dhtml.DataStore(parseResponse(text));
                    get("categories", {
                        success: function(text){
                            var categories = parseResponse(text);
                            for (var i=0; i<categories.length; i++){
                                var category = categories[i];
                                for (var j=0; j<accounts.length; j++){
                                    var account = accounts.get(j);
                                    if (account.id===category.accountID){
                                        delete category.accountID;
                                        if (!account.categories){
                                            account.categories = new javaxt.dhtml.DataStore();
                                        }
                                        account.categories.push(category);
                                        break;
                                    }
                                }
                            }

                            config.accounts = accounts;
                            if (callback) callback.call();
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
        }
    },


  //**************************************************************************
  //** getTransactionsPerAccount
  //**************************************************************************
    getTransactionsPerAccount: function(config, callback){
        if (!config.stats) config.stats = {};
        if (config.stats.accounts){
            if (config.stats.accounts instanceof javaxt.dhtml.DataStore) {
                if (callback) callback.call();
            }
            else{
                var timer;
                var interval = 100;
                var checkAccounts = function(){
                    if (config.stats.accounts instanceof javaxt.dhtml.DataStore) {
                        clearTimeout(timer);
                        if (callback) callback.call();
                    }
                    else{
                        timer = setTimeout(checkAccounts, interval);
                    }
                };
                timer = setTimeout(checkAccounts, interval);
            }
        }
        else{
            config.stats.accounts = "Loading...";
            var get = javaxt.dhtml.utils.get;
            var store = new javaxt.dhtml.DataStore();
            config.stats.accounts = store;

            get("report/TransactionsPerAccount", {
                success: function(text){
                    var data = JSON.parse(text);
                    for (var key in data) {
                       if (data.hasOwnProperty(key)){
                           store.add({
                               name: key,
                               count: data[key]
                           });
                       }
                    }

                    if (store.length===0){
                        store.add({
                           name: "N/A",
                           count: 0
                       });
                    }

                    if (callback) callback.call();
                },
                failure: function(request){
                    alert(request);
                }
            });
        }
    },


  //**************************************************************************
  //** createButton
  //**************************************************************************
    createButton: function(toolbar, btn){

        if (!btn.style){
            btn.style = {};
            var defaultStyle = javaxt.express.finance.style.toolbarButton;
            javaxt.dhtml.utils.merge(btn.style, defaultStyle);
        }


        if (btn.icon){
            btn.style.icon = "toolbar-button-icon " + btn.icon;
            delete btn.icon;
        }


        if (btn.menu===true){
            btn.style.arrow = "toolbar-button-menu-icon";
            btn.style.menu = "menu-panel";
            btn.style.select = "panel-toolbar-menubutton-selected";
        }

        return new javaxt.dhtml.Button(toolbar, btn);
    },


  //**************************************************************************
  //** createSpacer
  //**************************************************************************
    createSpacer: function(toolbar){
        var spacer = document.createElement('div');
        spacer.className = "toolbar-spacer";
        toolbar.appendChild(spacer);
    },


  //**************************************************************************
  //** createWindow
  //**************************************************************************
    createWindow: function(config){
        var win = new javaxt.dhtml.Window(document.body, config);
        if (!javaxt.express.finance.windows) javaxt.express.finance.windows = [];
        javaxt.express.finance.windows.push(win);
        return win;
    },


  //**************************************************************************
  //** createCell
  //**************************************************************************
    createCell: function(type, val){
        var me = javaxt.express.finance.utils;
        if (type==="currency"){
            var amount = me.formatCurrency(val);
            var span = document.createElement("span");
            span.innerHTML = amount;
            span.className = "transaction-grid-" + ((amount.indexOf("-")===0) ? "debit" : "credit");
            return span;
        }
        else if (type==="source"){
            var source = val; //response from findSource()
            if (!source) return null;

            var div = document.createElement("div");
            div.className = "transaction-grid-source";
            if (source.color) div.style.color = source.color;

            if (source.vendor){
                var d = document.createElement("div");
                d.innerHTML = source.vendor;
                div.appendChild(d);
                //if (source.color) d.style.color = source.color;
            }

            if (source.account){
                var d = document.createElement("div");
                d.innerHTML = source.account;
                div.appendChild(d);
                if (source.color) d.style.opacity = 0.5;
            }

            return div;
        }
        else if (type==="date"){
            var date = val;
            var dateFormat = arguments[2];
            if (!dateFormat) dateFormat = "M/d/yyyy";
            var m;
            if (moment.isMoment(date)){
                m = date;
            }
            else{
                var timezone = arguments[3];
                if (timezone){
                    m = moment.tz(date, timezone);
                }
                else{
                    m = moment(date);
                }
            }
            return m.format(me.getMomentFormat(dateFormat));
        }
    },


  //**************************************************************************
  //** createDoughnut
  //**************************************************************************
  /** Used to create a doughnut pie chart
   */
    createDoughnut : function(canvas, options){
        if (!options) options = {};

        var ctx = canvas.getContext('2d');

        var data = {
            datasets: [{
                data: [0, 100],
                backgroundColor: [
                    "#3ec556",
                    "#f8f8f8"
                ],
                hoverBackgroundColor: [
                    "#3ec556",
                    "#f8f8f8"
                ],
                borderWidth: [
                    0, 0
                ]
            }]
        };


        var chart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                cutoutPercentage: options.cutout ? options.cutout : 88,
                animation: {
                    animationRotate: true,
                    duration: 2000
                },
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: false
                }
            }
        });

        return chart;
    },


  //**************************************************************************
  //** createBargraph
  //**************************************************************************
  /** Used to create a bar chart
   */
    createBargraph: function(canvas, options){
        if (!options) options = {};

        var ctx = canvas.getContext('2d');

        var data = {
            labels: [], //x-axis labels
            datasets: [ //one or more json objects
                /*
                {
                    label: "Blue",
                    backgroundColor: "blue",
                    data: [3,7,4]
                },
                {
                    label: "Red",
                    backgroundColor: "red",
                    data: [4,3,5]
                },
                {
                    label: "Green",
                    backgroundColor: "green",
                    data: [7,2,6]
                }
                */
            ]
        };


        var chart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                barValueSpacing: 20,
                scales: {
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: false
                }
            }
        });

        return chart;
    },


  //**************************************************************************
  //** addLegend
  //**************************************************************************
  /** Used to add a custom legend to a canvas
   */
    addLegend: function(canvas){
        var createElement = javaxt.dhtml.utils.createElement;

        var legend = createElement("div", canvas.parentNode.parentNode, {
            position: "absolute",
            right: "5px",
            top: "7px"
        });

        var table = javaxt.dhtml.utils.createTable(legend);
        table.style.height = "";

        legend.addItem = function(label, backgroundColor, borderColor){
            var tr, td;
            tr = table.addRow();

            td = tr.addColumn();
            var div = createElement("div", td, "chart-legend-circle");
            div.style.backgroundColor = backgroundColor;
            if (borderColor){
                div.className += "-outline";
                div.style.borderColor = borderColor;
            }

            td = tr.addColumn("chart-legend-label noselect");
            td.innerHTML = label;
        };
        legend.clear = function(){
            table.clear();
        };

        return legend;
    },


  //**************************************************************************
  //** createWaitMask
  //**************************************************************************
  /** Inserts a mask with a spinner. Assumes the parent is a relative div
   */
    createWaitMask : function(parent){
        var waitMask = javaxt.dhtml.utils.createElement('div', "waitmask");
        waitMask.show = function(){
            waitMask.style.display = "";
            waitMask.style.opacity = "";
            waitMask.innerHTML = "";
            new javaxt.express.Spinner(waitMask,{size:"50px",lineWidth:3}).show();
        };
        waitMask.hide = function(){
            waitMask.innerHTML = "";
            waitMask.style.display = "none";
            waitMask.style.opacity = 0;
        };
        waitMask.hide();
        parent.appendChild(waitMask);
        return waitMask;
    },


  //**************************************************************************
  //** warn
  //**************************************************************************
  /** Used to display a warning/error message over a given form field.
   */
    warn: function(msg, field){
        var tr = field.row;
        var td;
        if (tr){
            td = tr.childNodes[2];
        }
        else{
            td = field.el.parentNode;
        }
        var getRect = javaxt.dhtml.utils.getRect;
        var rect = getRect(td);


        var inputs = td.getElementsByTagName("input");
        if (inputs.length>0){
            inputs[0].blur();
            var cls = "form-input-error";
            if (inputs[0].className){
                if (inputs[0].className.indexOf(cls)==-1) inputs[0].className += " " + cls;
            }
            else{
                inputs[0].className = cls;
            }
            rect = getRect(inputs[0]);
            field.resetColor = function(){
                if (inputs[0].className){
                    inputs[0].className = inputs[0].className.replace(cls,"");
                }
            };
        }

        var callout = javaxt.express.formError;
        if (!callout){
            var body = document.getElementsByTagName("body")[0];
            callout = new javaxt.dhtml.Callout(body,{
                style:{
                    panel: "error-callout-panel",
                    arrow: "error-callout-arrow"
                }
            });
            javaxt.express.formError = callout;
        }

        callout.getInnerDiv().innerHTML = msg;

        var x = rect.x + (rect.width/2);
        var y = rect.y;
        callout.showAt(x, y, "above", "center");
    },


  //**************************************************************************
  //** createSearchBar
  //**************************************************************************
    createSearchBar: function(parent){
        var createElement = javaxt.dhtml.utils.createElement;

        var searchBar = {};

      //Create outer div
        var div = createElement("div", parent, "search-bar");
        div.style.position = "relative";
        searchBar.el = div;


      //Create search icon
        var searchIcon = createElement("div", div, "search-bar-icon noselect");
        searchIcon.innerHTML = '<i class="fas fa-search"></i>';
        searchIcon.show = function(){
            this.style.opacity = "";
            input.style.paddingLeft = "26px";
        };
        searchIcon.hide = function(){
            this.style.opacity = 0;
            input.style.paddingLeft = "8px";
        };


      //Create input
        var input = createElement("input", div, "search-bar-input");
        input.type = "text";
        input.style.width = "100%";
        input.placeholder = "Search";
        input.setAttribute("spellcheck", "false");

        var timer;
        input.oninput = function(e){
            var q = searchBar.getValue();
            if (q){
                searchIcon.hide();
                cancelButton.show();
            }
            else{
                searchIcon.show();
                cancelButton.hide();
            }
            searchBar.onChange(q);

            if (timer) clearTimeout(timer);
            timer = setTimeout(function(){
                var q = searchBar.getValue();
                searchBar.onSearch(q);
            }, 500);

        };
        input.onkeydown = function(event){
            var key = event.keyCode;
            if (key === 9 || key === 13) {
                input.oninput();
                input.blur();
                var q = searchBar.getValue();
                searchBar.onSearch(q);
            }
        };


      //Cancel button
        var cancelButton = createElement("div", div, "search-bar-cancel noselect");
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        javaxt.dhtml.utils.addShowHide(cancelButton);
        cancelButton.hide();
        cancelButton.onclick = function(){
            searchBar.clear();
        };

        searchBar.clear = function(){
            if (timer) clearTimeout(timer);
            input.value = "";
            cancelButton.hide();
            searchIcon.show();
            searchBar.onClear();
        };

        searchBar.getValue = function(){
            var q = input.value;
            if (q){
                q = q.trim();
                if (q.length===0) q = null;
            }
            return q;
        };

        searchBar.onSearch = function(q){};
        searchBar.onChange = function(q){};
        searchBar.onClear = function(){};

        return searchBar;
    }
};