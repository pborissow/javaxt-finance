package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;
import java.math.BigDecimal;
import javaxt.utils.Date;

//******************************************************************************
//**  Transaction Class
//******************************************************************************
/**
 *   Used to represent a Transaction
 *
 ******************************************************************************/

public class Transaction extends javaxt.sql.Model {

    private Date date;
    private String description;
    private String notes;
    private BigDecimal amount;
    private Source source;
    private Vendor vendor;
    private Category category;
    private JSONObject info;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public Transaction(){
        super("transaction", new java.util.HashMap<String, String>() {{
            
            put("date", "date");
            put("description", "description");
            put("notes", "notes");
            put("amount", "amount");
            put("source", "source_id");
            put("vendor", "vendor_id");
            put("category", "category_id");
            put("info", "info");

        }});
        
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a record ID in the database.
   */
    public Transaction(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  Transaction.
   */
    public Transaction(JSONObject json){
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
            this.date = getValue(rs, "date").toDate();
            this.description = getValue(rs, "description").toString();
            this.notes = getValue(rs, "notes").toString();
            this.amount = getValue(rs, "amount").toBigDecimal();
            Long sourceID = getValue(rs, "source_id").toLong();
            Long vendorID = getValue(rs, "vendor_id").toLong();
            Long categoryID = getValue(rs, "category_id").toLong();
            this.info = new JSONObject(getValue(rs, "info").toString());



          //Set source
            if (sourceID!=null) source = new Source(sourceID);


          //Set vendor
            if (vendorID!=null) vendor = new Vendor(vendorID);


          //Set category
            if (categoryID!=null) category = new Category(categoryID);

        }
        catch(Exception e){
            if (e instanceof SQLException) throw (SQLException) e;
            else throw new SQLException(e.getMessage());
        }
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes with attributes from another Transaction.
   */
    public void update(JSONObject json){

        Long id = json.get("id").toLong();
        if (id!=null && id>0) this.id = id;
        this.date = json.get("date").toDate();
        this.description = json.get("description").toString();
        this.notes = json.get("notes").toString();
        this.amount = json.get("amount").toBigDecimal();
        if (json.has("source")){
            source = new Source(json.get("source").toJSONObject());
        }
        else if (json.has("sourceID")){
            try{
                source = new Source(json.get("sourceID").toLong());
            }
            catch(Exception e){}
        }
        if (json.has("vendor")){
            vendor = new Vendor(json.get("vendor").toJSONObject());
        }
        else if (json.has("vendorID")){
            try{
                vendor = new Vendor(json.get("vendorID").toLong());
            }
            catch(Exception e){}
        }
        if (json.has("category")){
            category = new Category(json.get("category").toJSONObject());
        }
        else if (json.has("categoryID")){
            try{
                category = new Category(json.get("categoryID").toLong());
            }
            catch(Exception e){}
        }
        this.info = json.get("info").toJSONObject();
    }


    public Date getDate(){
        return date;
    }

    public void setDate(Date date){
        this.date = date;
    }

    public String getDescription(){
        return description;
    }

    public void setDescription(String description){
        this.description = description;
    }

    public String getNotes(){
        return notes;
    }

    public void setNotes(String notes){
        this.notes = notes;
    }

    public BigDecimal getAmount(){
        return amount;
    }

    public void setAmount(BigDecimal amount){
        this.amount = amount;
    }

    public Source getSource(){
        return source;
    }

    public void setSource(Source source){
        this.source = source;
    }

    public Vendor getVendor(){
        return vendor;
    }

    public void setVendor(Vendor vendor){
        this.vendor = vendor;
    }

    public Category getCategory(){
        return category;
    }

    public void setCategory(Category category){
        this.category = category;
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
  /** Used to find a Transaction using a given set of constraints. Example:
   *  Transaction obj = Transaction.get("date=", date);
   */
    public static Transaction get(Object...args) throws SQLException {
        Object obj = _get(Transaction.class, args);
        return obj==null ? null : (Transaction) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find Transactions using a given set of constraints.
   */
    public static Transaction[] find(Object...args) throws SQLException {
        Object[] obj = _find(Transaction.class, args);
        Transaction[] arr = new Transaction[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (Transaction) obj[i];
        }
        return arr;
    }
}