package com.oms.mainprompt.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "MAIN_PROMPT")
public class MainPromptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prompt_name")
    private String promptName;

    @Column(name = "prompt", columnDefinition = "TEXT")
    private String prompt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPromptName() {
        return promptName;
    }

    public void setPromptName(String promptName) {
        this.promptName = promptName;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }
}