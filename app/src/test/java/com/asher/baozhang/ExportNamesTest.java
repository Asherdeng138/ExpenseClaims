package com.asher.baozhang;

import org.junit.Test;
import static org.junit.Assert.*;

public class ExportNamesTest {
    @Test public void usesChosenRangeAcrossMonthsAndKeepsCategory() {
        assertEquals("2026-09-30至2026-10-10_出差餐补报账",ExportNames.base("出差餐补","2026-09-30","2026-10-10"));
        assertEquals("2026年10月_市内交通报账",ExportNames.base("市内交通（地铁）","2026-10-10","2026-10-10"));
        assertEquals("2026年1月_市内交通报账",ExportNames.base("市内交通（地铁）","2026-01-02","2026-01-28"));
        assertEquals("2026年10月至11月_市内交通报账",ExportNames.base("市内交通（地铁）","2026-10-10","2026-11-20"));
        assertEquals("2026年12月至2027年1月_市内交通报账",ExportNames.base("市内交通（地铁）","2026-12-10","2027-01-20"));
    }
    @Test public void englishNamesMatchTheParser() {
        assertEquals("2026-10-01_to_2026-10-31_Travel_Subsistence",ExportNames.base("出差餐补","2026-10-01","2026-10-31","en"));
        assertEquals("2026-10-01_to_2026-10-02_Long_Distance_Travel",ExportNames.base("市外交通","2026-10-01","2026-10-02","en"));
        assertEquals("2026-10-01_to_2026-10-02_Office_Supplies",ExportNames.base("办公用品","2026-10-01","2026-10-02","en"));
        assertEquals("2026-10-01_to_2026-10-02_Client_Entertainment",ExportNames.base("客户招待","2026-10-01","2026-10-02","en"));
        assertEquals("October_2026_Local_Travel",ExportNames.base("市内交通（地铁）","2026-10-10","2026-10-10","en"));
        assertEquals("October_to_November_2026_Local_Travel",ExportNames.base("市内交通（地铁）","2026-10-10","2026-11-20","en"));
        assertEquals("December_2026_to_January_2027_Local_Travel",ExportNames.base("市内交通（地铁）","2026-12-10","2027-01-20","en"));
        assertEquals("x_Receipts.pdf",ExportNames.pdf("x","en"));assertEquals("x_Summary.xlsx",ExportNames.xlsx("x","en"));assertEquals("x_发票合集.pdf",ExportNames.pdf("x","zh"));assertEquals("x_明细汇总.xlsx",ExportNames.xlsx("x","zh"));
        assertEquals("Travel subsistence",ExportNames.label("出差餐补","en"));assertEquals("出差餐补",ExportNames.label("出差餐补","zh"));
    }
    @Test public void rejectsInvalidRangeAndUnsafeCategory() {
        assertThrows(IllegalArgumentException.class,()->ExportNames.base("../x","2026-10-01","2026-10-10"));
        assertThrows(java.time.DateTimeException.class,()->ExportNames.base("出差餐补","2026-02-30","2026-10-10"));
        assertThrows(IllegalArgumentException.class,()->ExportNames.base("出差餐补","2026-10-11","2026-10-10"));
    }
}
