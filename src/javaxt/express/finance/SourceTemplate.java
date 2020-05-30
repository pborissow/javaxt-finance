package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;


//******************************************************************************
//**  SourceTemplate Class
//******************************************************************************
/**
 *   Used to represent a SourceTemplate
 *
 ******************************************************************************/

public class SourceTemplate extends javaxt.sql.Model {

    private Vendor vendor;
    private String name;
    private String description;
    private Boolean active;
    private JSONObject info;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public SourceTemplate(){
        super("source_template", new java.util.HashMap<String, String>() {{
            
            put("vendor", "vendor_id");
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
    public SourceTemplate(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  SourceTemplate.
   */
    public SourceTemplate(JSONObject json){
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
            this.name = getValue(rs, "name").toString();
            this.description = getValue(rs, "description").toString();
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
  /** Used to update attributes with attributes from another SourceTemplate.
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
        this.name = json.get("name").toString();
        this.description = json.get("description").toString();
        this.active = json.get("active").toBoolean();
        this.info = json.get("info").toJSONObject();
    }


    public Vendor getVendor(){
        return vendor;
    }

    public void setVendor(Vendor vendor){
        this.vendor = vendor;
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
  /** Used to find a SourceTemplate using a given set of constraints. Example:
   *  SourceTemplate obj = SourceTemplate.get("vendor_id=", vendor_id);
   */
    public static SourceTemplate get(Object...args) throws SQLException {
        Object obj = _get(SourceTemplate.class, args);
        return obj==null ? null : (SourceTemplate) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find SourceTemplates using a given set of constraints.
   */
    public static SourceTemplate[] find(Object...args) throws SQLException {
        Object[] obj = _find(SourceTemplate.class, args);
        SourceTemplate[] arr = new SourceTemplate[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (SourceTemplate) obj[i];
        }
        return arr;
    }
}