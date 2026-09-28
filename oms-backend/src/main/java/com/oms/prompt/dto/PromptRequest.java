package com.oms.prompt.dto;

public class PromptRequest {

    private String tableName;
    private String schemaPrompt;

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getSchemaPrompt() {
        return schemaPrompt;
    }

    public void setSchemaPrompt(String schemaPrompt) {
        this.schemaPrompt = schemaPrompt;
    }
}