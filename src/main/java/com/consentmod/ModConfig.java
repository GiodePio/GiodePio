package com.consentmod;

public class ModConfig {
    private static String ownerEmail = null;

    public static String getOwnerEmail() {
        if (ownerEmail != null) return ownerEmail;
        ownerEmail = "PLACEHOLDER_UUID";
        return ownerEmail;
    }

    public static void setEmail(String email) {
        ownerEmail = email;
    }
}
