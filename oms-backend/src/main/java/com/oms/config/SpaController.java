package com.oms.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/dashboard",
        "/orders",
        "/order/create",
        "/order/update",
        "/order/eye",
        "/order/history",
        "/order/history/*",
        "/notifications",
        "/aoi",
        "/users",
        "/login",
        "/map-view"
    })
    public String forward() {
        return "forward:/index.html";
    }
}