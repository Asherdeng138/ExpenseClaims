package com.asher.baozhang;

import java.time.LocalDate;

/** Stable user-visible names; export directories provide collision isolation. */
final class ExportNames {
    private static final String[] MONTHS={"January","February","March","April","May","June","July","August","September","October","November","December"};
    /** Display label of a stored category; the same names as CATEGORY_EN in parser.js. */
    static String label(String category,String language) {
        if(!"en".equals(language))return category;
        switch(category){
            case "市内交通（地铁）":return "Local travel (Tube)";
            case "市外交通":return "Long-distance travel";
            case "出差餐补":return "Travel subsistence";
            case "办公用品":return "Office supplies";
            case "客户招待":return "Client entertainment";
            default:return category;
        }
    }
    static String pdf(String base,String language){return base+("en".equals(language)?"_Receipts.pdf":"_发票合集.pdf");}
    static String xlsx(String base,String language){return base+("en".equals(language)?"_Summary.xlsx":"_明细汇总.xlsx");}
    static String base(String category,String from,String to) {return base(category,from,to,"zh");}
    static String base(String category,String from,String to,String language) {
        if(category==null||!category.matches("[\\u4e00-\\u9fffA-Za-z0-9（）()]+")
            ||from==null||to==null||!from.matches("\\d{4}-\\d{2}-\\d{2}")||!to.matches("\\d{4}-\\d{2}-\\d{2}"))
            throw new IllegalArgumentException("请选择费用种类和有效日期范围");
        LocalDate start=LocalDate.parse(from),end=LocalDate.parse(to);
        if(end.isBefore(start))throw new IllegalArgumentException("结束日期不能早于开始日期");
        if("en".equals(language)) {
            String file=label(category,language).replaceAll(" \\(.*\\)","").replace(' ','_').replace('-','_').replace("Long_distance","Long_Distance").replace("Local_travel","Local_Travel").replace("Travel_subsistence","Travel_Subsistence").replace("Office_supplies","Office_Supplies").replace("Client_entertainment","Client_Entertainment").replace("Distance_travel","Distance_Travel");
            if(!category.equals("市内交通（地铁）"))return from+"_to_"+to+"_"+file;
            String a=MONTHS[start.getMonthValue()-1],b=MONTHS[end.getMonthValue()-1];
            if(start.getYear()==end.getYear()&&start.getMonthValue()==end.getMonthValue())return a+"_"+start.getYear()+"_"+file;
            if(start.getYear()==end.getYear())return a+"_to_"+b+"_"+start.getYear()+"_"+file;
            return a+"_"+start.getYear()+"_to_"+b+"_"+end.getYear()+"_"+file;
        }
        if(category.equals("市内交通（地铁）")) {
            String period=start.getYear()+"年"+start.getMonthValue()+"月";
            if(start.getYear()!=end.getYear()||start.getMonthValue()!=end.getMonthValue())
                period+="至"+(start.getYear()==end.getYear()?"":end.getYear()+"年")+end.getMonthValue()+"月";
            return period+"_市内交通报账";
        }
        return from+"至"+to+"_"+category+"报账";
    }
}
