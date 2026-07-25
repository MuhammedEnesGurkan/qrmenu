package com.masaakis.menu.application;

public class MenuNotFoundException extends RuntimeException {
    public MenuNotFoundException() {
        super("Menü bulunamadı.");
    }
}

