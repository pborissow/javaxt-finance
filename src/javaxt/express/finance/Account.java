package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;


//******************************************************************************
//**  Account Class
//******************************************************************************
/**
 *   Used to represent a Account
 *
 ******************************************************************************/

public class Account extends javaxt.sql.Model {

    private String name;
    private String description;
    private Boolean active;
    private JSONObject info;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public Account(){
        super("account", new java.util.HashMap<String, String>() {{
            
            put("name", "name");
            put("description", "description");
            put("active", "active");
            put("info", "info");

        }});
        
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a record ID in the database.
   */
    public Account(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  Account.
   */
    public Account(JSONObject json){
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
            this.active = getValue(rs, "active").toBoolean();
            this.info = new JSONObject(getValue(rs, "info").toString());


        }
        catch(Exception e){
            if (e instanceof SQLException) throw (SQLException) e;
            else throw new SQLException(e.getMessage());
        }
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes with attributes from another Account.
   */
    public void update(JSONObject json){

        Long id = json.get("id").toLong();
        if (id!=null && id>0) this.id = id;
        this.name = json.get("name").toString();
        this.description = json.get("description").toString();
        this.active = json.get("active").toBoolean();
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

    public Boolean getActive(){
        return active;
    }

    public void setActive(Boolean active){
        this.active = active;
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
  /** Used to find a Account using a given set of constraints. Example:
   *  Account obj = Account.get("name=", name);
   */
    public static Account get(Object...args) throws SQLException {
        Object obj = _get(Account.class, args);
        return obj==null ? null : (Account) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find Accounts using a given set of constraints.
   */
    public static Account[] find(Object...args) throws SQLException {
        Object[] obj = _find(Account.class, args);
        Account[] arr = new Account[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (Account) obj[i];
        }
        return arr;
    }
}