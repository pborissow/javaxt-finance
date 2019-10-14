package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;


//******************************************************************************
//**  Category Class
//******************************************************************************
/**
 *   Used to represent a Category
 *
 ******************************************************************************/

public class Category extends javaxt.sql.Model {

    private String name;
    private String description;
    private Boolean isExpense;
    private Account account;
    private JSONObject info;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public Category(){
        super("category", new java.util.HashMap<String, String>() {{
            
            put("name", "name");
            put("description", "description");
            put("isExpense", "is_expense");
            put("account", "account_id");
            put("info", "info");

        }});
        
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a record ID in the database.
   */
    public Category(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  Category.
   */
    public Category(JSONObject json){
        this();
        update(json);
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes using a record in the database.
   */
    protected void update(Object rs) throws SQLException {

        try{
            this.id = getValue(rs, "id").toLong();
            this.name = getValue(rs, "name").toString();
            this.description = getValue(rs, "description").toString();
            this.isExpense = getValue(rs, "is_expense").toBoolean();
            Long accountID = getValue(rs, "account_id").toLong();
            this.info = new JSONObject(getValue(rs, "info").toString());



          //Set account
            if (accountID!=null) account = new Account(accountID);

        }
        catch(Exception e){
            if (e instanceof SQLException) throw (SQLException) e;
            else throw new SQLException(e.getMessage());
        }
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes with attributes from another Category.
   */
    public void update(JSONObject json){

        Long id = json.get("id").toLong();
        if (id!=null && id>0) this.id = id;
        this.name = json.get("name").toString();
        this.description = json.get("description").toString();
        this.isExpense = json.get("isExpense").toBoolean();
        if (json.has("account")){
            account = new Account(json.get("account").toJSONObject());
        }
        else if (json.has("accountID")){
            try{
                account = new Account(json.get("accountID").toLong());
            }
            catch(Exception e){}
        }
        this.info = json.get("info").toJSONObject();
    }


    public String getName(){
        return name;
    }

    public void setName(String name){
        this.name = name;
    }

    public String getDescription(){
        return description;
    }

    public void setDescription(String description){
        this.description = description;
    }

    public Boolean getIsExpense(){
        return isExpense;
    }

    public void setIsExpense(Boolean isExpense){
        this.isExpense = isExpense;
    }

    public Account getAccount(){
        return account;
    }

    public void setAccount(Account account){
        this.account = account;
    }

    public JSONObject getInfo(){
        return info;
    }

    public void setInfo(JSONObject info){
        this.info = info;
    }
    
    


  //**************************************************************************
  //** get
  //**************************************************************************
  /** Used to find a Category using a given set of constraints. Example:
   *  Category obj = Category.get("name=", name);
   */
    public static Category get(Object...args) throws SQLException {
        Object obj = _get(Category.class, args);
        return obj==null ? null : (Category) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find Categorys using a given set of constraints.
   */
    public static Category[] find(Object...args) throws SQLException {
        Object[] obj = _find(Category.class, args);
        Category[] arr = new Category[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (Category) obj[i];
        }
        return arr;
    }
}