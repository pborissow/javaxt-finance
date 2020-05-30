var package = "javaxt.express.finance";
var models = {


  //**************************************************************************
  //** Transaction
  //**************************************************************************
  /** Used to represent a bank or credit card transaction. Transactions come
   *  from a variety of Sources and are linked to individual Accounts.
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
  //** Account
  //**************************************************************************
  /** Used to represent an account into which (e.g. Personal Account, Business Account, etc) Used to group transactions
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
  /** Used to tag individual transactions (e.g. Travel, Food/Groceries, Advertising, etc)
   */
    Category: {
        fields: [
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'isExpense',     type: 'boolean'},
            {name: 'account',       type: 'Account'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',      required: true,  length: 75},
            {name: 'isExpense', required: true},
            {name: 'account',   required: true, onDelete: 'cascade'}
        ]
    },


  //**************************************************************************
  //** Source
  //**************************************************************************
  /** Used to represent a source of a transaction (bank account, credit card,
   *  etc)
   */
    Source: {
        fields: [
            {name: 'account',       type: 'SourceAccount'},
            {name: 'template',      type: 'SourceTemplate'}
        ],
        constraints: [
            {name: 'account',    required: true},
            {name: 'template',   required: true}
        ]
    },


  //**************************************************************************
  //** SourceAccount
  //**************************************************************************
    SourceAccount: {
        fields: [
            {name: 'vendor',         type: 'Vendor'}, //Wells Fargo, AMEX, etc
            {name: 'accountName',    type: 'string'}, //Business Checking, Platinum Card, etc
            {name: 'accountNumber',  type: 'string'}, //1111-1111-1111-1111
            {name: 'active',         type: 'boolean'},
            {name: 'info',           type: 'json'}
        ],
        constraints: [
            {name: 'accountName',    required: true,  length: 75},
            {name: 'accountNumber',  required: false, length: 125},
            {name: 'active',         required: true},
            {name: 'vendor',  required: true}
        ],
        defaults: [
            {name: 'active',  value: true}
        ]
    },


  //**************************************************************************
  //** SourceTemplate
  //**************************************************************************
    SourceTemplate: {
        fields: [
            {name: 'vendor',        type: 'Vendor'}, //Wells Fargo, AMEX, etc
            {name: 'name',          type: 'string'},
            {name: 'description',   type: 'string'},
            {name: 'active',        type: 'boolean'},
            {name: 'info',          type: 'json'}
        ],
        constraints: [
            {name: 'name',    required: true,  length: 75,  unique: true},
            {name: 'active',  required: true},
            {name: 'vendor',  required: true}
        ],
        defaults: [
            {name: 'active',  value: true}
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