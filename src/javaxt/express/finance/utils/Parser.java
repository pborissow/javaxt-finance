package javaxt.express.finance.utils;
import javaxt.express.finance.*;
import javaxt.express.utils.CSV;

import javaxt.utils.Generator;
import javaxt.utils.Value;
import javaxt.json.*;

import java.util.*;
import java.math.BigDecimal;

import javax.script.*;
import jdk.nashorn.api.scripting.ScriptObjectMirror;


//******************************************************************************
//**  Parser Class
//******************************************************************************
/**
 *   Used to parse CSV files using a template
 *
 ******************************************************************************/

public class Parser {
    private SourceTemplate sourceTemplate;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public Parser(SourceTemplate template){
        this.sourceTemplate = template;
    }


  //**************************************************************************
  //** getTransactions
  //**************************************************************************
    public Generator<Transaction> getTransactions(final String[] data) throws Exception {
        return new Generator<Transaction>() {
            @Override
            public void run() {


                JSONObject template = sourceTemplate.getInfo();
                int startRow = template.has("startRow") ? template.get("startRow").toInteger() : 0;
                Boolean containsHeader = template.get("containsHeader").toBoolean();
                if (containsHeader==null) containsHeader = false;
                String columnParser = template.get("columnParser").toString();
                String dateFormat = template.get("dateFormat").toString();
                int dateColumn = template.get("dateColumn").toInteger();
                int descColumn = template.get("descColumn").toInteger();
                int debitColumn = template.get("debitColumn").toInteger();
                int creditColumn = template.get("creditColumn").toInteger();


                int offset = startRow;
                if (offset<1) offset = 0;
                else offset = offset-1;
                if (containsHeader) offset++;


                ScriptObjectMirror parser = null;
                if (columnParser!=null){
                    try{
                        ScriptEngineManager factory = new ScriptEngineManager();
                        ScriptEngine engine = factory.getEngineByName("nashorn");
                        Compilable compilable = (Compilable) engine;
                        CompiledScript script = compilable.compile(columnParser);
                        Bindings bindings = engine.createBindings();
                        script.eval(bindings);
                        parser = (ScriptObjectMirror) bindings.get("parseColumns");
                    }
                    catch(Exception e){
                        throw new RuntimeException(e);
                    }
                }


                for (int i=offset; i<data.length; i++){
                    try{

                        String row = data[i];
                        if (row.endsWith("\r")) row = row.substring(0, row.length()-1);
                        if (row.isEmpty()) continue;


                        CSV.Columns columns = CSV.getColumns(row, ",");


                        if (parser!=null){

                          //Convert the columns to a string array
                            String[] cols = new String[columns.length()];
                            for (int j=0; j<cols.length; j++){
                                cols[j] = columns.get(j).toString();
                            }


                          //Execute script
                            ScriptObjectMirror output = (ScriptObjectMirror) parser.call(null, Arrays.asList(cols));
                            Object[] arr = output.to(Object[].class);


                          //Update columns
                            columns = new CSV.Columns();
                            for (Object obj : arr){
                                columns.add(new Value(obj));
                            }
                        }

                        String dateVal = columns.get(dateColumn).toString().trim();
                        while (dateVal.contains("  ")) dateVal = dateVal.replace("  ", " ");
                        javaxt.utils.Date date;
                        if (dateFormat==null) date = new javaxt.utils.Date(dateVal);
                        else date = new javaxt.utils.Date(dateVal, dateFormat);

                        String desc = columns.get(descColumn).toString();
                        if (desc.startsWith("\"") && desc.endsWith("\"")){
                            desc = desc.substring(1, desc.length()-1);
                        }

                        BigDecimal amount;
                        if (debitColumn==creditColumn){
                            amount = columns.get(debitColumn).toBigDecimal();
                        }
                        else{
                            String debit = columns.get(debitColumn).toString();
                            String credit = columns.get(creditColumn).toString();

                            if (debit==null) debit = ""; else debit = debit.trim();
                            if (credit==null) credit = ""; else credit = credit.trim();

                            if (debit.equalsIgnoreCase("undefined")) debit = "";
                            if (credit.equalsIgnoreCase("undefined")) credit = "";

                            if (debit.length()>0){
                                amount = new BigDecimal(debit);
                                if (amount.compareTo(BigDecimal.ZERO) > 0) amount = amount.negate();
                            }
                            else{
                                amount = new BigDecimal(credit);
                            }
                        }


                        Transaction tx = new Transaction();
                        tx.setDate(date);
                        tx.setDescription(desc);
                        tx.setAmount(amount);
                        tx.setRawData(row);

                        yield(tx);

                    }
                    catch(Exception e){
                        throw new RuntimeException(e);
                    }
                }
            }
        };

    }

}