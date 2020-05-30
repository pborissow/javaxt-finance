package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;


//******************************************************************************
//**  SourceAccount Class
//******************************************************************************
/**
 *   Used to represent a SourceAccount
 *
 ******************************************************************************/

public class SourceAccount extends javaxt.sql.Model {

    private Vendor vendor;
    private String accountName;
    private String accountNumber;
    private Boolean active;
    private JSONObject info;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public SourceAccount(){
        super("source_account", new java.util.HashMap<String, String>() {{
            
            put("vendor", "vendor_id");
            put("accountName", "account_name");
            put("accountNumber", "account_number");
            put("active", "active");
            put("info", "info");

        }});
        
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a record ID in the database.
   */
    public SourceAccount(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  SourceAccount.
   */
    public SourceAccount(JSONObject json){
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
            Long vendorID = getValue(rs, "vendor_id").toLong();
            this.accountName = getValue(rs, "account_name").toString();
            this.accountNumber = getValue(rs, "account_number").toString();
            this.active = getValue(rs, "active").toBoolean();
            this.info = new JSONObject(getValue(rs, "info").toString());



          //Set vendor
            if (vendorID!=null) vendor = new Vendor(vendorID);

        }
        catch(Exception e){
            if (e instanceof SQLException) throw (SQLException) e;
            else throw new SQLException(e.getMessage());
        }
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes with attributes from another SourceAccount.
   */
    public void update(JSONObject json){

        Long id = json.get("id").toLong();
        if (id!=null && id>0) this.id = id;
        if (json.has("vendor")){
            vendor = new Vendor(json.get("vendor").toJSONObject());
        }
        else if (json.has("vendorID")){
            try{
                vendor = new Vendor(json.get("vendorID").toLong());
            }
            catch(Exception e){}
        }
        this.accountName = json.get("accountName").toString();
        this.accountNumber = json.get("accountNumber").toString();
        this.active = json.get("active").toBoolean();
        this.info = json.get("info").toJSONObject();
    }


    public Vendor getVendor(){
        return vendor;
    }

    public void setVendor(Vendor vendor){
        this.vendor = vendor;
    }

    public String getAccountName(){
        return accountName;
    }

    public void setAccountName(String accountName){
        this.accountName = accountName;
    }

    public String getAccountNumber(){
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber){
        this.accountNumber = accountNumber;
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
  /** Used to find a SourceAccount using a given set of constraints. Example:
   *  SourceAccount obj = SourceAccount.get("vendor_id=", vendor_id);
   */
    public static SourceAccount get(Object...args) throws SQLException {
        Object obj = _get(SourceAccount.class, args);
        return obj==null ? null : (SourceAccount) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find SourceAccounts using a given set of constraints.
   */
    public static SourceAccount[] find(Object...args) throws SQLException {
        Object[] obj = _find(SourceAccount.class, args);
        SourceAccount[] arr = new SourceAccount[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (SourceAccount) obj[i];
        }
        return arr;
    }
}