package com.oms.prompt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "PROMPT_TABLE")
public class PromptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="table_name")
    private String tableName;

    @Column(name="schema_prompt", columnDefinition = "TEXT")
    private String schemaPrompt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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