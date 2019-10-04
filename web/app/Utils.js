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
  /** Used to conflate response from the server
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
  //** createButton
  //**************************************************************************
    createButton: function(toolbar, btn){

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
    }
};



  //**************************************************************************
  //** alert
  //**************************************************************************
  /** Overrides the native javascript alert() method by creating a
   *  javaxt.dhtml.Alert window.
   */
    var alert = function(msg, callback, scope){

        if (msg==null) msg = "";


      //Special case for ajax request
        if (!(typeof(msg) === 'string' || msg instanceof String)){
            if (msg.responseText){
                msg = (msg.responseText.length>0 ? msg.responseText : msg.statusText);
            }
        }

        var win = javaxt.dhtml.Alert;

        if (!win){

            var body = document.getElementsByTagName("body")[0];


            var outerDiv = document.createElement('div');
            outerDiv.style.width = "100%";
            outerDiv.style.height = "100%";
            outerDiv.style.position = "relative";
            outerDiv.style.cursor = "inherit";
            var innerDiv = document.createElement('div');
            innerDiv.style.width = "100%";
            innerDiv.style.height = "100%";
            innerDiv.style.position = "absolute";
            innerDiv.style.overflowX = 'hidden';
            innerDiv.style.cursor = "inherit";
            outerDiv.appendChild(innerDiv);


            win = javaxt.dhtml.Alert = new javaxt.dhtml.Window(body, {
                width: 450,
                height: 200,
                valign: "top",
                modal: true,
                title: "Alert",
                body: outerDiv,
                style: {
                    panel: "window",
                    header: "window-header alert-header",
                    title: "window-title",
                    buttonBar: {
                        float: "right",
                        padding: "9px"
                    },
                    button: "window-header-button",
                    body: {
                        padding: "10px 10px 15px 15px",
                        verticalAlign: "top"
                    }
                }
            });
            win.div = innerDiv;
        }


        win.div.innerHTML = msg;
        win.show();

    };

    javaxt.dhtml.Alert = null;