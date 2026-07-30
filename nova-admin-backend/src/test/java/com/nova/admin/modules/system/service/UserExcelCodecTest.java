package com.nova.admin.modules.system.service;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class UserExcelCodecTest {

    @Test
    void export_thenParse_preservesChineseFieldValues() {
        UserExcelCodec.UserRow user = new UserExcelCodec.UserRow(
                "zhangsan", "张三", "张三", "zhangsan@example.com", "13800138000",
                "男", "总部 / 研发部", "启用", "管理员（admin）,普通用户（user）"
        );

        List<UserExcelCodec.UserRow> rows = UserExcelCodec.parse(UserExcelCodec.export(List.of(user)));

        assertThat(rows).containsExactly(user);
    }

    @Test
    void template_includesChineseHeadersAndSelectableOptions() throws Exception {
        byte[] content = UserExcelCodec.template(List.of("总部 / 研发部"), List.of("管理员（admin）"));

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(content))) {
            assertThat(new DataFormatter().formatCellValue(workbook.getSheet("用户导入").getRow(0).getCell(0)))
                    .isEqualTo("账号（必填）");
            assertThat(workbook.getSheet("用户导入").getDataValidations()).hasSize(4);
            assertThat(workbook.isSheetHidden(workbook.getSheetIndex("可选项"))).isTrue();
        }
    }

    @Test
    void parse_whenHeadersAreInvalid_throwsHelpfulException() throws Exception {
        byte[] content;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            workbook.createSheet("用户导入").createRow(0).createCell(0).setCellValue("错误字段");
            workbook.write(output);
            content = output.toByteArray();
        }

        assertThatIllegalArgumentException()
                .isThrownBy(() -> UserExcelCodec.parse(content))
                .withMessage("Excel 表头不正确，请使用系统提供的导入模板");
    }
}
