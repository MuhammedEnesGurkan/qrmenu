package com.masaakis.importer.application;

import com.masaakis.security.AppException;import org.apache.poi.xssf.usermodel.XSSFWorkbook;import org.junit.jupiter.api.Test;import java.io.ByteArrayOutputStream;import static org.assertj.core.api.Assertions.*;

class CatalogProFileParserTest{
 @Test void readsSafeXlsxAndRejectsFormula()throws Exception{assertThat(CatalogProService.xlsx(workbook(false))).hasSize(1);assertThatThrownBy(()->CatalogProService.xlsx(workbook(true))).isInstanceOf(AppException.class).hasMessageContaining("Formül");}
 private byte[]workbook(boolean formula)throws Exception{try(var w=new XSSFWorkbook();var out=new ByteArrayOutputStream()){var s=w.createSheet("Menu");var h=s.createRow(0);String[]headers={"sku","category","name","description","price","currency","active","available","allergens"};for(int i=0;i<headers.length;i++)h.createCell(i).setCellValue(headers[i]);var r=s.createRow(1);r.createCell(0).setCellValue("X1");r.createCell(1).setCellValue("İçe Aktarım");r.createCell(2).setCellValue("Ürün");r.createCell(4).setCellValue(42.5);r.createCell(5).setCellValue("TRY");if(formula)r.createCell(3).setCellFormula("1+1");w.write(out);return out.toByteArray();}}
}
