if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  IconSearch
//******************************************************************************
/**
 *   Panel used to search and browse FontAwesome icons
 *
 ******************************************************************************/

javaxt.express.finance.IconSearch = function(parent, config) {

    var me = this;
    var defaultConfig = {
        style: javaxt.express.finance.style
    };
    var searchBar, iconContainer, waitmask;
    var allIcons = [];
    var filteredIcons = [];
    var isLoading = false;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Parse config
        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;
        if (!config.waitmask) config.waitmask = new javaxt.express.WaitMask(document.body);
        waitmask = config.waitmask;


      //Create main container
        var table = createTable(parent);
        table.className = "icon-search-panel";
        var tr, td;


      //Create search bar (first row)
        tr = table.addRow();
        td = tr.addColumn({
            className: "icon-search-toolbar"
        });
        var searchContainer = createElement("div", td, "icon-search-container");
        searchBar = javaxt.express.finance.utils.createSearchBar(searchContainer);
        searchBar.onSearch = function(q){
            filterIcons();
        };
        searchBar.onChange = function(q){
            filterIcons();
        };
        searchBar.onClear = function(){
            filterIcons();
        };


      //Create icon container (second row)
        tr = table.addRow();
        td = tr.addColumn({
            height: "100%",
            className: "icon-search-content"
        });
        iconContainer = createElement("div", td, "icon-grid-container");



      //Load icons from CSS file
        loadIconsFromCSS();


        me.el = table;
        addShowHide(me);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        searchBar.clear();
        filterIcons();
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        // Refresh if needed
    };


  //**************************************************************************
  //** onClick
  //**************************************************************************
    this.onClick = function(iconName){};


  //**************************************************************************
  //** loadIconsFromCSS
  //**************************************************************************
    var loadIconsFromCSS = function(){
        isLoading = true;
        if (waitmask) waitmask.show();

        // Fetch the CSS file
        get('lib/fontawesome/css/all.css', {
            success: function(text){
                parseIconsFromCSS(text);
            },
            failure: function(){
                isLoading = false;
                if (waitmask) waitmask.hide();
                showErrorState("Failed to load FontAwesome CSS file");
            }
        });
    };


  //**************************************************************************
  //** testIconRenders
  //**************************************************************************
    var testIconRenders = function(iconName){
        try {
            // Create a temporary element to test if the icon actually renders
            var testEl = document.createElement('i');
            testEl.className = 'fas fa-' + iconName;
            testEl.style.position = 'absolute';
            testEl.style.visibility = 'visible';
            testEl.style.left = '-9999px';
            testEl.style.top = '-9999px';
            testEl.style.fontSize = '32px'; // Larger size for better detection
            testEl.style.width = 'auto';
            testEl.style.height = 'auto';
            testEl.style.color = '#000000'; // Black for contrast
            testEl.style.backgroundColor = '#ffffff'; // White background
            document.body.appendChild(testEl);

            // Force a reflow to ensure styles are applied
            testEl.offsetHeight;

            // Try canvas-based visual detection - check if icon actually renders pixels
            var hasVisualContent = null; // null = not tested, true/false = result
            try {
                // Check if Font Awesome font is loaded using Font Loading API
                var fontLoaded = false;
                if (document.fonts && document.fonts.check) {
                    // Try different font name formats
                    fontLoaded = document.fonts.check('16px "Font Awesome 5 Free"') ||
                               document.fonts.check('16px Font Awesome 5 Free') ||
                               document.fonts.check('1em "Font Awesome 5 Free"');
                } else {
                    // Fallback: assume font is loaded if we're using FontAwesome
                    fontLoaded = true;
                }

                if (fontLoaded) {
                    var canvas = document.createElement('canvas');
                    canvas.width = 48; // Reasonable size for detection
                    canvas.height = 48;
                    var ctx = canvas.getContext('2d');

                    // Get the character from content
                    var computedStyle = window.getComputedStyle(testEl, ':before');
                    var content = computedStyle.getPropertyValue('content');
                    var char = '';
                    if (content && content !== 'none' && content !== 'normal') {
                        char = content.replace(/['"]/g, '');
                    }

                    if (char.length > 0) {
                        // Set up canvas with white background
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, 48, 48);

                        // Draw the character with Font Awesome font (weight 900 for solid)
                        ctx.fillStyle = '#000000';
                        ctx.font = '900 36px "Font Awesome 5 Free"';
                        ctx.textBaseline = 'middle';
                        ctx.textAlign = 'center';

                        // Draw the character in the center
                        ctx.fillText(char, 24, 24);

                        // Get image data and check for non-white pixels
                        var imageData = ctx.getImageData(0, 0, 48, 48);
                        var data = imageData.data;
                        var hasPixels = false;
                        var pixelCount = 0;

                        // Count non-white pixels (with some tolerance for anti-aliasing)
                        for (var i = 0; i < data.length; i += 4) {
                            var r = data[i];
                            var g = data[i + 1];
                            var b = data[i + 2];
                            // Check if pixel is significantly different from white
                            // (allowing for some anti-aliasing)
                            if (r < 240 || g < 240 || b < 240) {
                                pixelCount++;
                                if (pixelCount > 10) { // Need at least 10 pixels to be considered valid
                                    hasPixels = true;
                                    break;
                                }
                            }
                        }

                        hasVisualContent = hasPixels;
                    } else {
                        hasVisualContent = false;
                    }
                } else {
                    // Font not loaded, can't test with canvas
                    hasVisualContent = null;
                }
            } catch (e) {
                // Canvas detection failed, will fall back to other checks
                hasVisualContent = null;
            }

            // Check if the icon has content by examining the ::before pseudo-element
            var computedStyle = window.getComputedStyle(testEl, ':before');
            var content = computedStyle.getPropertyValue('content');
            var fontFamily = computedStyle.getPropertyValue('font-family');

            // Get the actual text content to see if it's visible
            // For FontAwesome icons, we can check if the character code is in a valid range
            // FontAwesome uses Private Use Area (PUA) Unicode range: U+F000 to U+F8FF
            var charCode = 0;
            if (content && content.length > 0) {
                // Remove quotes and get first character
                var cleanContent = content.replace(/['"]/g, '');
                if (cleanContent.length > 0) {
                    charCode = cleanContent.charCodeAt(0);
                }
            }

            // Check if character is in FontAwesome PUA range (0xF000-0xF8FF)
            var isValidFontAwesomeChar = charCode >= 0xF000 && charCode <= 0xF8FF;

            // Clean up
            document.body.removeChild(testEl);

            // Icons that render will have:
            // 1. Content that is not 'none', 'normal', or empty
            // 2. Font family that is Font Awesome 5 Free (for fas icons)
            // 3. Valid FontAwesome character code (in PUA range)
            // 4. Actually has visual content (canvas pixel check)

            if (!content || content === 'none' || content === 'normal') {
                return false;
            }

            // Remove quotes and check if it's empty
            var cleanContent = content.replace(/['"]/g, '');
            if (cleanContent.length === 0) {
                return false;
            }

            // Check font-family - must be "Font Awesome 5 Free" for fas icons
            var isFontAwesomeFree = fontFamily &&
                                   fontFamily.toLowerCase().indexOf('font awesome 5 free') !== -1;

            // If canvas check was performed and failed, reject the icon
            if (hasVisualContent === false) {
                return false;
            }

            // If canvas check wasn't available (null) or passed (true), use other checks
            // Fall back to font family and character validation if canvas unavailable
            return isFontAwesomeFree && isValidFontAwesomeChar;
        } catch (e) {
            // If testing fails for any reason, assume the icon is valid
            // This prevents the test from being too aggressive
            return true;
        }
    };


  //**************************************************************************
  //** parseIconsFromCSS
  //**************************************************************************
    var parseIconsFromCSS = function(cssText){
        // Extract icon names from CSS rules like .fa-icon-name:before
        // Pattern matches: .fa-icon-name:before or .fa-icon-name::before
        var iconPattern = /\.fa-([a-z0-9-]+):(?:before|after)/gi;
        var iconSet = new Set();
        var match;
        var candidateIcons = [];

        // First pass: collect all candidate icons
        while ((match = iconPattern.exec(cssText)) !== null) {
            var iconName = match[1];
            // Filter out common non-icon classes
            if (iconName &&
                iconName !== 'lg' &&
                iconName !== 'xs' &&
                iconName !== 'sm' &&
                iconName !== '1x' &&
                iconName !== '2x' &&
                iconName !== '3x' &&
                iconName !== '4x' &&
                iconName !== '5x' &&
                iconName !== '6x' &&
                iconName !== '7x' &&
                iconName !== '8x' &&
                iconName !== '9x' &&
                iconName !== '10x' &&
                iconName !== 'fw' &&
                iconName !== 'ul' &&
                iconName !== 'li' &&
                iconName !== 'border' &&
                iconName !== 'pull-left' &&
                iconName !== 'pull-right' &&
                iconName !== 'spin' &&
                iconName !== 'pulse' &&
                !iconName.match(/^\d+$/)) {
                candidateIcons.push(iconName);
            }
        }

        // Remove duplicates and sort
        candidateIcons = Array.from(new Set(candidateIcons)).sort();

        // Test icons in batches to avoid blocking the UI
        var batchSize = 50;
        var currentIndex = 0;
        var validIcons = [];

        var testBatch = function(){
            var endIndex = Math.min(currentIndex + batchSize, candidateIcons.length);

            for (var i = currentIndex; i < endIndex; i++) {
                var iconName = candidateIcons[i];
                if (testIconRenders(iconName)) {
                    validIcons.push(iconName);
                }
            }

            currentIndex = endIndex;

            if (currentIndex < candidateIcons.length) {
                // Continue with next batch
                setTimeout(testBatch, 0);
            }
            else {
                // Done testing - update the icon list
                isLoading = false;
                if (waitmask) waitmask.hide();

                // If very few icons passed the test (less than 10% of candidates),
                // the test is probably too aggressive - show all icons as fallback
                if (validIcons.length < candidateIcons.length * 0.1) {
                    validIcons = candidateIcons;
                }
                allIcons = validIcons.sort();
                filteredIcons = allIcons.slice();
                renderIcons();
            }
        };

        // Start testing
        testBatch();
    };


  //**************************************************************************
  //** showErrorState
  //**************************************************************************
    var showErrorState = function(message){
        if (waitmask) waitmask.hide();
        iconContainer.innerHTML = "";
        var errorDiv = createElement("div", iconContainer, "error-state");
        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i>' + (message || "Error loading icons");
    };


  //**************************************************************************
  //** filterIcons
  //**************************************************************************
    var filterIcons = function(){
        if (isLoading) return;


        var q = searchBar.getValue();
        var searchTerm = q ? q.toLowerCase() : "";


        if (searchTerm === "") {
            filteredIcons = allIcons.slice();
        }
        else {
            filteredIcons = allIcons.filter(function(iconName){
                return iconName.toLowerCase().indexOf(searchTerm) !== -1;
            });
        }

        renderIcons();
    };


  //**************************************************************************
  //** renderIcons
  //**************************************************************************
    var renderIcons = function(){
        iconContainer.innerHTML = "";

        if (filteredIcons.length === 0) {
            var noResults = createElement("div", iconContainer, "no-results");
            noResults.innerHTML = '<i class="fas fa-search"></i>No icons found';
            return;
        }

        var grid = createElement("div", iconContainer, "icon-grid");

        for (var i = 0; i < filteredIcons.length; i++) {
            var iconName = filteredIcons[i];
            var iconTile = createIconTile(iconName);
            grid.appendChild(iconTile);
        }
    };


  //**************************************************************************
  //** createIconTile
  //**************************************************************************
    var createIconTile = function(iconName){
        var tile = createElement("div", null, "icon-tile");

        // Icon (32x32)
        var icon = createElement("i", tile, "fas fa-" + iconName);


        // Icon name label (small text below icon)
        var label = createElement("div", tile, "icon-label");
        label.textContent = iconName;

        // Click handler - copy icon class to clipboard
        tile.onclick = function(e){
            me.onClick("fas fa-" + iconName);
        };

        return tile;
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var merge = javaxt.dhtml.utils.merge;
    var get = javaxt.dhtml.utils.get;

    init();
};