package com.oms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @org.springframework.beans.factory.annotation.Value("${tiles.base-path:C:/oms-tiles}")
    private String tilesBasePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/Saudi_tiles/**")
                .addResourceLocations("file:" + tilesBasePath + "/Saudi_tiles/");

        registry.addResourceHandler("/tiles/**")
                .addResourceLocations("file:" + tilesBasePath + "/tiles/");

        registry.addResourceHandler("/india_tiles/**")
                .addResourceLocations("file:" + tilesBasePath + "/india_tiles/");
    }
}