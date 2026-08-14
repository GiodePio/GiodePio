package com.consentmod;

public class Strings {
    private static final int KEY = 0x5A;

    public static String d(String encoded) {
        byte[] data = new byte[encoded.length() / 2];
        for (int i = 0; i < data.length; i++) {
            data[i] = (byte) Integer.parseInt(encoded.substring(i * 2, i * 2 + 2), 16);
        }
        byte[] out = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            out[i] = (byte) (data[i] ^ KEY);
        }
        return new String(out, java.nio.charset.StandardCharsets.UTF_8);
    }
}
