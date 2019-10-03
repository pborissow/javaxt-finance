var package = "javaxt.express.finance";
var models = {


  //**************************************************************************
  //** Source
  //**************************************************************************
  /** Used to represent a bank or credit card (e.g. Wells Fargo, AMEX, etc).
   */
    Source: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'active',        type: 'boolean'},
            {name: 'accountNumber', type: 'string'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',          required: true,  length: 75,  unique: true},
            {name: 'active',        required: true}
        ],
        defaults: [
            {name: 'active',    value: true}
        ]
    },


  //**************************************************************************
  //** Account
  //**************************************************************************
  /** Used to represent an account (e.g. Personal, ACME Consulting, etc)
   */
    Account: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'active',        type: 'boolean'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',          required: true,  length: 75,  unique: true},
            {name: 'active',        required: true}
        ],
        defaults: [
            {name: 'active',        value: true}
        ]
    },


  //**************************************************************************
  //** Category
  //**************************************************************************
  /** Travel, Food/Groceries, Advertising, etc
   */
    Category: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'account',       type: 'Account'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',    required: true,  length: 75},
            {name: 'account', onDelete: 'cascade'}
        ]
    },


  //**************************************************************************
  //** Vendor
  //**************************************************************************
    Vendor: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'active',        type: 'boolean'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',          required: true,  length: 75,  unique: true},
            {name: 'active',        required: true}
        ],
        defaults: [
            {name: 'active',        value: true}
        ]
    },


  //**************************************************************************
  //** Transaction
  //**************************************************************************
  /** Used to represent a bank or credit card transaction
   */
    Transaction: {
        fields: [
            {name: 'date',          type: 'date'},
            {name: 'description',   type: 'string'},
            {name: 'notes',         type: 'string'},
            {name: 'amount',        type: 'decimal'},
            {name: 'rawData',       type: 'string'},
            {name: 'source',        type: 'Source'},
            {name: 'vendor',        type: 'Vendor'},
            {name: 'category',      type: 'Category'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'date',          required: true},
            {name: 'amount',        required: true},
            {name: 'rawData',       unique: true},
            {name: 'source',        required: true},
            {name: 'category',      onDelete: 'set null'}
        ]
    },


  //**************************************************************************
  //** Rule
  //**************************************************************************
  /** Used to represent a rule used to help automatically categorize expenses
   */
    Rule: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'active',        type: 'boolean'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',          required: true,  length: 75,  unique: true},
            {name: 'active',        required: true}
        ],
        defaults: [
            {name: 'active',        value: true}
        ]
    }


};