package com.asher.baozhang;

import org.junit.Test;
import static org.junit.Assert.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.*;
import javax.xml.parsers.DocumentBuilderFactory;

public class XlsxWriterTest {
    @Test public void exportsAmountsEscapesTextAndContainsTwoSheets() throws Exception {
        File file=File.createTempFile("expense-test-",".xlsx");
        try {
            List<XlsxWriter.Row> rows=Arrays.asList(new XlsxWriter.Row("test1","2026-10-09","出差餐补","GBP","A&B <Shop>","London","=HYPERLINK(\"bad\")",1280,2,"1–2"),new XlsxWriter.Row("test2","2026-10-10","出差餐补","GBP","Restaurant","London","",29,1,"3"));
            XlsxWriter.write(file,rows);
            Map<String,String> content=new HashMap<>();
            try(ZipInputStream zip=new ZipInputStream(new FileInputStream(file))){ZipEntry e;while((e=zip.getNextEntry())!=null){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[1024];int n;while((n=zip.read(b))!=-1)out.write(b,0,n);byte[] data=out.toByteArray();DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(new ByteArrayInputStream(data));content.put(e.getName(),new String(data,StandardCharsets.UTF_8));}}
            String detail=content.get("xl/worksheets/sheet1.xml"),summary=content.get("xl/worksheets/sheet2.xml");
            assertNotNull(detail);assertNotNull(summary);assertTrue(detail.contains("12.80"));assertTrue(detail.contains("0.29"));assertTrue(summary.contains("13.09"));assertTrue(detail.contains("A&amp;B &lt;Shop&gt;"));assertFalse(detail.contains("<f>"));assertTrue(detail.contains("=HYPERLINK"));assertTrue(detail.contains("1–2"));assertTrue(detail.contains("金额"));assertTrue(detail.contains("货币"));assertFalse(detail.contains("所在地"));assertFalse(detail.contains("London"));assertTrue(detail.contains("r=\"E2\" s=\"3\"><v>12.80</v>"));assertTrue(detail.contains("r=\"I2\""));assertTrue(detail.contains("A1:J3"));
        } finally {file.delete();}
    }
    private static Map<String,String> read(File file) throws Exception {
        Map<String,String> content=new HashMap<>();
        try(ZipInputStream zip=new ZipInputStream(new FileInputStream(file))){ZipEntry e;while((e=zip.getNextEntry())!=null){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[1024];int n;while((n=zip.read(b))!=-1)out.write(b,0,n);byte[] data=out.toByteArray();DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(new ByteArrayInputStream(data));content.put(e.getName(),new String(data,StandardCharsets.UTF_8));}}
        return content;
    }
    @Test public void mixedCurrenciesHaveSeparateTotalsAndEnglishFollowsLanguage() throws Exception {
        File file=File.createTempFile("expense-test-",".xlsx");
        try {
            XlsxWriter.write(file,Arrays.asList(new XlsxWriter.Row("a","2026-10-09","出差餐补","GBP","Tesco","","",1000,1,"1"),new XlsxWriter.Row("b","2026-10-10","出差餐补","EUR","REWE","","",750,1,"2")),"en");
            Map<String,String> content=read(file);String detail=content.get("xl/worksheets/sheet1.xml"),summary=content.get("xl/worksheets/sheet2.xml"),book=content.get("xl/workbook.xml"),styles=content.get("xl/styles.xml");
            assertTrue(book.contains("name=\"Receipts\""));assertTrue(book.contains("name=\"Summary\""));assertTrue(detail.contains("Expense type"));assertTrue(detail.contains("Travel subsistence"));assertFalse(detail.contains("出差餐补"));
            assertTrue(detail.contains("r=\"E2\" s=\"3\"><v>10.00</v>"));assertTrue(detail.contains("r=\"E3\" s=\"4\"><v>7.50</v>"));assertTrue(styles.contains("£"));assertTrue(styles.contains("€"));
            assertTrue(summary.contains("Grand total"));assertTrue(summary.contains("<v>10.00</v>"));assertTrue(summary.contains("<v>7.50</v>"));assertFalse("No combined total",summary.contains("17.50"));
        } finally {file.delete();}
    }
}
