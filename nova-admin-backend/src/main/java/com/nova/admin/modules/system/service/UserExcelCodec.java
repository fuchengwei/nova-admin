package com.nova.admin.modules.system.service;

import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Name;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** 用户导入导出 Excel 编解码。 */
public final class UserExcelCodec {

    public static final List<String> HEADERS = List.of(
            "账号（必填）", "昵称（必填）", "姓名（可选）", "邮箱（可选）", "手机号（可选）",
            "性别（可选）", "部门（可选）", "状态（可选）", "角色（可选，可多选）");
    private static final String TEMPLATE_SHEET = "用户导入";
    private static final String OPTIONS_SHEET = "可选项";
    private static final int MAX_IMPORT_ROWS = 1000;

    static {
        ZipSecureFile.setMinInflateRatio(0.01d);
    }

    private UserExcelCodec() {
    }

    public record UserRow(String account, String nickname, String realName, String email, String phone,
                          String gender, String department, String status, String roles) {
    }

    public static byte[] template(List<String> departments, List<String> roles) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = createMainSheet(workbook);
            Sheet options = workbook.createSheet(OPTIONS_SHEET);
            writeOptions(options, departments, roles);
            addValidations(workbook, sheet, departments, roles);
            workbook.setSheetHidden(workbook.getSheetIndex(options), true);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("生成用户导入模板失败", ex);
        }
    }

    public static byte[] export(List<UserRow> users) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = createMainSheet(workbook);
            for (int index = 0; index < users.size(); index++) {
                UserRow user = users.get(index);
                Row row = sheet.createRow(index + 1);
                writeRow(row, user);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("导出用户失败", ex);
        }
    }

    public static List<UserRow> parse(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("导入文件不能为空");
        }
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheet(TEMPLATE_SHEET);
            if (sheet == null) {
                throw new IllegalArgumentException("未找到用户导入工作表，请使用系统提供的导入模板");
            }
            validateHeaders(sheet.getRow(0));

            DataFormatter formatter = new DataFormatter();
            List<UserRow> rows = new ArrayList<>();
            for (int index = 1; index <= sheet.getLastRowNum(); index++) {
                Row row = sheet.getRow(index);
                if (isBlank(row, formatter)) {
                    continue;
                }
                if (hasExtraValue(row, formatter)) {
                    throw new IllegalArgumentException("第" + (index + 1) + "行存在多余列");
                }
                rows.add(new UserRow(
                        value(row, 0, formatter), value(row, 1, formatter), value(row, 2, formatter),
                        value(row, 3, formatter), value(row, 4, formatter), value(row, 5, formatter),
                        value(row, 6, formatter), value(row, 7, formatter), value(row, 8, formatter)
                ));
            }
            return rows;
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("导入文件格式不正确，请下载并填写系统提供的 Excel 模板", ex);
        }
    }

    private static Sheet createMainSheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet(TEMPLATE_SHEET);
        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, 0, 0, HEADERS.size() - 1));

        Row header = sheet.createRow(0);
        CellStyle style = createHeaderStyle(workbook);
        for (int index = 0; index < HEADERS.size(); index++) {
            Cell cell = header.createCell(index);
            cell.setCellValue(HEADERS.get(index));
            cell.setCellStyle(style);
            sheet.setColumnWidth(index, index == 8 ? 28 * 256 : 18 * 256);
        }
        return sheet;
    }

    private static CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.GREY_50_PERCENT.getIndex());
        return style;
    }

    private static void writeRow(Row row, UserRow user) {
        List<String> values = List.of(
                empty(user.account()), empty(user.nickname()), empty(user.realName()), empty(user.email()),
                empty(user.phone()), empty(user.gender()), empty(user.department()), empty(user.status()),
                empty(user.roles())
        );
        for (int index = 0; index < values.size(); index++) {
            row.createCell(index).setCellValue(values.get(index));
        }
    }

    private static void writeOptions(Sheet sheet, List<String> departments, List<String> roles) {
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("部门");
        header.createCell(1).setCellValue("角色");
        int rows = Math.max(departments.size(), roles.size());
        for (int index = 0; index < rows; index++) {
            Row row = sheet.createRow(index + 1);
            if (index < departments.size()) {
                row.createCell(0).setCellValue(departments.get(index));
            }
            if (index < roles.size()) {
                row.createCell(1).setCellValue(roles.get(index));
            }
        }
    }

    private static void addValidations(Workbook workbook, Sheet sheet, List<String> departments, List<String> roles) {
        DataValidationHelper helper = sheet.getDataValidationHelper();
        addExplicitValidation(helper, sheet, 5, List.of("未知", "男", "女"));
        addExplicitValidation(helper, sheet, 7, List.of("启用", "停用"));
        addNamedValidation(workbook, helper, sheet, 6, "user_import_departments", "A", departments.size());
        addNamedValidation(workbook, helper, sheet, 8, "user_import_roles", "B", roles.size());
    }

    private static void addExplicitValidation(DataValidationHelper helper, Sheet sheet, int column, List<String> values) {
        DataValidationConstraint constraint = helper.createExplicitListConstraint(values.toArray(String[]::new));
        addValidation(sheet, helper.createValidation(constraint, dataRange(column)));
    }

    private static void addNamedValidation(Workbook workbook, DataValidationHelper helper, Sheet sheet,
                                           int column, String name, String optionColumn, int optionSize) {
        if (optionSize == 0) {
            return;
        }
        Name namedRange = workbook.createName();
        namedRange.setNameName(name);
        namedRange.setRefersToFormula("'" + OPTIONS_SHEET + "'!$" + optionColumn + "$2:$" + optionColumn + "$" + (optionSize + 1));
        DataValidationConstraint constraint = helper.createFormulaListConstraint(name);
        addValidation(sheet, helper.createValidation(constraint, dataRange(column)));
    }

    private static CellRangeAddressList dataRange(int column) {
        return new CellRangeAddressList(1, MAX_IMPORT_ROWS, column, column);
    }

    private static void addValidation(Sheet sheet, DataValidation validation) {
        validation.setShowErrorBox(true);
        validation.setErrorStyle(DataValidation.ErrorStyle.STOP);
        sheet.addValidationData(validation);
    }

    private static void validateHeaders(Row header) {
        if (header == null) {
            throw new IllegalArgumentException("导入模板缺少表头");
        }
        DataFormatter formatter = new DataFormatter();
        for (int index = 0; index < HEADERS.size(); index++) {
            if (!HEADERS.get(index).equals(value(header, index, formatter))) {
                throw new IllegalArgumentException("Excel 表头不正确，请使用系统提供的导入模板");
            }
        }
    }

    private static boolean isBlank(Row row, DataFormatter formatter) {
        if (row == null) {
            return true;
        }
        for (int index = 0; index < HEADERS.size(); index++) {
            if (!value(row, index, formatter).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static boolean hasExtraValue(Row row, DataFormatter formatter) {
        if (row == null || row.getLastCellNum() <= HEADERS.size()) {
            return false;
        }
        for (int index = HEADERS.size(); index < row.getLastCellNum(); index++) {
            if (!value(row, index, formatter).isBlank()) {
                return true;
            }
        }
        return false;
    }

    private static String value(Row row, int index, DataFormatter formatter) {
        if (row == null) {
            return "";
        }
        Cell cell = row.getCell(index, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return cell == null ? "" : formatter.formatCellValue(cell).trim();
    }

    private static String empty(String value) {
        return value == null ? "" : value;
    }
}
