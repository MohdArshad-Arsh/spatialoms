package com.oms.prompt.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.oms.prompt.dto.PromptRequest;
import com.oms.prompt.entity.PromptEntity;
import com.oms.prompt.service.PromptService;

@RestController
@RequestMapping("/api/prompts")
public class PromptController {

    @Autowired
    private PromptService promptService;

    @PostMapping("/createPrompt")
    public PromptEntity createPrompt(
            @RequestBody PromptRequest request) {

        PromptEntity prompt = new PromptEntity();

        prompt.setTableName(request.getTableName());
        prompt.setSchemaPrompt(request.getSchemaPrompt());

        return promptService.save(prompt);
    }

    @GetMapping("/getall")
    public List<PromptEntity> getAllPrompts() {
        return promptService.getAll();
    }

    @GetMapping("/{id}")
    public PromptEntity getPrompt(@PathVariable Long id) {
        return promptService.getById(id);
    }

    @PutMapping("/updatePrompt/{id}")
    public PromptEntity updatePrompt(
            @PathVariable Long id,
            @RequestBody PromptEntity prompt) {

        return promptService.update(id, prompt);
    }

    @DeleteMapping("/deletePrompt/{id}")
    public String deletePrompt(@PathVariable Long id) {

        promptService.delete(id);

        return "Deleted Successfully";
    }
}