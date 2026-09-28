package com.oms.mainprompt.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.oms.mainprompt.dto.MainPromptRequest;
import com.oms.mainprompt.entity.MainPromptEntity;
import com.oms.mainprompt.service.MainPromptService;

@RestController
@RequestMapping("/api/mainprompt")
public class MainPromptController {

    @Autowired
    private MainPromptService service;

    @PostMapping("/create")
    public MainPromptEntity create(
            @RequestBody MainPromptRequest request) {

        MainPromptEntity entity = new MainPromptEntity();

        entity.setPromptName(request.getPromptName());
        entity.setPrompt(request.getPrompt());

        return service.save(entity);
    }

    @GetMapping("/getall")
    public List<MainPromptEntity> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public MainPromptEntity getById(
            @PathVariable Long id) {

        return service.getById(id);
    }

    @PutMapping("/update/{id}")
    public MainPromptEntity update(
            @PathVariable Long id,
            @RequestBody MainPromptEntity entity) {

        return service.update(id, entity);
    }

    @DeleteMapping("/delete/{id}")
    public String delete(
            @PathVariable Long id) {

        service.delete(id);

        return "Deleted Successfully";
    }
}